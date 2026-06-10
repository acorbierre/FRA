import type {
  CandidatureStatut,
  ConventionStatut,
  RapportType,
  RapportStatut,
  VersementStatut,
  ProjetStatut,
  UtilisateurRole,
  UtilisateurStatutCompte,
} from '@/lib/config'

export type {
  CandidatureStatut,
  ConventionStatut,
  RapportType,
  RapportStatut,
  VersementStatut,
  ProjetStatut,
  UtilisateurRole,
  UtilisateurStatutCompte,
}

export interface Laboratoire {
  id: string
  nom: string
  institution?: string
  ville?: string
  siteWeb?: string
}

export interface AppelAProjet {
  id: string
  titre: string
  annee: number
  dateOuverture: string
  dateCloture: string
  thematiques: string[]
  budgetTotal: number
}

export interface Utilisateur {
  id: string
  nomComplet: string
  prenom: string
  nom: string
  email: string
  telephone?: string
  photo?: { url: string }[]
  bio?: string
  ville?: string
  contrat?: string
  specialite?: string
  role: UtilisateurRole[]
  statutCompte: UtilisateurStatutCompte
  laboratoireDeclaratif?: string
  laboratoireId?: string[]
}

export interface Candidature {
  id: string
  titre: string
  thematique: string
  thematiqueId?: number
  resume: string
  description: string
  budgetDemande: number
  dureeMois: number
  partenaires?: string
  dateCreation?: string
  dateSoumission?: string
  statut: CandidatureStatut
  utilisateurId?: string
  appelAProjetId?: string
}

export interface Projet {
  id: string
  titre: string
  thematique?: string
  thematiqueId?: number
  dateDebut?: string
  dateFinPrevue?: string
  dateFinReelle?: string
  montantAccorde: number
  dimensionInternationale: boolean
  detailPartenariats?: string
  statut: ProjetStatut
  candidatureId?: string
  photo?: { url: string }[]
  titreCourt?: string
  description?: string
  ville?: string
  anneeSelection?: number
}

export interface Convention {
  id: string
  numeroConvention: string
  dateSignature?: string
  montantTotal: number
  statut: ConventionStatut
  projetId?: string
}

export interface Versement {
  id: string
  reference: string
  numero: number
  montant: number
  datePrevue?: string
  dateRealisee?: string
  statut: VersementStatut
  conventionId?: string
}

export interface Rapport {
  id: string
  reference: string
  type: RapportType
  dateAttendue?: string
  dateSoumission?: string
  dateReception?: string
  statut: RapportStatut
  fichier?: { url: string; filename: string }[]
  notes?: string
  enRetard?: string
  projetId?: string
  versementId?: string
}
