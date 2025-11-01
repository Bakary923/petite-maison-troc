# Phase 1 : Processus Qualité Logicielle

## 1. Norme ISO 25010

Ce projet s'appuie sur la norme ISO 25010 qui définit 8 critères de qualité logicielle.

### Critères appliqués à ce projet :

1. **Fiabilité** : L'application doit être disponible et gérer les erreurs
2. **Performance** : Temps de réponse rapide
3. **Sécurité** : Authentification, HTTPS, scans vulnérabilités
4. **Maintenabilité** : Code propre, tests, documentation

---

## 2. Indicateurs Qualité Mesurables

### Indicateur 1 : Fiabilité
- **Métrique** : Uptime (disponibilité)
- **Objectif** : > 99%
- **Mesure** : Prometheus + Grafana

### Indicateur 2 : Performance
- **Métrique** : Temps de réponse API
- **Objectif** : < 200ms
- **Mesure** : Tests de charge (JMeter)

### Indicateur 3 : Sécurité
- **Métrique** : Nombre de vulnérabilités critiques
- **Objectif** : 0 vulnérabilité critique
- **Mesure** : Trivy, Snyk, SonarQube, OWASP ZAP

### Indicateur 4 : Maintenabilité
- **Métrique** : Couverture de tests
- **Objectif** : > 70%
- **Mesure** : Jest coverage report

---

## 3. Cycle DevSecOps


Plan → Code → Build → Test → Scan → Release → Deploy → Monitor
↑ ↓
└──────────────────── Feedback ────────────────────────────┘


### Étapes :

1. **Plan** : User stories, architecture
2. **Code** : Développement (Git)
3. **Build** : Compilation, Docker build
4. **Test** : Tests unitaires (Jest), tests intégration
5. **Scan** : Scans sécurité (Trivy, Snyk, SonarQube)
6. **Release** : Versioning, tag Git
7. **Deploy** : Déploiement Kubernetes
8. **Monitor** : Prometheus + Grafana

---

## 4. Politique de Tests

### Tests unitaires
- Framework : Jest
- Cible : > 70% de couverture
- Scope : Fonctions métier (auth, annonces)

### Tests d'intégration
- Framework : Supertest
- Scope : Endpoints API

### Tests de charge
- Outil : JMeter ou Artillery
- Scénario : 100 users simultanés

---

## 5. Politique de Sécurité

### Authentification
- JWT avec expiration 24h
- Password hashé (bcrypt, 10 rounds)

### HTTPS
- Certificats Let's Encrypt
- Gestion cert-manager (Kubernetes)

### Scans de vulnérabilités
- **Images Docker** : Trivy (dans CI/CD)
- **Dépendances npm** : Snyk (dans CI/CD)
- **Code** : SonarQube (analyse statique)
- **Application** : OWASP ZAP (tests dynamiques)

### Secrets
- Variables d'environnement (.env)
- Kubernetes Secrets en production
- Jamais de secrets dans le code

---

## 6. Pipeline CI/CD Détaillé

**GitHub Actions** : `.github/workflows/ci.yml`


Étapes :

1. Checkout code

2. Install dependencies (npm install)

3. Linting (ESLint)

4. Tests unitaires (Jest)

5. Scan code (SonarQube)

6. Scan dépendances (Snyk)

7. Build Docker images

8. Scan images (Trivy)

9. Push to Docker Hub

10. Deploy to Kubernetes

11. Health checks


---

## 7. Cartographie des Compétences

### Compétences actuelles
- JavaScript/Node.js : Intermédiaire
- React : Débutant-Intermédiaire
- SQL/PostgreSQL : Débutant
- Git : Intermédiaire

### Compétences à acquérir
- Docker : À apprendre (priorité haute)
- Kubernetes : À apprendre (priorité haute)
- CI/CD GitHub Actions : À apprendre (priorité moyenne)
- Scans sécurité : À apprendre (priorité moyenne)

### Plan de formation
- **Semaine 2 nov** : Tutoriels Docker (2-3 jours)
- **Semaine 3 nov** : Tutoriels Kubernetes (1 semaine)
- **Semaine 4 nov** : Expérimentation Keycloak, SonarQube

---

## 8. Expérimentation (Bac à sable)

### Technologies critiques à expérimenter :

1. **Docker** : Containeriser une app Node.js simple
2. **Kubernetes** : Déployer sur Minikube
3. **JWT** : Implémenter auth basique
4. **PostgreSQL** : CRUD simple

### Rapport d'expérimentation :
À documenter en décembre après tests.
