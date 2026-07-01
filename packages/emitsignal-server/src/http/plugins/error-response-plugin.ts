import Elysia from 'elysia';

// Register after loggerPlugin: Elysia stops at the first onError that returns a value.
export const errorResponsePlugin = new Elysia({ name: 'error-response' })
    .onError(({ code, request, set }) => {
        const path = new URL(request.url).pathname;

        if (code === 'NOT_FOUND') {
            set.status = 404;

            return { error: 'Not Found', path, status: 404 };
        }

        if (code === 'VALIDATION') {
            set.status = 422;

            return { error: 'Validation Error', status: 422 };
        }

        if (code === 'PARSE' || code === 'INVALID_COOKIE_SIGNATURE') {
            set.status = 400;

            return { error: 'Bad Request', status: 400 };
        }

        set.status = 500;

        return { error: 'Internal Server Error', status: 500 };
    })
    .as('global');
