import { apiKey } from '@better-auth/api-key';
import { passkey } from '@better-auth/passkey';
import { stripe } from '@better-auth/stripe';
import { MagicLinkEmail, render } from '@emitsignal/emails';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { bearer, emailOTP } from 'better-auth/plugins';
import { createElement } from 'react';
import Stripe from 'stripe';

import { environment } from '../schema/environment';
import { API_KEY_PREFIX, getApiKeyFromHeaders } from './api-key-header';
import { invalidateUserPlanCache } from './billing/get-user-plan';
import { isStripeBillingEnabled, stripePlanConfig } from './billing/plans';
import { duration } from './duration';
import { EmailService } from './email-service';
import { prisma } from './prisma';

// Paid plans only exist when Stripe is fully configured; without the env vars
// the server boots with every user on the free plan.
const stripePlugins = isStripeBillingEnabled()
    ? [
          stripe({
              createCustomerOnSignUp: true,
              schema: { subscription: { modelName: 'planSubscription' } },
              stripeClient: new Stripe(environment.STRIPE_SECRET_KEY as string),
              stripeWebhookSecret: environment.STRIPE_WEBHOOK_SECRET as string,
              subscription: {
                  enabled: true,
                  onSubscriptionCancel: async ({ subscription }) => {
                      await invalidateUserPlanCache(subscription.referenceId);
                  },
                  onSubscriptionComplete: async ({ subscription }) => {
                      await invalidateUserPlanCache(subscription.referenceId);
                  },
                  onSubscriptionDeleted: async ({ subscription }) => {
                      await invalidateUserPlanCache(subscription.referenceId);
                  },
                  onSubscriptionUpdate: async ({ subscription }) => {
                      await invalidateUserPlanCache(subscription.referenceId);
                  },
                  plans: stripePlanConfig(),
              },
          }),
      ]
    : [];

const rpHostname = (() => {
    try {
        return new URL(environment.APP_URL).hostname;
    } catch {
        return 'localhost';
    }
})();

export const auth = betterAuth({
    baseURL: environment.BETTER_AUTH_URL,
    database: prismaAdapter(prisma as Parameters<typeof prismaAdapter>[0], {
        provider: 'postgresql',
    }),
    plugins: [
        bearer(),
        emailOTP({
            expiresIn: duration.minutes(10).as('seconds'),
            sendVerificationOTP: async ({ email, otp, type }) => {
                if (type !== 'sign-in') {
                    return;
                }

                const magicLinkUrl = `${environment.APP_URL}/verify?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(JSON.stringify(otp))}`;

                await EmailService.send({
                    from: environment.EMAIL_FROM,
                    html: await render(
                        createElement(MagicLinkEmail, {
                            code: otp,
                            email,
                            expiresAt: new Date(Date.now() + duration.minutes(10).as('ms')),
                            magicLinkUrl,
                        }),
                    ),
                    subject: 'Sign in to EmitSignal',
                    to: email,
                });
            },
        }),
        apiKey({
            customAPIKeyGetter: (ctx) => getApiKeyFromHeaders(ctx.headers),
            defaultPrefix: API_KEY_PREFIX,
            enableSessionForAPIKeys: true,
            // Throttling is handled by the project's rate-limiter-flexible
            // (per-user) and plan quotas; the plugin's default 10/day per-key
            // limiter would otherwise lock keys after a handful of requests.
            rateLimit: { enabled: false },
        }),
        passkey({
            origin: environment.APP_URL,
            rpID: rpHostname,
            rpName: 'EmitSignal',
        }),
        ...stripePlugins,
    ],
    secret: environment.BETTER_AUTH_SECRET,
    socialProviders: {
        ...(environment.GITHUB_CLIENT_ID && environment.GITHUB_CLIENT_SECRET
            ? {
                  github: {
                      clientId: environment.GITHUB_CLIENT_ID,
                      clientSecret: environment.GITHUB_CLIENT_SECRET,
                  },
              }
            : {}),
    },
    trustedOrigins: ['*'],
    user: {
        deleteUser: { enabled: true },
    },
});

export type Auth = typeof auth;
