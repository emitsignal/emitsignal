# Build context must be the monorepo root.
# docker build -f packages/emitsignal-docker/server.Dockerfile .

# ── Stage 1: Install the server's production dependencies only ─────────────────
# Pinned + slim: a rolling `oven/bun:1` tag changes digest on every upstream 1.x
# release, busting the whole build cache; pin to a known-good version.
FROM oven/bun:1.4.0-slim AS deps

WORKDIR /app

# Copy the root manifest + lockfile, then ONLY the manifests for the server's
# own workspace graph: server + shared + emails. The other workspaces (mobile,
# website, e2e, docs) are deliberately absent, so bun never resolves their deps
# (Expo/React Native, Vite, Playwright) into this image.
COPY package.json bun.lock ./
COPY packages/emitsignal-server/package.json  ./packages/emitsignal-server/
COPY packages/emitsignal-emails/package.json  ./packages/emitsignal-emails/
COPY packages/emitsignal-shared/package.json  ./packages/emitsignal-shared/

# Strip devDependencies from every remaining manifest — bun installs workspace
# devDependencies even with --production, and emails' devDep `@react-email/ui`
# pulls Next.js (~240 MB). Also drop the root's mobile-only patchedDependencies
# (expo-router / react-native-screens), which would fail to resolve once mobile
# is excluded.
RUN bun pm pkg delete devDependencies patchedDependencies \
 && (cd packages/emitsignal-server && bun pm pkg delete devDependencies) \
 && (cd packages/emitsignal-emails  && bun pm pkg delete devDependencies) \
 && (cd packages/emitsignal-shared  && bun pm pkg delete devDependencies)

# Install the pruned production graph. The lockfile is removed first: the
# workspace set and manifests were trimmed above so it no longer matches, and the
# base image forces --frozen-lockfile; resolving fresh sidesteps that.
RUN rm -f bun.lock && bun install --production

# ── Stage 2: Production image ─────────────────────────────────────────────────
FROM oven/bun:1.4.0-slim

WORKDIR /app

# The -slim base omits OpenSSL/CA certs that Prisma's schema-engine needs for
# `prisma generate` and the `prisma migrate deploy` that runs at container start.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

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

# Drop root: run as the unprivileged `bun` user shipped by the base image. chown
# the whole app tree (incl. the uploads dir, which backs a named volume) so the
# runtime user can read code and write uploads.
RUN chown -R bun:bun /app
USER bun

EXPOSE 5100

# Default: start the API server. Migrations run in the one-shot `migrate` service
# (see docker-compose.yml), so they are intentionally NOT in this CMD.
CMD ["bun", "src/index.ts"]
