import * as Sentry from '@sentry/tanstackstart-react';

if (import.meta.env.VITE_SENTRY_ENABLED === 'true' && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        environment: import.meta.env.MODE,
        tracesSampleRate: 0.1,
    });
}
