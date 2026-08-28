import Elysia, { t } from 'elysia';

import { authPlugin } from '#/http/auth/plugin';
import { topicNameCache } from '#/lib/cache';
import { prisma } from '#/lib/prisma';

export const updateTopic = new Elysia().use(authPlugin).patch(
    '/topics/:name',
    async ({ body, params, status, userId }) => {
        const name = params.name.toLowerCase();
        const topic = await prisma.topic.findUnique({ where: { name } });

        if (!topic) {
            return status(404, { error: 'topic_not_found' });
        }

        if (topic.ownerId !== userId) {
            return status(403, { error: 'forbidden' });
        }

        const updated = await prisma.topic.update({
            data: {
                accessMode: body.accessMode ?? undefined,
                description: body.description ?? undefined,
                displayName: body.displayName ?? undefined,
            },
            where: { id: topic.id },
        });

        topicNameCache.delete(name);

        return {
            accessMode: updated.accessMode,
            createdAt: updated.createdAt.getTime(),
            description: updated.description,
            displayName: updated.displayName,
            id: updated.id,
            isOwner: true,
            name: updated.name,
            ownerId: updated.ownerId,
        };
    },
    {
        authRequired: true,
        body: t.Object({
            accessMode: t.Optional(
                t.Union([t.Literal('public'), t.Literal('readonly'), t.Literal('private')]),
            ),
            description: t.Optional(t.String({ maxLength: 280 })),
            displayName: t.Optional(t.String({ maxLength: 120 })),
        }),
        params: t.Object({ name: t.String() }),
    },
);
