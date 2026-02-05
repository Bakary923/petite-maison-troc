// Détection automatique de l'environnement (Localhost vs Ingress)
const isLocalhost = window.location.hostname === 'localhost';

export const API_BASE_URL = window._env_?.REACT_APP_API_URL 
    || process.env.REACT_APP_API_URL 
    || (isLocalhost ? "http://localhost:3000" : "http://petite-maison.local/api");

console.log("🔗 API connectée sur :", API_BASE_URL);