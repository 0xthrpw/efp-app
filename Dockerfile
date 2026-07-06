# Build with the repo root as context: docker build .
#
# NEXT_PUBLIC_* values are baked into the client bundle by `next build`, which
# auto-loads the committed .env.production — that file is the single place to
# set public config (API URL, contract addresses, RPC project IDs). The deploy
# platform injects only true runtime env (REDIS_URL, VAPID_PRIVATE_KEY, ...).

FROM node:20-slim AS builder
WORKDIR /app

# Bun is the required package manager (preinstall enforces it); the official
# binary from the oven/bun image runs fine on the same debian base.
COPY --from=oven/bun:1 /usr/local/bin/bun /usr/local/bin/bun

# Chromium comes from the runtime image's package manager instead of
# puppeteer's postinstall download (~170MB we'd throw away).
ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

COPY . .
# The build script sets NODE_ENV=production and the 4GB heap itself.
# Sourcemap uploads (Sentry/PostHog) self-disable: their auth tokens are unset.
RUN bun run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Headless Chromium for /api/top-eight image rendering (musl build via apk —
# puppeteer's own download is glibc and won't run on alpine).
RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
# Also present at runtime: server-side code reads e.g. EFP_API_URL from
# process.env; platform-injected env always wins over these defaults.
COPY --from=builder --chown=node:node /app/.env.production ./

USER node
ENV PORT=3000 HOSTNAME=0.0.0.0
EXPOSE 3000
CMD ["node", "server.js"]
