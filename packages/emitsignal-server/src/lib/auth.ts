import { apiKey } from '@better-auth/api-key';
import { expo } from '@better-auth/expo';
import { passkey } from '@better-auth/passkey';
import { stripe } from '@better-auth/stripe';
import { MagicLinkEmail, render } from '@emitsignal/emails';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { APIError, createAuthMiddleware, isAPIError } from 'better-auth/api';
import { bearer, emailOTP } from 'better-auth/plugins';
import path from 'node:path';
import { createElement } from 'react';
import Stripe from 'stripe';

import { environment } from '../schema/environment';
import { API_KEY_PREFIX, getApiKeyFromHeaders } from './api-key-header';
import { invalidateUserPlanCache } from './billing/get-user-plan';
import { isStripeBillingEnabled, stripePlanConfig } from './billing/plans';
import { duration } from './duration';
import { isEmailAllowed } from './email-allowlist';
import { EmailService } from './email-service';
import { getClientIP } from './ip';
import { prisma } from './prisma';
import { purgeQueue } from './queue';
import { enforceAuthRateLimit, magicLinkLimiter, verifyLimiter } from './rate-limit';
import { sendApiKeyCreatedEmail } from './send-api-key-created-email';

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

// Shared parent domain for auth cookies, derived from the website host
// (APP_URL). Scoping the cookie here lets it reach both the website apex and
// the API subdomain (e.g. `emitsignal.com` + `api.emitsignal.com`); without it
// the cookie is host-only to the API and the website's SSR cannot read it.
// Skipped in dev, where the API and website share `localhost` (port-agnostic).
const cookieDomain = rpHostname === 'localhost' || !rpHostname.includes('.') ? '' : rpHostname;

export const auth = betterAuth({
    advanced: {
        ipAddress: { disableIpTracking: true },
        ...(cookieDomain
            ? {
                  crossSubDomainCookies: {
                      domain: cookieDomain,
                      enabled: true,
                  },
              }
            : {}),
    },
    baseURL: environment.API_URL,
    database: prismaAdapter(prisma as Parameters<typeof prismaAdapter>[0], {
        provider: 'postgresql',
    }),
    hooks: {
        // Send a security-alert email whenever a new API key is issued. The
        // create endpoint returns the key record (incl. owner `referenceId`),
        // which we hand off to the email helper.
        after: createAuthMiddleware(async (ctx) => {
            if (ctx.path !== '/api-key/create') {
                return;
            }

            const returned = ctx.context.returned;

            if (!returned || isAPIError(returned)) {
                return;
            }

            await sendApiKeyCreatedEmail(returned);
        }),
        before: createAuthMiddleware(async (ctx) => {
            // No Bun `server` here, so getClientIP falls back through the proxy
            // headers (cf-connecting-ip / x-real-ip / x-forwarded-for); dev
            // localhost resolves to 'unknown', which is fine since the send key
            // also includes the email.
            const clientIp = ctx.request ? getClientIP(ctx.request, null) : 'unknown';

            // Throttle OTP code-guessing (brute-force) — keyed by IP.
            if (ctx.path === '/email-otp/verify-otp') {
                await enforceAuthRateLimit(verifyLimiter, clientIp);

                return;
            }

            if (ctx.path !== '/email-otp/send-verification-otp') {
                return;
            }

            if (ctx.body?.type !== 'sign-in') {
                return;
            }

            const email = ctx.body?.email;

            // Throttle OTP sends to block email spam — keyed by IP + email.
            // Runs before the allowlist check so abuse is capped regardless.
            await enforceAuthRateLimit(
                magicLinkLimiter,
                `${clientIp}:${typeof email === 'string' ? email : ''}`,
            );

            if (typeof email === 'string' && !isEmailAllowed(email)) {
                throw new APIError('FORBIDDEN', {
                    message: 'This email address is not allowed to sign in.',
                });
            }
        }),
    },
    plugins: [
        // Mobile clients can't set the `Origin` header, so `@better-auth/expo`'s
        // client sends it as `expo-origin`; this server plugin copies it back to
        // `origin` before the origin check runs. Without it, mobile requests fail
        // with `MISSING_OR_NULL_ORIGIN`.
        expo(),
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
            startingCharactersConfig: { charactersLength: API_KEY_PREFIX.length + 8 },
        }),
        passkey({
            origin: environment.APP_URL,
            rpID: rpHostname,
            rpName: 'EmitSignal',
        }),
        ...stripePlugins,
    ],
    secret: environment.BETTER_AUTH_SECRET,
    session: {
        cookieCache: {
            enabled: true,
            maxAge: duration.minutes(5).as('seconds'),
        },
    },
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
    trustedOrigins: [
        environment.APP_URL, // website browser origin (cookie-based web auth)
        'emitsignal://', // mobile app deep-link scheme (app.config.ts `scheme`)
        'exp://', // Expo Go / dev client
        ...(process.env.NODE_ENV === 'production' ? [] : ['*']),
    ],
    user: {
        additionalFields: {
            onboarded: { defaultValue: false, required: false, type: 'boolean' },
        },
        deleteUser: {
            // Deleting the User row cascades to every owned record in the database
            // (topics, messages, push tokens, subscriptions, acknowledgments, API
            // keys, passkeys, accounts, sessions, topic access, webhooks). Here we
            // capture the orphaned storage files and Stripe rows that the DB cascade
            // can't reach, then hand the file cleanup to the async purge queue.
            beforeDelete: async (user) => {
                const attachments = await prisma.attachment.findMany({
                    select: { storageKey: true },
                    where: {
                        message: {
                            OR: [{ senderId: user.id }, { topic: { ownerId: user.id } }],
                        },
                    },
                });

                const avatarKey = user.image
                    ? `avatars/${user.id}${path.extname(new URL(user.image).pathname)}`
                    : undefined;

                await purgeQueue.add('purge-storage', {
                    avatarKey,
                    kind: 'storage',
                    storageKeys: attachments.map((attachment) => attachment.storageKey),
                });

                // Stripe subscription rows are keyed by referenceId, not a User FK,
                // so they don't cascade — remove them explicitly.
                await prisma.planSubscription.deleteMany({ where: { referenceId: user.id } });
            },
            enabled: true,
        },
    },
});

export type Auth = typeof auth;
