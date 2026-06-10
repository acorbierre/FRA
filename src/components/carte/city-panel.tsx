'use client'

import { ArrowRight, BookOpen, TrendingUp, Target, Sparkles } from 'lucide-react'
import { type Lab } from '@/data/alzheimer-labs'
import { DOT_COLOR, LIGHT_COLOR, dominantCity, titleCase, specializationRatio } from './map-utils'

type SortBy = 'publications' | 'impact' | 'specialisation' | 'composite' | 'alpha' | 'fra'

interface Props {
  labs: Lab[]
  sortBy: SortBy
  onSortChange: (s: SortBy) => void
  compositeScore: (l: Lab) => number
  onLabClick: (lab: Lab) => void
  onClose: () => void
}

export function CityPanel({ labs, sortBy, onSortChange, compositeScore, onLabClick, onClose }: Props) {
  const sorted = [...labs].sort((a, b) => {
    if (sortBy === 'alpha') return a.name.localeCompare(b.name, 'fr')
    if (sortBy === 'fra') {
      if (a.type === 'fra' && b.type !== 'fra') return -1
      if (b.type === 'fra' && a.type !== 'fra') return 1
      return (b.alzPubCount ?? 0) - (a.alzPubCount ?? 0)
    }
    if (sortBy === 'impact')         return ((b.citedByCount ?? 0) / (b.worksCount || 1)) - ((a.citedByCount ?? 0) / (a.worksCount || 1))
    if (sortBy === 'specialisation') return ((b.alzPubCount ?? 0) / (b.worksCount || 1)) - ((a.alzPubCount ?? 0) / (a.worksCount || 1))
    if (sortBy === 'composite')      return compositeScore(b) - compositeScore(a)
    return (b.alzPubCount ?? 0) - (a.alzPubCount ?? 0)
  })

  return (
    <>
      <div className="flex items-start justify-between px-6 py-5 border-b border-slate-200 flex-shrink-0">
        <div>
          <p className="text-2xl font-bold font-heading text-slate-900 leading-tight">{titleCase(dominantCity(labs))}</p>
          <p className="text-slate-500 text-sm mt-1">
            {labs.length} institution{labs.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <label className="flex items-center gap-1.5 text-sm text-slate-500 cursor-pointer">
            <span className="whitespace-nowrap">Trier par</span>
            <select
              value={sortBy}
              onChange={e => onSortChange(e.target.value as SortBy)}
              className="text-sm text-slate-500 bg-transparent border-none focus:outline-none cursor-pointer hover:text-slate-700 transition-colors"
            >
              <option value="publications">Publications Alzheimer</option>
              <option value="impact">Score d'impact</option>
              <option value="specialisation">Spécialisation Alzheimer</option>
              <option value="composite">Pertinence FRA</option>
              <option value="alpha">Ordre alphabétique</option>
              <option value="fra">Partenaires FRA</option>
            </select>
          </label>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 flex-shrink-0 cursor-pointer"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
        {sorted.map((lab, idx) => (
          <div
            key={lab.id}
            className="group px-6 py-4 flex items-start gap-3 cursor-pointer hover:bg-purple-50 transition-colors"
            style={{
              ...(lab.type === 'fra' ? { background: 'rgba(130,49,168,0.07)' } : {}),
              animation: 'panelitem 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
              animationDelay: `${idx * 60}ms`,
              opacity: 0,
            }}
            onClick={() => onLabClick(lab)}
          >
            <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: lab.type === 'fra' ? DOT_COLOR : LIGHT_COLOR }} />
            <div className="min-w-0 flex-1">
              <p className="font-heading font-semibold leading-snug text-slate-700" style={{ fontSize: '1.1rem' }}>{lab.name}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <p className="tracking-wide font-medium" style={{ fontSize: '0.8rem', color: DOT_COLOR }}>{lab.city.toUpperCase()}</p>
                {lab.type === 'fra' && (
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(130,49,168,0.1)', color: DOT_COLOR }}>Soutenu FRA</span>
                )}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5" style={{ fontSize: '0.85rem', color: '#62748e' }}>
                {lab.alzPubCount ? (
                  <span className="flex items-center gap-1">
                    <BookOpen size={12} className="flex-shrink-0" />
                    {lab.alzPubCount.toLocaleString('fr-FR')} pub.
                  </span>
                ) : null}
                {lab.citedByCount && lab.worksCount ? (
                  <span className="flex items-center gap-1">
                    <TrendingUp size={12} className="flex-shrink-0" />
                    {Math.round(lab.citedByCount / lab.worksCount).toLocaleString('fr-FR')}
                  </span>
                ) : null}
                {specializationRatio(lab) !== null ? (
                  <span className="flex items-center gap-1">
                    <Target size={12} className="flex-shrink-0" />
                    {Math.round((specializationRatio(lab) ?? 0) * 100)}&nbsp;%
                  </span>
                ) : null}
                {(lab.alzPubCount ?? 0) > 0 && (lab.worksCount ?? 0) > 0 ? (
                  <span className="flex items-center gap-1">
                    <Sparkles size={12} className="flex-shrink-0" />
                    {Math.round(compositeScore(lab) * 100)}&nbsp;/ 100
                  </span>
                ) : null}
              </div>
            </div>
            <ArrowRight
              size={20}
              className="flex-shrink-0 self-center opacity-0 group-hover:opacity-100 translate-x-0 group-hover:translate-x-1.5 transition-all duration-200"
              style={{ color: DOT_COLOR }}
            />
          </div>
        ))}
      </div>
    </>
  )
}
