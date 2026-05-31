# Build context must be the monorepo root.
# docker build -f packages/emitsignal-docker/server.Dockerfile .

# ── Stage 1: Install dependencies ────────────────────────────────────────────
FROM oven/bun:1 AS deps

WORKDIR /app

# Copy workspace manifest and lockfile first to maximise layer cache hits
COPY package.json bun.lock ./

# Copy all workspace package manifests so bun can validate the lockfile
COPY packages/emitsignal-docker/package.json    ./packages/emitsignal-docker/
COPY packages/emitsignal-docs/package.json      ./packages/emitsignal-docs/
COPY packages/emitsignal-e2e-testing/package.json ./packages/emitsignal-e2e-testing/
COPY packages/emitsignal-emails/package.json    ./packages/emitsignal-emails/
COPY packages/emitsignal-mobile/package.json    ./packages/emitsignal-mobile/
COPY packages/emitsignal-server/package.json    ./packages/emitsignal-server/
COPY packages/emitsignal-shared/package.json    ./packages/emitsignal-shared/
COPY packages/emitsignal-website/package.json   ./packages/emitsignal-website/

# Install all workspace dependencies (hoisted to /app/node_modules by Bun)
RUN bun install --frozen-lockfile

# ── Stage 2: Production image ─────────────────────────────────────────────────
FROM oven/bun:1

WORKDIR /app

ENV PATH="/app/packages/emitsignal-server/node_modules/.bin:/app/node_modules/.bin:${PATH}"

# Copy installed modules from the deps stage (root-hoisted + package-level)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/emitsignal-server/node_modules ./packages/emitsignal-server/node_modules
COPY --from=deps /app/packages/emitsignal-emails/node_modules  ./packages/emitsignal-emails/node_modules

# Copy root manifest (required for workspace resolution at runtime)
COPY package.json ./

# Copy workspace packages consumed by the server
COPY packages/emitsignal-emails/  ./packages/emitsignal-emails/
COPY packages/emitsignal-server/  ./packages/emitsignal-server/
COPY packages/emitsignal-shared/  ./packages/emitsignal-shared/

WORKDIR /app/packages/emitsignal-server

# Generate the Prisma client at build time so it is baked into the image.
# The output path (src/generated/prisma/) is defined in prisma/schema.prisma.
RUN prisma generate

# Ensure runtime directories exist for SQLite (dev) and local file uploads
RUN mkdir -p db uploads

EXPOSE 5100

# Default: apply pending migrations then start the API server.
# The worker service overrides this CMD in docker-compose.yml.
CMD ["sh", "-c", "prisma migrate deploy && bun src/index.ts"]
