# 1. Base Stage
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat
# Corepack for Yarn 3/4+ if needed, though this project appears to be Yarn 1/vBerry
RUN corepack enable && corepack prepare yarn@stable --activate

# 2. Dependencies Stage
FROM base AS deps
# Copy root package.json and lockfile
COPY package.json yarn.lock ./
# Copy workspace package.jsons (needed for link/install)
COPY packages/design-tokens/package.json ./packages/design-tokens/
COPY packages/next-config/package.json ./packages/next-config/
COPY packages/fonts/package.json ./packages/fonts/

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

# Run the token generation script (specific to your project)
RUN yarn generate:tokens

# Build Next.js
RUN yarn build

# 4. Runner (Production/Staging)
FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]

# 5. Development Stage (Optional Target)
FROM base AS development
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Run token generation for dev too
RUN yarn generate:tokens
EXPOSE 3000
CMD ["yarn", "dev"]
