export type LabType = 'fra' | 'national' | 'european'

export interface Lab {
  id: string
  name: string
  shortName?: string
  city: string
  country: string
  lat: number
  lon: number
  type: LabType
  url?: string
  neonId?: string // si présent dans la BDD FRA
}

export const LABS: Lab[] = [
  // ── Labos FRA (fictifs mais réalistes) ──────────────────────────────────────
  {
    id: 'fra-icm',
    name: 'Institut du Cerveau — Équipe Mémoire et Cognition',
    shortName: 'ICM',
    city: 'Paris',
    country: 'France',
    lat: 48.8413,
    lon: 2.3604,
    type: 'fra',
    neonId: 'lab-fra-icm',
  },

  // ── Centres nationaux ────────────────────────────────────────────────────────
  {
    id: 'inserm-caen',
    name: 'Inserm U1077 — Neuropsychologie & Imagerie de la Mémoire Humaine',
    shortName: 'U1077 Caen',
    city: 'Caen',
    country: 'France',
    lat: 49.183,
    lon: -0.370,
    type: 'national',
  },
  {
    id: 'neurospin',
    name: 'NeuroSpin — CEA Paris-Saclay',
    shortName: 'NeuroSpin',
    city: 'Saclay',
    country: 'France',
    lat: 48.728,
    lon: 2.141,
    type: 'national',
  },
  {
    id: 'imrb-creteil',
    name: 'Institut Mondor de Recherche Biomédicale',
    shortName: 'IMRB',
    city: 'Créteil',
    country: 'France',
    lat: 48.782,
    lon: 2.447,
    type: 'national',
  },
  {
    id: 'inserm-tours',
    name: 'Inserm U1253 — Imagerie & Cerveau',
    shortName: 'U1253 Tours',
    city: 'Tours',
    country: 'France',
    lat: 47.394,
    lon: 0.688,
    type: 'national',
  },
  {
    id: 'cmrr-bordeaux',
    name: 'Centre Mémoire Recherche & Ressources — Bordeaux',
    shortName: 'CMRR Bordeaux',
    city: 'Bordeaux',
    country: 'France',
    lat: 44.828,
    lon: -0.606,
    type: 'national',
  },
  {
    id: 'cmrr-toulouse',
    name: 'Centre Mémoire Recherche & Ressources — Toulouse',
    shortName: 'CMRR Toulouse',
    city: 'Toulouse',
    country: 'France',
    lat: 43.589,
    lon: 1.432,
    type: 'national',
  },
  {
    id: 'alzheimer-tauopathies',
    name: 'Alzheimer & Tauopathies — Inserm U1172',
    shortName: 'U1172 Lille',
    city: 'Lille',
    country: 'France',
    lat: 50.611,
    lon: 3.048,
    type: 'national',
  },
  {
    id: 'cmrr-nice',
    name: 'Centre Mémoire Recherche & Ressources — Nice',
    shortName: 'CMRR Nice',
    city: 'Nice',
    country: 'France',
    lat: 43.710,
    lon: 7.262,
    type: 'national',
  },
  {
    id: 'igbmc',
    name: 'Institut de Génétique et de Biologie Moléculaire et Cellulaire',
    shortName: 'IGBMC',
    city: 'Strasbourg',
    country: 'France',
    lat: 48.574,
    lon: 7.722,
    type: 'national',
  },

  // ── Centres européens ────────────────────────────────────────────────────────
  {
    id: 'uk-dri',
    name: 'UK Dementia Research Institute',
    shortName: 'UK DRI',
    city: 'London',
    country: 'Royaume-Uni',
    lat: 51.524,
    lon: -0.134,
    type: 'european',
  },
  {
    id: 'dzne-bonn',
    name: 'Deutsches Zentrum für Neurodegenerative Erkrankungen',
    shortName: 'DZNE',
    city: 'Bonn',
    country: 'Allemagne',
    lat: 50.723,
    lon: 7.102,
    type: 'european',
  },
  {
    id: 'vib-leuven',
    name: 'VIB Center for Brain & Disease Research',
    shortName: 'VIB KU Leuven',
    city: 'Leuven',
    country: 'Belgique',
    lat: 50.878,
    lon: 4.704,
    type: 'european',
  },
  {
    id: 'karolinska',
    name: 'Karolinska Institutet — Center for Alzheimer Research',
    shortName: 'Karolinska',
    city: 'Stockholm',
    country: 'Suède',
    lat: 59.350,
    lon: 18.025,
    type: 'european',
  },
  {
    id: 'amsterdam-umc',
    name: 'Amsterdam UMC — Alzheimer Center',
    shortName: 'Amsterdam UMC',
    city: 'Amsterdam',
    country: 'Pays-Bas',
    lat: 52.334,
    lon: 4.890,
    type: 'european',
  },
  {
    id: 'irccs-milan',
    name: 'IRCCS Fondazione Don Carlo Gnocchi',
    shortName: 'IRCCS Milan',
    city: 'Milan',
    country: 'Italie',
    lat: 45.464,
    lon: 9.189,
    type: 'european',
  },
  {
    id: 'cita-alzheimer',
    name: 'CITA-Alzheimer Foundation',
    shortName: 'CITA',
    city: 'San Sebastián',
    country: 'Espagne',
    lat: 43.312,
    lon: -1.975,
    type: 'european',
  },
  {
    id: 'dbm-zurich',
    name: 'Department of Biomedicine — University of Basel',
    shortName: 'DBM Basel',
    city: 'Basel',
    country: 'Suisse',
    lat: 47.560,
    lon: 7.575,
    type: 'european',
  },
]

export const LAB_CONFIG: Record<LabType, { color: string; glowColor: string; size: number; label: string }> = {
  fra:      { color: '#A855F7', glowColor: 'rgba(168,85,247,0.4)', size: 10, label: 'Soutenu par la FRA' },
  national: { color: '#60A5FA', glowColor: 'rgba(96,165,250,0.3)', size: 7,  label: 'Centre national' },
  european: { color: '#34D399', glowColor: 'rgba(52,211,153,0.3)', size: 7,  label: 'Centre européen' },
}
