// config.js
export const API_BASE_URL = window._env_?.REACT_APP_API_URL 
                            || process.env.REACT_APP_API_URL 
                            || "http://127.0.0.1/api"; // L'adresse de l'Ingress par défaut