-- ============================================================================
-- SCRIPT D'INITIALISATION DE LA BASE DE DONNÉES (PROCESSUS QUALITÉ)
-- Justification : Assure la fiabilité et la disponibilité du schéma (ISO 25010)
-- ============================================================================

-- 1. Table des utilisateurs (Gestion des identités et accès)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(30) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Table des Refresh Tokens (Sécurité : Rotation des sessions)
-- Justification : ON DELETE CASCADE garantit l'intégrité des données
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    token_hash VARCHAR(255) NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Table des Annonces (Fonctionnalité Métier principale)
CREATE TABLE IF NOT EXISTS annonces (
    id SERIAL PRIMARY KEY,
    titre VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    image VARCHAR(255),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, validated, rejected
    rejection_reason TEXT,
    validated_by INTEGER REFERENCES users(id),
    validated_at TIMESTAMP,
    rejected_by INTEGER REFERENCES users(id),
    rejected_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- JEU DE DONNÉES DE TEST (POUR VALIDATION CI/CD)
-- ============================================================================

-- 4. Création du compte Admin pour le POC (Pass: admin123)
-- Justification : Permet de tester les routes d'administration dans le pipeline
INSERT INTO users (username, email, password_hash, role) 
VALUES ('bakar_admin', 'admin@petite-maison.fr', '$2a$10$86as7.3.pY8I3G5e/T.p9u8Q5W6gI7Y6p5Y8I3G5e/T.p9u8Q5W6', 'admin') 
ON CONFLICT (email) DO NOTHING;

-- 5. Insertion d'une annonce témoin (Capacité fonctionnelle)
-- Justification : Valide que l'API peut lire et retourner des données via Supertest
INSERT INTO annonces (titre, description, status) 
VALUES ('Système opérationnel', 'La base v3 est en ligne et connectée au pipeline CI/CD.', 'validated');