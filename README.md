# DevSecOps Troc App – Fullstack Cloud-Native Application

## Overview
Application web full-stack permettant la gestion d’annonces de troc avec authentification sécurisée, modération et contrôle d’accès basé sur les rôles (RBAC).

Projet réalisé dans une démarche **DevSecOps** avec automatisation complète du cycle de vie applicatif (CI/CD, sécurité, déploiement Kubernetes).

---

## Architecture

- Frontend : React (SPA) servi via Nginx (reverse proxy)
- Backend : Node.js / Express.js (API REST sécurisée)
- Base de données : PostgreSQL (Supabase)
- Stockage médias : Cloudinary
- Reverse proxy & sécurité : Cloudflare
- Orchestration : Kubernetes (OpenShift)
- Déploiement : Helm

Architecture cloud-native avec séparation des responsabilités :
- Frontend exposé
- Backend non exposé (communication interne)
- Services externalisés (DB, images)

---

## ⚙️ Tech Stack

- **Frontend** : React, Nginx  
- **Backend** : Node.js, Express.js  
- **Database** : PostgreSQL (Supabase)  
- **Cloud & DevOps** : Docker, Kubernetes, Helm, OpenShift  
- **CI/CD** : GitHub Actions  
- **Security** : JWT, RBAC, Cloudflare, Secrets Management  
- **Monitoring & Logs** : ELK Stack  

---

## Security (DevSecOps)

- Authentification via JWT
- Contrôle d’accès RBAC (admin / user)
- Validation des entrées (express-validator)
- Gestion des secrets (GitHub Actions + Kubernetes Secrets)
- Scan de sécurité :
  - Trivy (images Docker)
  - SonarCloud (code quality & vulnerabilities)
- Protection réseau via Cloudflare (WAF, DDoS, TLS)

---

## CI/CD Pipeline

Pipeline GitHub Actions avec :

### CI (Continuous Integration)
- Validation backend (Jest, Supertest)
- Validation frontend (React Testing Library)
- Analyse qualité (SonarCloud)
- Scan sécurité (Trivy)

### CD (Continuous Deployment)
- Build Docker images
- Push sur GHCR
- Déploiement via Helm sur OpenShift
- Validation post-déploiement (/health)
- Rollback automatique en cas d’échec

---

## Kubernetes Deployment

- Namespace dédié
- Services ClusterIP (frontend / backend)
- Route HTTPS (OpenShift edge)
- HPA (1 à 3 replicas)
- Injection dynamique des secrets

---

## Tests

- Backend :
  - Tests unitaires (middlewares auth)
  - Tests d’intégration (API routes)
- Frontend :
  - Tests UI (auth, création annonce)
  - Tests sécurité (accès admin)

---

## 🎯 Features

- Authentification sécurisée
- Création d’annonces avec image
- Modération admin
- Gestion des annonces utilisateur
- Consultation publique filtrée

---

## 🧑‍💻 Author

**Bakary BADIAGA**  
Ingénieur IT Ops / DevOps  

- LinkedIn : www.linkedin.com/in/bakarybadiaga13
