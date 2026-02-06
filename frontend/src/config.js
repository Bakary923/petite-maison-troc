// Détection de l'environnement
const isLocalhost = window.location.hostname === 'localhost';

export const API_BASE_URL = window._env_?.REACT_APP_API_URL 
    || process.env.REACT_APP_API_URL 
    || (isLocalhost ? "http://localhost:3000/api" : "/api"); // 👈 ICI : On utilise le chemin relatif

console.log("🔗 API connectée via Proxy sur :", API_BASE_URL);