import Elysia, { t } from 'elysia';

import { authPlugin } from '#/http/auth/plugin';
import { prisma } from '#/lib/prisma';
import {
    parseSubscriptionSettings,
    serializeSubscriptionSettings,
} from '#/utils/subscription-settings';

export const updateSubscription = new Elysia({ prefix: '/subscriptions' }).use(authPlugin).patch(
    '/:id',
    async ({ body, params, status, userId }) => {
        const subscription = await prisma.subscription.findUnique({
            include: { topic: true },
            where: { id: params.id },
        });

        if (!subscription) {
            return status(404, { error: 'not_found' });
        }

        const ownsByUser = userId !== null && subscription.userId === userId;

        const ownsByDevice =
            userId === null &&
            body.deviceId !== undefined &&
            subscription.deviceId === body.deviceId;

        if (!ownsByUser && !ownsByDevice) {
            return status(403, { error: 'forbidden' });
        }

        const settings = serializeSubscriptionSettings({
            ...parseSubscriptionSettings(subscription.settings),
            ...body.settings,
        });

        const updated = await prisma.subscription.update({
            data: {
                pushEnabled: body.pushEnabled ?? subscription.pushEnabled,
                settings,
            },
            include: { topic: true },
            where: { id: subscription.id },
        });

        return {
            id: updated.id,
            pushEnabled: updated.pushEnabled,
            settings: parseSubscriptionSettings(updated.settings),
            topic: {
                accessMode: updated.topic.accessMode,
                description: updated.topic.description,
                displayName: updated.topic.displayName,
                id: updated.topic.id,
                isOwner: userId !== null && updated.topic.ownerId === userId,
                name: updated.topic.name,
                ownerId: updated.topic.ownerId,
            },
        };
    },
    {
        authOptional: true,
        body: t.Object({
            deviceId: t.Optional(t.String({ minLength: 1 })),
            pushEnabled: t.Optional(t.Boolean()),
            settings: t.Optional(
                t.Object({
                    description: t.Optional(t.String({ maxLength: 280 })),
                    listenSince: t.Optional(
                        t.Union([t.Literal('always'), t.Literal('subscription_date')]),
                    ),
                }),
            ),
        }),
        params: t.Object({ id: t.String({ minLength: 1 }) }),
    },
);
