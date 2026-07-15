# Build Stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci && npm cache clean --force
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Production Stage
FROM node:20-alpine AS prod

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

RUN apk --no-cache add dumb-init su-exec

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY entrypoint.sh ./entrypoint.sh

RUN chown -R appuser:appgroup /app && chmod +x /app/entrypoint.sh

EXPOSE 5000

ENTRYPOINT [ "dumb-init", "--", "/app/entrypoint.sh" ]
CMD [ "node", "dist/index.js" ]

