# Build context must be the monorepo root.
# docker build -f packages/emitsignal-docker/website.Dockerfile .

# ── Stage 1: Build the TanStack Start / Nitro SSR bundle ──────────────────────
FROM oven/bun:1 AS build

WORKDIR /app

# Copy workspace manifest and lockfile
COPY package.json bun.lock ./

# Copy the website package manifest for dependency resolution
COPY packages/emitsignal-website/package.json ./packages/emitsignal-website/

# Install all workspace dependencies
RUN bun install --frozen-lockfile

# Copy the website source
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

ENV PORT=3000
EXPOSE 3000

CMD ["bun", ".output/server/index.mjs"]
