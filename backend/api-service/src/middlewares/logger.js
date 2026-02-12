// backend/api-service/src/middlewares/logger.js

const logger = (req, res, next) => {
    // Désactive complètement le logger en mode test
    if (process.env.NODE_ENV === 'test') {
        return next();
    }

    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const timestamp = new Date().toISOString();
        const user = req.user ? `User: ${req.user.id}` : 'Guest';

        const logEntry = `[${timestamp}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms - ${user}`;

        console.log(logEntry);
    });

    next();
};

module.exports = logger;
