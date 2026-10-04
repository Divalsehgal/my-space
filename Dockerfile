# 1. Base Stage
FROM node:22-alpine AS base
WORKDIR /app
# Corepack serves the Yarn version pinned by package.json's packageManager field.
RUN apk add --no-cache libc6-compat \
  && corepack enable

# 2. Dependencies Stage
FROM base AS deps
# Copy root package.json and lockfile
COPY package.json yarn.lock ./
# Copy every workspace package.json (needed for yarn's workspace resolution to
# match yarn.lock exactly — omitting any of them makes --frozen-lockfile fail
# or silently skip that workspace's dependencies).
COPY packages/design-tokens/package.json ./packages/design-tokens/
COPY packages/next-config/package.json ./packages/next-config/
COPY packages/fonts/package.json ./packages/fonts/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/jest-config/package.json ./packages/jest-config/
COPY packages/ui/package.json ./packages/ui/
COPY packages/utils/package.json ./packages/utils/
COPY packages/stylelint-config/package.json ./packages/stylelint-config/
COPY packages/quiz/package.json ./packages/quiz/
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY apps/web/package.json ./apps/web/
COPY apps/contentful-quiz-app/package.json ./apps/contentful-quiz-app/

# Install dependencies. --ignore-scripts: no dependency lifecycle scripts run
# during the build; none are needed (native binaries ship as optional
# platform packages).
RUN yarn install --frozen-lockfile --ignore-scripts

# 3. Builder / Staging / Production Stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
# Only what the web build needs — never a recursive copy of the whole context.
COPY package.json yarn.lock turbo.json ./
COPY packages ./packages
COPY apps/web ./apps/web

# Environment variables for build time (provided via --build-arg)
ARG NEXT_PUBLIC_ENV=production
ENV NEXT_PUBLIC_ENV=${NEXT_PUBLIC_ENV}
ENV NODE_ENV=production

# Build the design tokens the app imports at build time
RUN yarn workspace @dival-sehgal/design-tokens build

# Build only the Next.js app (not every workspace in the monorepo).
# Contentful credentials are mounted as a BuildKit secret, so they never land in
# an image layer:
#   docker build --secret id=webenv,src=apps/web/.env .
# Without the secret the build falls back to the process environment. Any env
# file Next.js traces into the standalone output is removed afterwards — pass
# runtime values with `docker run --env-file` (docker-compose does this).
RUN --mount=type=secret,id=webenv,target=/app/apps/web/.env \
  yarn turbo build --filter=web \
  && rm -f apps/web/.next/standalone/apps/web/.env*

# 4. Runner (Production/Staging)
FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# apps/web's own build output, not a repo-root one — Next.js standalone
# output in a monorepo nests everything under the app's path relative to the
# workspace root (the yarn.lock location), so it's apps/web/public,
# apps/web/.next/standalone, apps/web/.next/static — never a flat top level.
COPY --from=builder /app/apps/web/public ./apps/web/public

# Set the correct permission for prerender cache
RUN mkdir -p apps/web/.next \
  && chown nextjs:nodejs apps/web/.next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

CMD ["node", "apps/web/server.js"]

# 5. Development Stage (Optional Target)
# NODE_ENV is not set here: `next dev` sets it, and docker-compose passes it.
FROM base AS development
# Run as the image's unprivileged `node` user; it owns the workspace so turbo
# and Next.js can write their caches.
RUN chown node:node /app
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json yarn.lock turbo.json ./
COPY --chown=node:node packages ./packages
COPY --chown=node:node apps/web ./apps/web
USER node
# Run token generation for dev too
RUN yarn workspace @dival-sehgal/design-tokens build
EXPOSE 3000
CMD ["yarn", "turbo", "dev", "--filter=web"]
