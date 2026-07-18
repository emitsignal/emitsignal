# Build context must be the monorepo root.
# docker build -f packages/emitsignal-docker/website.Dockerfile .

# ── Stage 1: Build the TanStack Start / Nitro SSR bundle ──────────────────────
# Pinned + slim: avoids cache-busting digest changes on rolling `oven/bun:1`.
FROM oven/bun:1.3.14-slim AS build

WORKDIR /app

# Copy workspace manifest and lockfile
COPY package.json bun.lock ./

# Copy all workspace package manifests so bun can validate the lockfile
COPY packages/emitsignal-cli/package.json       ./packages/emitsignal-cli/
COPY packages/emitsignal-docker/package.json    ./packages/emitsignal-docker/
COPY packages/emitsignal-docs/package.json      ./packages/emitsignal-docs/
COPY packages/emitsignal-e2e-testing/package.json ./packages/emitsignal-e2e-testing/
COPY packages/emitsignal-emails/package.json    ./packages/emitsignal-emails/
COPY packages/emitsignal-mobile/package.json    ./packages/emitsignal-mobile/
COPY packages/emitsignal-server/package.json    ./packages/emitsignal-server/
COPY packages/emitsignal-shared/package.json    ./packages/emitsignal-shared/
COPY packages/emitsignal-website/package.json   ./packages/emitsignal-website/

# Copy patch files referenced by patchedDependencies in package.json
COPY patches ./patches/

# Install all workspace dependencies
RUN bun install --frozen-lockfile

# Copy workspace source packages needed at build time
COPY packages/emitsignal-shared/  ./packages/emitsignal-shared/
COPY packages/emitsignal-website/ ./packages/emitsignal-website/

WORKDIR /app/packages/emitsignal-website

# VITE_API_URL is read via import.meta.env.VITE_API_URL and baked into the
# bundle at build time. Pass the real API URL as a build arg at docker build.
ARG VITE_API_URL=http://localhost:3333
ENV VITE_API_URL=${VITE_API_URL}

# VITE_SENTRY_DSN/VITE_SENTRY_ENABLED are read via import.meta.env and baked
# into the client bundle at build time, so they must be build args (unlike the
# server-side SENTRY_DSN/SENTRY_ENABLED, which are read from process.env at
# container runtime and just need to be passed via docker-compose `environment`).
ARG VITE_SENTRY_DSN=
ARG VITE_SENTRY_ENABLED=false
ENV VITE_SENTRY_DSN=${VITE_SENTRY_DSN}
ENV VITE_SENTRY_ENABLED=${VITE_SENTRY_ENABLED}

# Produces a Nitro SSR bundle at .output/server/index.mjs
RUN bun run build

# ── Stage 2: Run the Nitro SSR server ────────────────────────────────────────
FROM oven/bun:1.3.14-slim

WORKDIR /app

COPY --from=build --chown=bun:bun /app/packages/emitsignal-website/.output ./.output

# Drop root: run the SSR server as the unprivileged `bun` user.
USER bun

ENV HOST=0.0.0.0
ENV PORT=5000
EXPOSE 5000

CMD ["bun", ".output/server/index.mjs"]
