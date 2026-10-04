# Build from the repo root so shared workspace packages (e.g. @dival-sehgal/quiz) resolve:
#   docker build -f apps/contentful-quiz-app/Dockerfile .
FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare yarn@stable --activate

FROM base AS deps
COPY package.json yarn.lock ./
# Every workspace package.json, so the install matches yarn.lock exactly.
COPY packages/design-tokens eslint-config fonts jest-config next-config quiz stylelint-config tsconfig ui utils/package.json ./packages/design-tokens eslint-config fonts jest-config next-config quiz stylelint-config tsconfig ui utils/
COPY apps/web/package.json ./apps/web/
COPY apps/contentful-quiz-app/package.json ./apps/contentful-quiz-app/
RUN yarn install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn workspace contentful-quiz-app build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/quiz ./packages/quiz
COPY --from=build /app/apps/contentful-quiz-app/package.json ./apps/contentful-quiz-app/
COPY --from=build /app/apps/contentful-quiz-app/server ./apps/contentful-quiz-app/server
COPY --from=build /app/apps/contentful-quiz-app/dist ./apps/contentful-quiz-app/dist
WORKDIR /app/apps/contentful-quiz-app
EXPOSE 3003
CMD ["node", "server/index.js"]
