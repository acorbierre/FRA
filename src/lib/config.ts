export const APPEL_ANNEE = process.env.NEXT_PUBLIC_APPEL_ANNEE ?? '2026'

export const FIELD_LABELS = {
  titre:         'Titre du projet',
  thematique:    'Domaine de recherche',
  resume:        'Résumé',
  description:   'Description détaillée',
  budgetDemande: 'Budget demandé',
  dureeMois:     'Durée',
  partenaires:   'Partenaires',
} as const

// Labels côté espace chercheur (les 3 étapes d'évaluation sont masquées en une seule)
export const STATUT_LABELS = {
  'Brouillon':           'Brouillon',
  'Soumise':             'Transmise',
  'Envoyée au CS':       'En évaluation',
  'En évaluation':       'En évaluation',
  'En délibération CS':  'En évaluation',
  'Retenue':             'Retenue',
  'Refusée':             'Non retenue',
} as const

// Labels côté espace gestion (toutes les étapes visibles, pas de Brouillon)
export const STATUT_LABELS_GESTION = {
  'Soumise':             'Reçue',
  'Envoyée au CS':       'Envoyée au CS',
  'En évaluation':       'En évaluation',
  'En délibération CS':  'En délibération CS',
  'Retenue':             'Retenue',
  'Refusée':             'Non retenue',
} as const

export const STATUT_COLORS = {
  'Brouillon':           'bg-blue-50 text-blue-700',
  'Soumise':             'bg-green-100 text-green-800',
  'Envoyée au CS':       'bg-amber-50 text-amber-700',
  'En évaluation':       'bg-amber-100 text-amber-800',
  'En délibération CS':  'bg-orange-50 text-orange-700',
  'Retenue':             'bg-green-600 text-white',
  'Refusée':             'bg-orange-50 text-orange-700',
} as const

// ─── Évaluations ────────────────────────────────────────────────────────────
export const EVALUATION_STATUTS = ['En attente', 'Soumise'] as const
export type EvaluationStatut = typeof EVALUATION_STATUTS[number]

export const EVALUATION_STATUT_LABELS: Record<EvaluationStatut, string> = {
  'En attente': 'En attente',
  'Soumise':    'Note reçue',
}

export const EVALUATION_COLORS: Record<EvaluationStatut, string> = {
  'En attente': 'bg-amber-50 text-amber-700',
  'Soumise':    'bg-green-100 text-green-700',
}

export const EVALUATION_LABELS: Record<EvaluationStatut, string> = {
  'En attente': 'En attente',
  'Soumise':    'Évaluation transmise',
}

// ─── Jalons ──────────────────────────────────────────────────────────────────
export const JALON_STATUTS = ['prevu', 'realise', 'en_retard'] as const
export type JalonStatut = typeof JALON_STATUTS[number]

export const JALON_STATUT_LABELS: Record<JalonStatut, string> = {
  prevu:     'Prévu',
  realise:   'Réalisé',
  en_retard: 'En retard',
}

export const JALON_TYPES = ['versement', 'rapport', 'comite', 'autre'] as const
export type JalonType = typeof JALON_TYPES[number]

export const JALON_TYPE_LABELS: Record<JalonType, string> = {
  versement: 'Versement',
  rapport:   'Rapport',
  comite:    'Comité',
  autre:     'Autre',
}

// ─── Candidatures ────────────────────────────────────────────────────────────
export const CANDIDATURE_STATUTS = ['Brouillon', 'Soumise', 'Envoyée au CS', 'En évaluation', 'En délibération CS', 'Retenue', 'Refusée'] as const
export type CandidatureStatut = typeof CANDIDATURE_STATUTS[number]

// ─── Conventions ─────────────────────────────────────────────────────────────
export const CONVENTION_STATUTS = ['En cours', 'Terminée', 'Résiliée'] as const
export type ConventionStatut = typeof CONVENTION_STATUTS[number]

// ─── Rapports ────────────────────────────────────────────────────────────────
export const RAPPORT_TYPES = ["Rapport d'étape", 'Rapport final scientifique', 'Rapport final financier'] as const
export type RapportType = typeof RAPPORT_TYPES[number]

export const RAPPORT_STATUTS = ['Attendu', 'Soumis', 'Reçu', 'Validé'] as const
export type RapportStatut = typeof RAPPORT_STATUTS[number]

// ─── Versements ──────────────────────────────────────────────────────────────
export const VERSEMENT_STATUTS = ['Prévu', 'En attente rapport', 'Réalisé'] as const
export type VersementStatut = typeof VERSEMENT_STATUTS[number]

// ─── Projets ─────────────────────────────────────────────────────────────────
export const PROJET_STATUTS = ['En cours', 'Terminé', 'Suspendu'] as const
export type ProjetStatut = typeof PROJET_STATUTS[number]

// ─── Utilisateurs ────────────────────────────────────────────────────────────
export const UTILISATEUR_ROLES = ['Candidat', 'Lauréat', 'Examinateur', 'Admin', 'Super-Admin'] as const
export type UtilisateurRole = typeof UTILISATEUR_ROLES[number]

export const UTILISATEUR_STATUTS_COMPTE = ['Invité', 'Actif'] as const
export type UtilisateurStatutCompte = typeof UTILISATEUR_STATUTS_COMPTE[number]
