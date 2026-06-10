'use client'

import { ArrowDown, TrendingUp, Target, Sparkles, BookOpen } from 'lucide-react'
import { type Lab } from '@/data/alzheimer-labs'
import { PanelTopbar } from './panel-topbar'
import { DOT_COLOR } from './map-utils'

type TopSort = 'publications' | 'impact' | 'specialisation' | 'composite'

interface Props {
  labs: Lab[]
  topSort: TopSort
  onSortChange: (sort: TopSort) => void
  compositeScore: (l: Lab) => number
  onLabClick: (lab: Lab) => void
  onBack: () => void
  onClose: () => void
}

const SORT_TABS: { key: TopSort; label: string }[] = [
  { key: 'impact',         label: "Score d'impact" },
  { key: 'publications',   label: 'Publications Alzheimer' },
  { key: 'specialisation', label: 'Spécialisation Alzheimer' },
  { key: 'composite',      label: 'Pertinence FRA' },
]

function metricLabel(lab: Lab, topSort: TopSort, compositeScore: (l: Lab) => number): string {
  if (topSort === 'impact')         return `${Math.round((lab.citedByCount ?? 0) / (lab.worksCount ?? 1)).toLocaleString('fr-FR')} cit./pub.`
  if (topSort === 'specialisation') return `${Math.round(((lab.alzPubCount ?? 0) / (lab.worksCount ?? 1)) * 100)}\u202f%`
  if (topSort === 'composite')      return `${Math.round(compositeScore(lab) * 100)}\u202f/ 100`
  return `${(lab.alzPubCount ?? 0).toLocaleString('fr-FR')} publications`
}

function SortIcon({ sort, size = 20 }: { sort: TopSort; size?: number }) {
  if (sort === 'impact')         return <TrendingUp size={size} strokeWidth={2.5} />
  if (sort === 'specialisation') return <Target size={size} strokeWidth={2.5} />
  if (sort === 'composite')      return <Sparkles size={size} strokeWidth={2.5} />
  return <BookOpen size={size} strokeWidth={2.5} />
}

function IntroBlock({ topSort }: { topSort: TopSort }) {
  const titles: Record<TopSort, string> = {
    impact:         "Score d'impact",
    publications:   'Nombre de publications Alzheimer',
    specialisation: 'Taux de spécialisation Alzheimer',
    composite:      'Pertinence pour la FRA',
  }
  const bodies: Record<TopSort, React.ReactNode> = {
    impact: <>Le score d'impact mesure le nombre moyen de citations reçues par publication, toutes thématiques confondues. Un score élevé signale un laboratoire dont les travaux font référence dans la communauté scientifique — un indicateur de crédibilité et d'influence particulièrement pertinent pour identifier des partenaires FRA de haut niveau.</>,
    publications: <>Le nombre de publications Alzheimer est extrait d'OpenAlex, base de données bibliographique ouverte qui indexe plus de 250 millions de travaux scientifiques. Il reflète le volume de contributions d'un laboratoire sur la thématique Alzheimer et maladies apparentées.</>,
    specialisation: <>Le taux de spécialisation correspond à la part des publications Alzheimer dans la production scientifique totale du laboratoire. Un taux élevé indique un laboratoire fortement centré sur la thématique — un critère de pertinence complémentaire au volume brut de publications.</>,
    composite: <>La pertinence FRA croise trois indicateurs pour identifier les laboratoires à la fois influents, actifs sur Alzheimer et centrés sur le sujet&nbsp;: score d'impact (40&nbsp;%), volume de publications Alzheimer (35&nbsp;%) et taux de spécialisation (25&nbsp;%). Chaque métrique est normalisée de 0 à 100 par rapport au maximum du dataset, puis pondérée pour donner un score global sur 100.</>,
  }

  return (
    <div className="mt-8 mb-8">
      <div className="font-bold font-heading leading-tight mb-2" style={{ fontSize: 'clamp(1.4rem, 2.2vw, 2.1rem)' }}>
        <p style={{ color: '#7F8997' }}>Classement des laboratoires</p>
        <p><span style={{ color: '#7F8997' }}>par </span><span style={{ color: DOT_COLOR }}>{titles[topSort]}</span></p>
      </div>
      <p className="text-[#62748e] text-sm leading-relaxed">{bodies[topSort]}</p>
    </div>
  )
}

export function TopLabsPanel({ labs, topSort, onSortChange, compositeScore, onLabClick, onBack, onClose }: Props) {
  const sorted = [...labs].filter(l => {
    if (topSort === 'impact')         return (l.citedByCount ?? 0) > 0 && (l.worksCount ?? 0) > 0
    if (topSort === 'specialisation') return (l.worksCount ?? 0) > 0 && (l.alzPubCount ?? 0) > 0
    if (topSort === 'composite')      return (l.alzPubCount ?? 0) > 0 && (l.worksCount ?? 0) > 0
    return (l.alzPubCount ?? 0) > 0
  }).sort((a, b) => {
    if (topSort === 'impact')         return ((b.citedByCount ?? 0) / (b.worksCount ?? 1)) - ((a.citedByCount ?? 0) / (a.worksCount ?? 1))
    if (topSort === 'specialisation') return ((b.alzPubCount ?? 0) / (b.worksCount ?? 1)) - ((a.alzPubCount ?? 0) / (a.worksCount ?? 1))
    if (topSort === 'composite')      return compositeScore(b) - compositeScore(a)
    return (b.alzPubCount ?? 0) - (a.alzPubCount ?? 0)
  }).slice(0, 20)

  return (
    <>
      <PanelTopbar centerText="" onBack={onBack} onClose={onClose}>
        <div className="flex-1 flex items-center justify-center gap-6">
          <span className="font-heading text-[#62748e] text-sm">Trier par :</span>
          {SORT_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => onSortChange(tab.key)}
              className="font-heading cursor-pointer flex items-center gap-1 transition-colors"
              style={{
                fontSize: '0.88rem',
                fontWeight: topSort === tab.key ? 700 : 500,
                color: topSort === tab.key ? '#0f172a' : '#64748b',
              }}
            >
              {tab.label}
              <ArrowDown size={12} style={{ opacity: topSort === tab.key ? 1 : 0.5 }} />
            </button>
          ))}
        </div>
      </PanelTopbar>

      <div className="flex-1 overflow-y-auto">
        <div className="px-8 py-8 max-w-2xl mx-auto">
          <IntroBlock topSort={topSort} />

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
                  <h2 className="text-2xl font-bold font-heading text-slate-900 leading-tight">{lab.name}</h2>
                  <p className="flex items-center gap-2 text-2xl font-bold font-heading leading-tight" style={{ color: '#7F8997' }}>
                    <SortIcon sort={topSort} />
                    {metricLabel(lab, topSort, compositeScore)}
                  </p>
                  <p className="text-slate-500 text-sm mt-1">{lab.city}</p>
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
