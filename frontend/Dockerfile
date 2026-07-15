FROM node:20-bookworm-slim AS base
WORKDIR /app
COPY package*.json ./

# --- dev: Vite dev server with hot reload ---
FROM base AS dev
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

# --- build: production static assets ---
FROM base AS build
RUN npm ci
COPY . .
RUN npm run build

# --- prod: nginx serving the built assets ---
FROM nginx:1.27-alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
