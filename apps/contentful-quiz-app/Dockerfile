# Build from the repo root so shared workspace packages (e.g. @dival-sehgal/quiz) resolve:
#   docker build -f apps/contentful-quiz-app/Dockerfile .
FROM node:22-alpine AS base
WORKDIR /app
# Corepack serves the Yarn version pinned by package.json's packageManager field.
RUN corepack enable

FROM base AS deps
COPY package.json yarn.lock ./
# Every workspace package.json, so the install matches yarn.lock exactly.
COPY packages/design-tokens/package.json ./packages/design-tokens/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/fonts/package.json ./packages/fonts/
COPY packages/jest-config/package.json ./packages/jest-config/
COPY packages/next-config/package.json ./packages/next-config/
COPY packages/quiz/package.json ./packages/quiz/
COPY packages/stylelint-config/package.json ./packages/stylelint-config/
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY packages/ui/package.json ./packages/ui/
COPY packages/utils/package.json ./packages/utils/
COPY apps/web/package.json ./apps/web/
COPY apps/contentful-quiz-app/package.json ./apps/contentful-quiz-app/
# --ignore-scripts: no dependency lifecycle scripts run during the build.
RUN yarn install --frozen-lockfile --ignore-scripts

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
# Only what the quiz app build needs — never a recursive copy of the whole context.
COPY package.json yarn.lock ./
COPY packages/quiz ./packages/quiz
COPY packages/tsconfig ./packages/tsconfig
COPY apps/contentful-quiz-app ./apps/contentful-quiz-app
RUN yarn workspace contentful-quiz-app build \
  && yarn workspace contentful-quiz-app build:server

# The server is bundled with its dependencies (express, dotenv, the shared quiz
# validator) into server-dist, and the UI is prebuilt into dist, so the runtime
# image needs no node_modules — just Node and those two folders.
FROM node:22-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app/apps/contentful-quiz-app
# Files stay root-owned (read-only to the app); the server runs as `node`.
COPY --from=build /app/apps/contentful-quiz-app/server-dist ./server-dist
COPY --from=build /app/apps/contentful-quiz-app/dist ./dist
USER node
EXPOSE 3003
CMD ["node", "server-dist/index.js"]
