# Architecture Technique

## Vue d'ensemble

Utilisateur
↓ HTTPS
Frontend (React) ←→ Backend API (Node.js) ←→ PostgreSQL


## Base de données

**Table users**
- id, username, email, password_hash, role, created_at

**Table annonces**
- id, titre, description, categorie, type, statut, user_id, created_at

**Table moderation_logs** (bonus)
- id, annonce_id, moderator_id, action, reason, created_at

## Stack technique

**Frontend :** React + Vite + Material-UI  
**Backend :** Node.js + Express + JWT  
**Database :** PostgreSQL 16  
**DevOps :** Docker + Kubernetes + GitHub Actions  
**Sécurité :** HTTPS, Trivy, Snyk, SonarQube

## Endpoints API

**Auth**
- POST /api/auth/register
- POST /api/auth/login

**Annonces**
- GET /api/annonces (liste)
- POST /api/annonces (créer)
- DELETE /api/annonces/:id (supprimer)

**Modération** (bonus)
- GET /api/moderation/pending
- POST /api/moderation/approve/:id
- POST /api/moderation/reject/:id

## Pipeline CI/CD

1. Push code → GitHub
2. Tests (Jest) + Linting (ESLint)
3. Scans sécurité (SonarQube, Snyk)
4. Build Docker
5. Scan image (Trivy)
6. Deploy Kubernetes
