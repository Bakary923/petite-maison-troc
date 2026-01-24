// backend/api-service/src/middlewares/logger.js

const logger = (req, res, next) => {
    // On enregistre l'heure du début de la requête
    const start = Date.now();

    // L'événement 'finish' se déclenche quand la réponse est envoyée au client
    res.on('finish', () => {
        const duration = Date.now() - start;
        const timestamp = new Date().toISOString();
        const user = req.user ? `User: ${req.user.id}` : 'Guest';
        
        // Format du log : [Date] Methode URL Statut - Durée - Utilisateur
        const logEntry = `[${timestamp}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms - ${user}`;

        // Pour ton POC, on log dans la console
        console.log(logEntry);

        // Optionnel : Tu pourrais aussi écrire ici dans un fichier logs/access.log
    });

    next();
};

module.exports = logger;