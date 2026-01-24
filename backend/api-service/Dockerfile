# 1. Utilisation d'une image de base légère et sécurisée (Alpine Linux)
FROM node:18-alpine

# 2. Définition du dossier de travail à l'intérieur du conteneur
WORKDIR /app

# 3. Copie des fichiers de configuration des dépendances
# On les copie en premier pour optimiser le cache Docker
COPY package*.json ./

# 4. Installation des dépendances (production uniquement pour la sécurité)
RUN npm install --only=production

# 5. Copie de l'intégralité du code source du dossier backend/api-service
COPY . .

# 6. Création et sécurisation du dossier pour les images de troc
# On s'assure que le dossier existe pour éviter les erreurs de chemin
RUN mkdir -p uploads && chmod 755 uploads

# 7. Exposition du port de l'API (défini dans ton app.js)
EXPOSE 3000

# 8. Utilisation d'un utilisateur non-privilégié "node" au lieu de "root"
# C'est une mesure de sécurité essentielle pour ton dossier technique
USER node

# 9. Commande de démarrage du serveur
CMD ["node", "src/app.js"]