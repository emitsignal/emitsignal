# Build context must be the monorepo root.
# docker build -f packages/emitsignal-docker/website.Dockerfile .

# ── Stage 1: Build the TanStack Start / Nitro SSR bundle ──────────────────────
FROM oven/bun:1 AS build

WORKDIR /app

# Copy workspace manifest and lockfile
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

# Produces a Nitro SSR bundle at .output/server/index.mjs
RUN bun run build

# ── Stage 2: Run the Nitro SSR server ────────────────────────────────────────
FROM oven/bun:1

WORKDIR /app

COPY --from=build /app/packages/emitsignal-website/.output ./.output

ENV HOST=0.0.0.0
ENV PORT=5000
EXPOSE 5000

CMD ["bun", ".output/server/index.mjs"]
