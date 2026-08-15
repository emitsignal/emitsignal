import { apiKey } from '@better-auth/api-key';
import { expo } from '@better-auth/expo';
import { passkey } from '@better-auth/passkey';
import { stripe } from '@better-auth/stripe';
import { MagicLinkEmail, render } from '@emitsignal/emails';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { APIError, createAuthMiddleware, isAPIError } from 'better-auth/api';
import { bearer, emailOTP } from 'better-auth/plugins';
import { importPKCS8, SignJWT } from 'jose';
import path from 'node:path';
import { createElement } from 'react';
import Stripe from 'stripe';

import { logger } from '#/lib/logger';
import { captureTraceContext } from '#/lib/trace-context';
import { environment, isProduction } from '#/schema/environment';
import { invalidateUserPlanCache } from '#/services/billing/get-user-plan';
import { isStripeBillingEnabled, stripePlanConfig } from '#/services/billing/plans';
import { sendAccountDeletedEmail } from '#/services/emails/account-deleted';
import { sendApiKeyCreatedEmail } from '#/services/emails/api-key-created';
import { API_KEY_PREFIX, getApiKeyFromHeaders } from '#/utils/api-key-header';
import { duration } from '#/utils/duration';
import { isEmailAllowed } from '#/utils/email-allowlist';
import { getClientIP } from '#/utils/ip';

import { EmailService } from './email-service';
import { prisma } from './prisma';
import { purgeQueue } from './queue';
import { enforceAuthRateLimit, magicLinkLimiter, verifyLimiter } from './rate-limit';

// Paid plans only exist when Stripe is fully configured; without the env vars
// the server boots with every user on the free plan.
const stripePlugins = isStripeBillingEnabled()
    ? [
          stripe({
              createCustomerOnSignUp: false,
              schema: { subscription: { modelName: 'planSubscription' } },
              stripeClient: new Stripe(environment.STRIPE_SECRET_KEY as string),
              stripeWebhookSecret: environment.STRIPE_WEBHOOK_SECRET as string,
              subscription: {
                  enabled: true,
                  onSubscriptionCancel: async ({ subscription }) => {
                      logger.info(
                          {
                              event: 'cancelled',
                              plan: subscription.plan,
                              userId: subscription.referenceId,
                          },
                          'subscription changed',
                      );

                      await invalidateUserPlanCache(subscription.referenceId);
                  },
                  onSubscriptionComplete: async ({ subscription }) => {
                      logger.info(
                          {
                              event: 'completed',
                              plan: subscription.plan,
                              userId: subscription.referenceId,
                          },
                          'subscription changed',
                      );

                      await invalidateUserPlanCache(subscription.referenceId);
                  },
                  onSubscriptionDeleted: async ({ subscription }) => {
                      logger.info(
                          {
                              event: 'deleted',
                              plan: subscription.plan,
                              userId: subscription.referenceId,
                          },
                          'subscription changed',
                      );

                      await invalidateUserPlanCache(subscription.referenceId);
                  },
                  onSubscriptionUpdate: async ({ subscription }) => {
                      logger.info(
                          {
                              event: 'updated',
                              plan: subscription.plan,
                              userId: subscription.referenceId,
                          },
                          'subscription changed',
                      );

                      await invalidateUserPlanCache(subscription.referenceId);
                  },
                  plans: stripePlanConfig(),
              },
          }),
      ]
    : [];

// Apple Sign In is enabled only when all four credentials are present. The
// Service ID (clientId), Team ID, Key ID, and PKCS#8 private key together let us
// mint the client-secret JWT Apple requires in place of a static secret.
const isAppleAuthEnabled = Boolean(
    environment.APPLE_CLIENT_ID &&
    environment.APPLE_TEAM_ID &&
    environment.APPLE_KEY_ID &&
    environment.APPLE_PRIVATE_KEY,
);

// Apple rejects client-secret JWTs that expire more than six months out; we use
// 180 days. Better Auth calls this each time it configures the provider, so the
// token is regenerated on boot rather than baked in as a static string.
const generateAppleClientSecret = async (): Promise<string> => {
    const key = await importPKCS8(environment.APPLE_PRIVATE_KEY as string, 'ES256');
    const nowInSeconds = Math.floor(Date.now() / 1000);

    return new SignJWT({})
        .setProtectedHeader({ alg: 'ES256', kid: environment.APPLE_KEY_ID })
        .setIssuer(environment.APPLE_TEAM_ID as string)
        .setSubject(environment.APPLE_CLIENT_ID as string)
        .setAudience('https://appleid.apple.com')
        .setIssuedAt(nowInSeconds)
        .setExpirationTime(nowInSeconds + duration.days(180).as('seconds'))
        .sign(key);
};

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

            logger.info({ userId: ctx.context.session?.user.id }, 'api key created');

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
                logger.warn('sign-in blocked by the email allowlist');

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
        expiresIn: duration.days(30).as('seconds'),
        updateAge: duration.days(1).as('seconds'),
    },
    socialProviders: {
        ...(isAppleAuthEnabled
            ? {
                  // Async provider form: Better Auth awaits this to mint the
                  // client-secret JWT from the private key on each configuration.
                  apple: async () => ({
                      appBundleIdentifier: environment.APPLE_APP_BUNDLE_IDENTIFIER,
                      clientId: environment.APPLE_CLIENT_ID as string,
                      clientSecret: await generateAppleClientSecret(),
                  }),
              }
            : {}),
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
        environment.APP_URL,
        'emitsignal://',
        'emitsignal-preview://',
        'exp://',
        ...(isAppleAuthEnabled ? ['https://appleid.apple.com'] : []),
        ...(isProduction ? [] : ['*']),
    ],
    user: {
        additionalFields: {
            onboarded: { defaultValue: false, required: false, type: 'boolean' },
        },
        deleteUser: {
            afterDelete: async (user) => {
                await sendAccountDeletedEmail(user);
            },
            beforeDelete: async (user) => {
                logger.info({ userId: user.id }, 'deleting account');

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
                    traceContext: captureTraceContext(),
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
