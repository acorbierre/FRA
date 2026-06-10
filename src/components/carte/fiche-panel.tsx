'use client'

import { ExternalLink, BookOpen, Quote, Tag, TrendingUp, Target } from 'lucide-react'
import { type Lab } from '@/data/alzheimer-labs'
import { PanelTopbar } from './panel-topbar'
import { DOT_COLOR, LIGHT_COLOR, formatCount, specializationRatio } from './map-utils'

interface Publication {
  id: string
  title: string
  year: number
  citations: number
  doi: string | null
}

interface Props {
  lab: Lab
  publications: Publication[]
  closingFiche: boolean
  onBack: () => void
  onClose: () => void
}

function fadeAnim(closing: boolean, delay: number, enterDelay: number) {
  return closing
    ? `fichefade-out 0.25s ${delay}ms ease forwards`
    : `fichefade 0.55s ${enterDelay}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`
}

export function FichePanel({ lab, publications, closingFiche, onBack, onClose }: Props) {
  return (
    <div className="flex-1 overflow-y-auto" style={{ animation: 'fichefade 0.35s ease forwards' }}>
      <PanelTopbar centerText="Actualité du laboratoire" onBack={onBack} onClose={onClose} />

      <div className="px-8 py-8 max-w-2xl mx-auto">
        {/* Nom + badge */}
        <div
          className="flex items-start gap-3 mb-2"
          style={{ animation: fadeAnim(closingFiche, 240, 350), opacity: closingFiche ? 1 : 0 }}
        >
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-2" style={{ background: lab.type === 'fra' ? DOT_COLOR : LIGHT_COLOR }} />
          <div>
            <h1 className="text-2xl font-bold font-heading text-slate-900 leading-tight">{lab.name}</h1>
            <p className="text-slate-500 text-sm mt-1">{lab.city} · {lab.country}</p>
          </div>
        </div>

        <div
          className="flex flex-wrap gap-2 ml-5 mb-6"
          style={{ animation: fadeAnim(closingFiche, 180, 430), opacity: closingFiche ? 1 : 0 }}
        >
          {lab.type === 'fra' && (
            <span className="inline-flex items-center text-xs font-medium px-2 py-1 rounded-full" style={{ background: 'rgba(130,49,168,0.1)', color: DOT_COLOR }}>
              Soutenu par la FRA
            </span>
          )}
        </div>

        {/* KPI cards */}
        <div
          className="grid grid-cols-2 gap-4 mt-6 mb-6"
          style={{ animation: fadeAnim(closingFiche, 120, 520), opacity: closingFiche ? 1 : 0 }}
        >
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-100/70">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1">
              <BookOpen size={12} /> Publications Alzheimer
            </div>
            <p className="text-3xl font-bold font-heading" style={{ color: DOT_COLOR }}>
              {lab.alzPubCount ? lab.alzPubCount.toLocaleString('fr-FR') : '—'}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-100/70">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1">
              <Quote size={12} /> Citations (toutes thématiques)
            </div>
            <p className="text-3xl font-bold font-heading text-slate-700">
              {lab.citedByCount ? formatCount(lab.citedByCount) : '—'}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-100/70">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1">
              <TrendingUp size={12} /> Score d'impact
            </div>
            {lab.citedByCount && lab.worksCount ? (
              <>
                <p className="text-3xl font-bold font-heading text-slate-700">
                  {Math.round(lab.citedByCount / lab.worksCount).toLocaleString('fr-FR')}
                </p>
                <p className="text-[#62748e] text-xs mt-0.5">citations moy. / publication</p>
              </>
            ) : (
              <>
                <p className="text-3xl font-bold font-heading text-slate-700">—</p>
                <p className="text-[#62748e] text-xs mt-0.5">disponible après import</p>
              </>
            )}
          </div>
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-100/70">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1">
              <Target size={12} /> Spécialisation Alzheimer
            </div>
            {specializationRatio(lab) !== null ? (
              <>
                <p className="text-3xl font-bold font-heading" style={{ color: DOT_COLOR }}>
                  {Math.round((specializationRatio(lab) ?? 0) * 100)}&nbsp;%
                </p>
                <p className="text-[#62748e] text-xs mt-0.5">des publications</p>
              </>
            ) : (
              <p className="text-3xl font-bold font-heading text-slate-700">—</p>
            )}
          </div>
        </div>

        {/* Publications récentes */}
        {publications.length > 0 && (
          <div
            className="mt-8 mb-12"
            style={{ animation: fadeAnim(closingFiche, 60, 620), opacity: closingFiche ? 1 : 0 }}
          >
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: DOT_COLOR }}>
              <BookOpen size={12} /> Publications récentes
            </div>
            <div className="flex flex-col gap-4">
              {publications.map((pub, i) => (
                <a
                  key={i}
                  href={pub.doi ? `https://doi.org/${pub.doi.replace('https://doi.org/', '')}` : `https://openalex.org/${pub.id.split('/').pop()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3"
                >
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2" style={{ background: DOT_COLOR, opacity: 0.5 }} />
                  <div className="min-w-0 flex-1">
                    <p className="font-heading font-semibold text-slate-700 leading-snug line-clamp-2 group-hover:underline group-hover:text-slate-900 transition-colors" style={{ fontSize: '1.1rem' }}>{pub.title}</p>
                    <p className="text-[#62748e] text-xs mt-1">{pub.year} · {pub.citations.toLocaleString('fr-FR')} citations</p>
                  </div>
                  <ExternalLink size={15} className="flex-shrink-0 mt-1.5 text-[#62748e] group-hover:text-purple-500 transition-colors" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Domaines de recherche */}
        {lab.topics && lab.topics.length > 0 && (
          <div
            className="mb-12"
            style={{ animation: fadeAnim(closingFiche, 30, 720), opacity: closingFiche ? 1 : 0 }}
          >
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: DOT_COLOR }}>
              <Tag size={12} /> Domaines de recherche
            </div>
            <div className="flex flex-col gap-2">
              {lab.topics.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: DOT_COLOR, opacity: 1 - i * 0.15 }} />
                  <span className="text-slate-700 text-sm">{t.name}</span>
                  {t.field && <span className="text-slate-500 text-xs">· {t.field}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Liens */}
        <div
          className="flex flex-wrap gap-3"
          style={{ animation: fadeAnim(closingFiche, 0, 820), opacity: closingFiche ? 1 : 0 }}
        >
          {lab.url && (
            <a
              href={lab.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:border-purple-300 hover:text-purple-700 transition-colors"
            >
              Site web <ExternalLink size={12} />
            </a>
          )}
          {lab.neonId && (
            <a
              href={`/gestion/laboratoires/${lab.neonId}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg text-white transition-colors"
              style={{ background: DOT_COLOR }}
            >
              Fiche labo FRA →
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
