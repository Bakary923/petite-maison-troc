# -----------------------------------------------------------------------------
# 🏗️ ÉTAPE 1 — Build du frontend React
# -----------------------------------------------------------------------------
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./

# Installation des dépendances (incluant @supabase/supabase-js)
RUN npm install

COPY . .

# ✅ SÉCURITÉ : Déclaration des arguments de build
# Ces variables seront passées par GitHub Actions de manière sécurisée
ARG REACT_APP_SUPABASE_URL
ARG REACT_APP_SUPABASE_KEY
ARG REACT_APP_API_URL

# ✅ INJECTION : On les transforme en variables d'environnement 
# pour que le compilateur React (webpack) puisse les intégrer au build
ENV REACT_APP_SUPABASE_URL=$REACT_APP_SUPABASE_URL
ENV REACT_APP_SUPABASE_KEY=$REACT_APP_SUPABASE_KEY
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Maintenant, React verra bien les clés dans process.env
RUN npm run build


# -----------------------------------------------------------------------------
# 🚀 ÉTAPE 2 — Serveur Nginx pour servir le build
# -----------------------------------------------------------------------------
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Récupération du build de l'étape précédente
COPY --from=build /app/build /usr/share/nginx/html

# 🔐 SÉCURITÉ OPENSHIFT (User non-root)
USER 1001

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]