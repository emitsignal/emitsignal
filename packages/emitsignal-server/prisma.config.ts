import { defineConfig } from 'prisma/config';

export default defineConfig({
    datasource: {
        url: process.env['DATABASE_URL'] ?? 'file:./db/emitsignal-dev.db',
    },
    migrations: {
        path: 'prisma/migrations',
    },
    schema: 'prisma/schema.prisma',
});
