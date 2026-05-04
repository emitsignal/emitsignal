import { defineConfig } from "prisma/config";

export default defineConfig({
    datasource: {
        url: process.env["DATABASE_URL"] ?? "file:./dev.db",
    },
    migrations: {
        path: "prisma/migrations",
    },
    schema: "prisma/schema.prisma",
});
