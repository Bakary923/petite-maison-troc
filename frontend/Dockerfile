# -----------------------------------------------------------------------------
# 🏗️ ÉTAPE 1 — Build du frontend React
# -----------------------------------------------------------------------------
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# -----------------------------------------------------------------------------
# 🔐 VARIABLES D’ENVIRONNEMENT POUR LE BUILD REACT
# -----------------------------------------------------------------------------

# 👉 API backend (OpenShift)
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# 👉 Cloudinary (upload images)
ARG REACT_APP_CLOUDINARY_CLOUD_NAME
ARG REACT_APP_CLOUDINARY_UPLOAD_PRESET

ENV REACT_APP_CLOUDINARY_CLOUD_NAME=$REACT_APP_CLOUDINARY_CLOUD_NAME
ENV REACT_APP_CLOUDINARY_UPLOAD_PRESET=$REACT_APP_CLOUDINARY_UPLOAD_PRESET

# ❌ Supabase supprimé (plus utilisé)
# ARG REACT_APP_SUPABASE_URL
# ARG REACT_APP_SUPABASE_KEY
# ENV REACT_APP_SUPABASE_URL=$REACT_APP_SUPABASE_URL
# ENV REACT_APP_SUPABASE_KEY=$REACT_APP_SUPABASE_KEY

# Build final
RUN npm run build

# -----------------------------------------------------------------------------
# 🚀 ÉTAPE 2 — Serveur Nginx pour servir le build
# -----------------------------------------------------------------------------
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/build /usr/share/nginx/html

# 🔐 OpenShift : user non-root
USER 1001

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
