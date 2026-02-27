# -----------------------------------------------------------------------------
# 🏗️ ÉTAPE 1 — Build du frontend React
# -----------------------------------------------------------------------------
FROM node:20-alpine AS build

RUN apk upgrade --no-cache

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

ARG REACT_APP_CLOUDINARY_CLOUD_NAME
ARG REACT_APP_CLOUDINARY_UPLOAD_PRESET

ENV REACT_APP_CLOUDINARY_CLOUD_NAME=$REACT_APP_CLOUDINARY_CLOUD_NAME
ENV REACT_APP_CLOUDINARY_UPLOAD_PRESET=$REACT_APP_CLOUDINARY_UPLOAD_PRESET

RUN npm run build

# -----------------------------------------------------------------------------
# 🚀 ÉTAPE 2 — Serveur Nginx pour servir le build
# -----------------------------------------------------------------------------
FROM nginx:alpine

RUN apk upgrade --no-cache

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html

USER 1001

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]