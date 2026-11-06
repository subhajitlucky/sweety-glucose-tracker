# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS build

WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json ./server/package.json
COPY client/package.json ./client/package.json
RUN npm ci

COPY server ./server
COPY client ./client
RUN npm run build -w client

FROM node:22-bookworm-slim AS production

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
COPY server/package.json ./server/package.json
COPY client/package.json ./client/package.json
RUN npm ci --omit=dev --workspace @sweety/server --include-workspace-root=false \
  && npm cache clean --force

COPY --chown=node:node server ./server
COPY --from=build --chown=node:node /app/client/dist ./server/public

USER node
WORKDIR /app/server
EXPOSE 4000

# Apply the idempotent schema before starting the API. This also makes a
# one-command docker-compose deployment work on a fresh database.
CMD ["sh", "-c", "node db/migrate.js && node src/index.js"]
