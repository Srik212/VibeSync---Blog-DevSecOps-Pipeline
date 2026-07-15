FROM node:20-bookworm-slim AS base
WORKDIR /app
COPY package*.json ./

# --- dev: full deps, hot reload via ts-node-dev ---
FROM base AS dev
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]

# --- build: compile TypeScript to dist/ ---
FROM base AS build
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
RUN npm ci
COPY . .
RUN npm run build

# --- prod: minimal runtime image ---
FROM node:20-bookworm-slim AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && npm ci --omit=dev \
    && apt-get purge -y python3 make g++ && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/dist ./dist
EXPOSE 5000
CMD ["node", "dist/index.js"]
