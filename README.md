# FRA — Espace de gestion des appels à projets

Application web de gestion des appels à projets de recherche : dépôt de candidatures, évaluation, suivi des projets financés.

**Production** : https://poc-fra.up.railway.app
**Statut CI** : ![Tests](https://github.com/acorbierre/FRA/actions/workflows/vitest.yml/badge.svg) ![SonarCloud](https://github.com/acorbierre/FRA/actions/workflows/sonarcloud.yml/badge.svg)

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 16.2.6 (App Router) |
| Langage | TypeScript 5 |
| Style | Tailwind CSS v4 + shadcn/ui |
| Auth | Clerk v7 |
| Base de données | Neon PostgreSQL (Frankfurt) |
| Déploiement | Railway |
| Tests | Vitest (unitaires) |
| Qualité | SonarCloud + Dependabot |

---

## Setup local

### Prérequis

- Node.js 20+
- Un projet Neon PostgreSQL (ou accès à la DB existante)
- Un compte Clerk (ou accès au projet existant)

### Installation

```bash
git clone https://github.com/acorbierre/FRA.git
cd FRA
npm install
```

### Variables d'environnement

Créer un fichier `.env.local` à la racine :

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Neon PostgreSQL
DATABASE_URL=postgresql://...

# Tests Vitest (optionnel)
TEST_ADMIN_EMAIL=...
TEST_ADMIN_PASSWORD=...
TEST_REVIEWER_EMAIL=...
TEST_REVIEWER_PASSWORD=...
TEST_CANDIDAT_EMAIL=...
TEST_CANDIDAT_PASSWORD=...
```

### Lancer en développement

```bash
npm run dev -- --webpack
```

> ⚠️ **Important** : Turbopack est incompatible avec cet environnement. Toujours utiliser `--webpack`.

L'application est disponible sur http://localhost:3000.

### Tests

```bash
npm test
```

---

## Architecture

### Middleware et auth

Le fichier de middleware Next.js est nommé `src/proxy.ts` (et non `middleware.ts`) — contrainte liée à Next.js 16. Il utilise `clerkMiddleware()` pour protéger les routes.

### Routing par rôle

La page racine (`src/app/page.tsx`) redirige selon le rôle de l'utilisateur connecté :

| Rôle | Redirection |
|---|---|
| `Admin` / `Super-Admin` | `/gestion` |
| `Examinateur` | `/reviewer` |
| Tous les autres | `/espace` |

Les rôles sont stockés dans la colonne `role[]` de la table `utilisateurs`.

### Structure des routes

```
/                        → Redirection selon rôle
/sign-in, /sign-up       → Auth Clerk
/espace                  → Espace candidat
/reviewer                → Espace examinateur
/gestion                 → Espace de gestion (Admin+)
/gestion/admin           → Administration (utilisateurs, apparence, ressources)
/gestion/schema          → Schéma de données interactif (React Flow)
```

### Services Neon (`src/services/neon/`)

Chaque entité métier a son propre service. Les requêtes SQL utilisent le client `@neondatabase/serverless` via `src/lib/db.ts`.

Les services `candidatures` et `projets` font un `LEFT JOIN thematiques` pour résoudre le label de thématique — ne pas utiliser `SELECT *` sur ces tables sans ce join.

### Settings administrables

Les statuts et leurs couleurs/libellés sont stockés dans la table `settings` (clé/valeur JSON) et chargés via `getAppSettings()` avec `React.cache()`. Ne pas importer les constantes de `config.ts` directement dans les composants qui affichent des statuts — passer les settings en props depuis le server component parent.

---

## Base de données

### Schéma simplifié

```
utilisateurs ──< candidatures >── appels_a_projets
laboratoires ──<     │
                     │
              thematiques (FK)
                     │
              evaluations
                     │
              projets ──< conventions ──< versements
                    │──< rapports
                    │──< jalons
settings
```

Le schéma interactif complet est disponible dans l'application à `/gestion/schema`.

### Migrations

Pas d'outil de migration automatique — les évolutions de schéma sont appliquées manuellement via la console Neon ou le MCP Neon dans Claude Code.

---

## Déploiement (Railway)

- Push sur `main` → déploiement automatique
- Variables à configurer dans Railway : `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `DATABASE_URL`
- Clerk reste en **mode Development** (le domaine `railway.app` est bloqué en production Clerk)
- Clerk Fallback development host : `poc-fra.up.railway.app`

---

## Points d'attention pour un dev entrant

- **Ne pas activer Turbopack** — utiliser `npm run dev -- --webpack`
- **Clerk en mode dev** — les emails d'invitation peuvent atterrir en spam
- **`src/proxy.ts`** et non `middleware.ts` — convention propre à ce projet
- **Thématiques** — stockées dans la table `thematiques`, référencées par FK dans `candidatures` et `projets`. Ne pas stocker le label en texte libre.
- **Settings** — toujours lire via `getAppSettings()`, jamais directement depuis `config.ts` pour les statuts affichés à l'utilisateur
