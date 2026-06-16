'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Target, Sparkles, BookOpen, TrendingUp } from 'lucide-react'
import { type Lab } from '@/data/alzheimer-labs'
import { PanelTopbar } from './panel-topbar'
import { DOT_COLOR, parseName } from './map-utils'

type TopSort = 'publications' | 'specialisation' | 'impact' | 'composite'

interface Props {
  labs: Lab[]
  topSort: TopSort
  onSortChange: (sort: TopSort) => void
  compositeScore: (l: Lab) => number
  onLabClick: (lab: Lab) => void
  onBack: () => void
  onClose: () => void
}


function metricLabel(lab: Lab, topSort: TopSort, compositeScore: (l: Lab) => number): string {
  if (topSort === 'specialisation') {
    const ratio = lab.worksCount ? (lab.alzPubCount ?? 0) / lab.worksCount : 0
    if (ratio <= 0 || ratio > 1) return '—'
    const pct = ratio * 100
    return `${pct < 1 ? '< 1' : Math.round(pct)}\u202f%`
  }
  if (topSort === 'impact') {
    const cit = lab.citedByCount && lab.worksCount ? Math.round(lab.citedByCount / lab.worksCount) : 0
    return cit > 0 ? `${cit} citations\u202f/ pub.` : '—'
  }
  if (topSort === 'composite') return `${Math.round(compositeScore(lab) * 100)}\u202f/ 100`
  return `${(lab.alzPubCount ?? 0).toLocaleString('fr-FR')} publications`
}

function SortIcon({ sort, size = 20 }: { sort: TopSort; size?: number }) {
  if (sort === 'specialisation') return <Target size={size} strokeWidth={2.5} />
  if (sort === 'impact')         return <TrendingUp size={size} strokeWidth={2.5} />
  if (sort === 'composite')      return <Sparkles size={size} strokeWidth={2.5} />
  return <BookOpen size={size} strokeWidth={2.5} />
}

const TITLES: Record<TopSort, string> = {
  publications:   'Publications Alzheimer',
  specialisation: 'Spécialisation Alzheimer',
  impact:         'Score d\'impact',
  composite:      'Pertinence pour la FRA',
}

const BODIES: Record<TopSort, React.ReactNode> = {
  publications:   <>Le nombre de publications Alzheimer est extrait de HAL, référentiel officiel des unités de recherche françaises. Il reflète le volume de contributions d'un laboratoire sur la thématique Alzheimer et maladies apparentées.</>,
  specialisation: <>Le taux de spécialisation correspond à la part des publications Alzheimer dans la production scientifique totale du laboratoire. Un taux élevé indique un laboratoire fortement centré sur la thématique — un critère de pertinence complémentaire au volume brut de publications.</>,
  impact:         <>Le score d'impact correspond au nombre moyen de citations reçues par publication, toutes thématiques confondues. Il mesure l'influence scientifique globale du laboratoire. Source&nbsp;: OpenAlex.</>,
  composite:      <>La pertinence FRA croise trois indicateurs pour identifier les laboratoires à la fois influents, actifs sur Alzheimer et centrés sur le sujet&nbsp;: score d'impact (40&nbsp;%), volume de publications Alzheimer (35&nbsp;%) et taux de spécialisation (25&nbsp;%). Chaque métrique est normalisée de 0 à 100 par rapport au maximum du dataset, puis pondérée pour donner un score global sur 100.</>,
}

const SORT_KEYS: TopSort[] = ['publications', 'specialisation', 'impact', 'composite']

function IntroBlock({ topSort, onSortChange }: { topSort: TopSort; onSortChange: (s: TopSort) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="mt-8 mb-8">
      <div className="font-bold font-heading leading-tight mb-2" style={{ fontSize: 'clamp(1.4rem, 2.2vw, 2.1rem)' }}>
        <p style={{ color: '#7F8997' }}>Classement des laboratoires</p>
        <p ref={ref} className="relative inline-flex items-baseline gap-1">
          <span style={{ color: '#7F8997' }}>par </span>
          <button
            onClick={() => setOpen(o => !o)}
            className="inline-flex items-center gap-1 cursor-pointer hover:opacity-70 transition-opacity"
          >
            <span style={{ color: DOT_COLOR }}>{TITLES[topSort]}</span>
            <ChevronDown
              size={26} strokeWidth={2.5}
              style={{ color: DOT_COLOR, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>
          {open && (
            <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden min-w-[260px]">
              {SORT_KEYS.map(key => (
                <button
                  key={key}
                  onClick={() => { onSortChange(key); setOpen(false) }}
                  className="w-full text-left px-4 py-3 text-sm font-heading transition-colors hover:bg-purple-50 cursor-pointer"
                  style={{ fontWeight: key === topSort ? 700 : 400, color: key === topSort ? DOT_COLOR : '#0f172a' }}
                >
                  {TITLES[key]}
                </button>
              ))}
            </div>
          )}
        </p>
      </div>
      <p className="text-[#62748e] text-sm leading-relaxed">{BODIES[topSort]}</p>
    </div>
  )
}

export function TopLabsPanel({ labs, topSort, onSortChange, compositeScore, onLabClick, onBack, onClose }: Props) {
  const sorted = [...labs].filter(l => {
    if (topSort === 'specialisation') {
      if (!l.worksCount || !l.alzPubCount) return false
      return (l.alzPubCount / l.worksCount) <= 1
    }
    if (topSort === 'impact')    return (l.citedByCount ?? 0) > 0 && (l.worksCount ?? 0) > 0
    if (topSort === 'composite') return (l.alzPubCount ?? 0) > 0 && (l.worksCount ?? 0) > 0
    return (l.alzPubCount ?? 0) > 0
  }).sort((a, b) => {
    if (topSort === 'specialisation') return ((b.alzPubCount ?? 0) / (b.worksCount ?? 1)) - ((a.alzPubCount ?? 0) / (a.worksCount ?? 1))
    if (topSort === 'impact')         return ((b.citedByCount ?? 0) / (b.worksCount || 1)) - ((a.citedByCount ?? 0) / (a.worksCount || 1))
    if (topSort === 'composite')      return compositeScore(b) - compositeScore(a)
    return (b.alzPubCount ?? 0) - (a.alzPubCount ?? 0)
  }).slice(0, 20)

  return (
    <>
      <PanelTopbar centerText="Classement des laboratoires" onBack={onBack} onClose={onClose} />

      <div className="flex-1 overflow-y-auto">
        <div className="px-8 py-8 max-w-[800px] mx-auto">
          <IntroBlock topSort={topSort} onSortChange={onSortChange} />

          {sorted.map((lab, idx) => (
            <button
              key={lab.id}
              onClick={() => onLabClick(lab)}
              className="w-full text-left py-6 border-b border-slate-100 cursor-pointer"
              style={{ animation: `fichefade 0.4s cubic-bezier(0.25,0.46,0.45,0.94) ${idx * 30}ms both` }}
            >
              <div className="flex items-start gap-3 mb-2">
                <span
                  className="font-heading font-bold flex-shrink-0 mt-1 w-6 text-right"
                  style={{ fontSize: 'clamp(1rem, 1.4vw, 1.15rem)', color: DOT_COLOR }}
                >
                  {idx + 1}
                </span>
                <div>
                  <h2 className="text-2xl font-bold font-heading text-slate-900 leading-tight">{parseName(lab.name).name}</h2>
                  <p className="flex items-center gap-2 text-2xl font-bold font-heading leading-tight" style={{ color: '#7F8997' }}>
                    <SortIcon sort={topSort} />
                    {metricLabel(lab, topSort, compositeScore)}
                  </p>
                  <p className="text-slate-500 text-sm mt-1">
                    {lab.city}{parseName(lab.name).acronym ? ` · ${parseName(lab.name).acronym}` : ''}
                  </p>
                </div>
              </div>
              {lab.type === 'fra' && (
                <div className="ml-5">
                  <span
                    className="inline-flex items-center text-xs font-medium px-2 py-1 rounded-full"
                    style={{ background: 'rgba(130,49,168,0.1)', color: DOT_COLOR }}
                  >
                    Soutenu par la FRA
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
