export type LabType = 'fra' | 'national' | 'european'

export interface LabTopic {
  id: string
  name: string
  field: string | null
}

export interface Lab {
  id: string
  name: string
  city: string
  country: string
  lat: number
  lon: number
  type: LabType
  url?: string | null
  neonId?: string | null
  // Données OpenAlex
  alzPubCount?: number
  citedByCount?: number
  worksCount?: number
  topics?: LabTopic[]
}

export const LAB_CONFIG: Record<LabType, { color: string; glowColor: string; label: string }> = {
  fra:      { color: '#8231A8', glowColor: 'rgba(130,49,168,0.4)',  label: 'Soutenu par la FRA' },
  national: { color: '#8231A8', glowColor: 'rgba(130,49,168,0.15)', label: 'Institution nationale' },
  european: { color: '#8231A8', glowColor: 'rgba(130,49,168,0.15)', label: 'Institution européenne' },
}
