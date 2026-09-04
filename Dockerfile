# 1. Base Stage
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat
# Corepack for Yarn 3/4+ if needed, though this project appears to be Yarn 1/vBerry
RUN corepack enable && corepack prepare yarn@stable --activate

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
COPY apps/web/package.json ./apps/web/
COPY apps/contentful-quiz-app/package.json ./apps/contentful-quiz-app/

# Install dependencies
RUN yarn install --frozen-lockfile

# 3. Builder / Staging / Production Stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables for build time (provided via --build-arg)
ARG NEXT_PUBLIC_ENV=production
ENV NEXT_PUBLIC_ENV=${NEXT_PUBLIC_ENV}
ENV NODE_ENV=production

# Build the design tokens the app imports at build time
RUN yarn workspace @dival-sehgal/design-tokens build

# Build only the Next.js app (not every workspace in the monorepo)
RUN yarn turbo build --filter=web

# 4. Runner (Production/Staging)
FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# apps/web's own build output, not a repo-root one — Next.js standalone
# output in a monorepo nests everything under the app's path relative to the
# workspace root (the yarn.lock location), so it's apps/web/public,
# apps/web/.next/standalone, apps/web/.next/static — never a flat top level.
COPY --from=builder /app/apps/web/public ./apps/web/public

# Set the correct permission for prerender cache
RUN mkdir -p apps/web/.next
RUN chown nextjs:nodejs apps/web/.next

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
FROM base AS development
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Run token generation for dev too
RUN yarn workspace @dival-sehgal/design-tokens build
EXPOSE 3000
CMD ["yarn", "turbo", "dev", "--filter=web"]
