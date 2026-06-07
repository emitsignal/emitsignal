import { apiKey } from '@better-auth/api-key';
import { passkey } from '@better-auth/passkey';
import { MagicLinkEmail, render } from '@emitsignal/emails';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { bearer, emailOTP } from 'better-auth/plugins';
import { createElement } from 'react';

import { environment } from '../schema/environment';
import { duration } from './duration';
import { EmailService } from './email-service';
import { prisma } from './prisma';

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

                const verifyUrl = `${environment.APP_URL}/verify?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(JSON.stringify(otp))}`;
                const html = await render(
                    createElement(MagicLinkEmail, {
                        code: otp,
                        email,
                        expiresAt: new Date(Date.now() + duration.minutes(10).as('ms')),
                        magicLinkUrl: verifyUrl,
                    }),
                );

                await EmailService.send({
                    from: environment.EMAIL_FROM,
                    html,
                    subject: 'Sign in to EmitSignal',
                    to: email,
                });
            },
        }),
        apiKey(),
        passkey({
            origin: environment.APP_URL,
            rpID: rpHostname,
            rpName: 'EmitSignal',
        }),
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
