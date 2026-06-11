import * as d3 from 'd3'
import { type Lab } from '@/data/alzheimer-labs'

export interface Cluster { labs: Lab[]; cx: number; cy: number }

export const DOT_COLOR   = '#8231A8'
export const LIGHT_COLOR = '#C084D8'

export const STREAM_LINES = [
  'Cartographie',
  'des équipes de',
  'recherche',
  'en Alzheimer',
]

const HIGHLIGHT_WORDS = ['recherche', 'Alzheimer']

export function buildHighlightMap(lines: string[]): boolean[][] {
  return lines.map(line => {
    const map = new Array(line.length).fill(false)
    for (const word of HIGHLIGHT_WORDS) {
      const idx = line.toLowerCase().indexOf(word.toLowerCase())
      if (idx !== -1) for (let i = idx; i < idx + word.length; i++) map[i] = true
    }
    return map
  })
}

export const HIGHLIGHT_MAP = buildHighlightMap(STREAM_LINES)

export function rOuter(alzTotal: number) {
  if (!alzTotal || alzTotal === 0) return 5
  return 3 + Math.pow(alzTotal, 0.35) * 0.6
}

export function rInner(alzTotal: number) { return rOuter(alzTotal) * 0.38 }

export function dominantCity(labs: Lab[]) {
  const counts: Record<string, number> = {}
  for (const l of labs) counts[l.city] = (counts[l.city] ?? 0) + 1
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''
}

export function titleCase(str: string) {
  return str.toLowerCase().replace(/(?:^|\s|-)\S/g, c => c.toUpperCase())
}

export function formatCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

export function specializationRatio(lab: Lab): number | null {
  if (!lab.worksCount || !lab.alzPubCount) return null
  return lab.alzPubCount / lab.worksCount
}

export function computeClusters(labs: Lab[], projection: d3.GeoProjection, threshold = 15): Cluster[] {
  const points = labs
    .map(lab => {
      const c = projection([lab.lon, lab.lat])
      return c ? { lab, x: c[0], y: c[1] } : null
    })
    .filter(Boolean) as { lab: Lab; x: number; y: number }[]

  const assigned = new Set<number>()
  const clusters: Cluster[] = []

  for (let i = 0; i < points.length; i++) {
    if (assigned.has(i)) continue
    const group = [i]
    assigned.add(i)
    for (let j = i + 1; j < points.length; j++) {
      if (assigned.has(j)) continue
      const dx = points[i].x - points[j].x
      const dy = points[i].y - points[j].y
      if (Math.sqrt(dx * dx + dy * dy) < threshold) { group.push(j); assigned.add(j) }
    }
    const cx = group.reduce((s, k) => s + points[k].x, 0) / group.length
    const cy = group.reduce((s, k) => s + points[k].y, 0) / group.length
    clusters.push({ labs: group.map(k => points[k].lab), cx, cy })
  }
  return clusters
}
