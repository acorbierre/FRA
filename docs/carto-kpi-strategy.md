# Carto — Stratégie de peuplement des 4 KPI

## État de la base (au 15/06/2026)

Table : `carte_laboratoires` — 774 labs au total (270 source HAL + 504 source OpenAlex)

| Variable | Signification | HAL (270) | OpenAlex (504) |
|---|---|---|---|
| `alz_pub_count` | Nb publications Alzheimer | ✅ 270/270 | ✅ 504/504 |
| `works_count` | Nb publications totales | ✅ 270/270 (= total pubs HAL via numFound) | ✅ 503/504 |
| `cited_by_count` | Nb total de citations | ❌ 0 pour tous (match OA par nom échoué) | ✅ 504/504 |
| `topics` | Domaines de recherche (JSONB) | ❌ tableau vide `[]` | ✅ 504/504 |
| `top_collabs` | Top co-laboratoires (JSONB) | ❌ jamais lancé | ❌ jamais lancé |
| `openalex_id` | ID OpenAlex de l'institution | ❌ null | ✅ 504/504 |

## Mapping KPI → variables → état

| KPI (fiche-panel.tsx) | Variable(s) | Calcul | HAL | OpenAlex |
|---|---|---|---|---|
| Pub. Alzheimer | `alz_pub_count` | Direct | ✅ | ✅ |
| Impact | `cited_by_count` | Direct | ❌ | ✅ |
| Spécialisation | `alz_pub_count` / `works_count` | Ratio × 100 (côté client) | ✅ | ✅ |
| Réseau | `top_collabs` | Nb entrées JSON (côté client) | ❌ | ❌ |

## Pourquoi `cited_by_count` est 0 pour tous les labs HAL

L'import HAL (`POST /api/carto/import-hal`) fait un match OpenAlex par nom (similarité Jaccard ≥ 0.30 sur les mots > 3 lettres) à l'étape 4. Ce match a échoué pour les 270 labs — les noms d'UMR françaises sont trop différents des `display_name` OpenAlex.

## Stratégie pour compléter les données manquantes

### Etape 1 — `cited_by_count` pour les labs HAL

**Script :** `scripts/populate-openalex-metrics.mjs`
**Méthode :** HAL structId → ROR (via `api.archives-ouvertes.fr/ref/structure`) → OpenAlex par ROR
**Commande :**
```bash
cd ~/Desktop/CLAUDE-AI/fra && node --env-file=.env.local scripts/populate-openalex-metrics.mjs
```
**Filtre :** `WHERE source = 'hal' AND cited_by_count = 0` (tous les HAL)
**Met à jour :** `works_count`, `cited_by_count` (via ROR, plus fiable que le match nom)

### Etape 2 — `top_collabs` pour les labs HAL

**Route :** `POST /api/carto/enrich-collabs`
**Méthode :** Pour chaque lab HAL, facet HAL sur ses publications Alzheimer → co-labos les plus fréquents
**Appel :** Via la page Admin ou curl depuis le serveur local
**Met à jour :** `top_collabs` (JSONB : `[{ id, nom, count }]`)

### Etape 3 — `top_collabs` pour les labs OpenAlex

**Script :** `scripts/enrich-openalex.mjs`
**Méthode :** Pour chaque lab OA (via `openalex_id`), cherche les 50 dernières publications Alzheimer → co-institutions
**Commande :**
```bash
cd ~/Desktop/CLAUDE-AI/fra && node --env-file=.env.local scripts/enrich-openalex.mjs
```
**Attention :** Ce script fait aussi un match par nom (comme import-hal). Il va écraser `works_count` et `cited_by_count` pour les labs HAL s'il tourne dessus. A lancer en filtrant `pays = 'FR' AND lat IS NOT NULL` — ce qu'il fait déjà, mais risque de matcher des labs HAL par nom (mal). A vérifier.
**Met à jour :** `openalex_id`, `works_count`, `cited_by_count`, `top_collabs`

### Etape 4 (optionnel) — `topics` pour les labs HAL

Pas de route dédiée. Nécessiterait d'étendre `populate-openalex-metrics.mjs` pour récupérer aussi les `topics` depuis l'institution OpenAlex matchée par ROR.

## Sources de données

| API | Usage | Limite / contrainte |
|---|---|---|
| HAL (`api.archives-ouvertes.fr`) | Import UMR, alz_pub_count, works_count (total HAL), top_collabs HAL | Pas de rate limit strict, delay 200ms |
| OpenAlex (`api.openalex.org`) | cited_by_count, works_count (total OA), topics, openalex_id, top_collabs OA | Polite pool avec mailto:, delay 250ms |
| api-adresse.data.gouv.fr | Geocodage adresses HAL | Delay 150ms |

## Routes et scripts disponibles

| Fichier | Type | Action |
|---|---|---|
| `src/app/api/carto/import-hal/route.ts` | Route POST | Import/reimport de tous les labs HAL FR (purge + geocodage + match OA nom) |
| `src/app/api/carto/import-openalex/route.ts` | Route POST | Import/reimport des labs OA (8 pays, group_by institutions) |
| `src/app/api/carto/enrich-collabs/route.ts` | Route POST | Peuple `top_collabs` pour labs HAL (via facet co-publications) |
| `scripts/populate-openalex-metrics.mjs` | Script one-shot | Peuple `cited_by_count` + `works_count` pour labs HAL via ROR |
| `scripts/enrich-openalex.mjs` | Script one-shot | Peuple `openalex_id` + `works_count` + `cited_by_count` + `top_collabs` pour labs OA |

## Affichage dans fiche-panel.tsx

Fichier : `src/components/carte/fiche-panel.tsx`

Les KPI "Impact" et "Réseau" sont actuellement vides avec `opacity` réduite (placeholder).
Une fois les données disponibles, brancher :
- Impact : afficher `citedByCount` directement (format `xxx k` si > 1000)
- Réseau : afficher `topCollabs?.length` (nb de co-laboratoires identifiés)
