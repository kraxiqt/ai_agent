# --- этап 1: сборка приложения ---
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci || npm install

COPY . .

# адрес бэкенда для браузера; значение приходит из docker-compose.yml
ARG VITE_API_URL=http://localhost:8000/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# --- этап 2: раздача готовых файлов через nginx ---
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
