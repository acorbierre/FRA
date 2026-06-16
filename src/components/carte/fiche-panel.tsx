'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ExternalLink, BookOpen, Tag, TrendingUp, Target, ArrowRight, Share2, X } from 'lucide-react'
import { type Lab } from '@/data/alzheimer-labs'
import { PanelTopbar } from './panel-topbar'
import { DOT_COLOR, LIGHT_COLOR, formatCount, specializationRatio, parseName } from './map-utils'
import { DiagnosticBlock } from './diagnostic-block'

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
  onOpenLab?: (labId: string) => void
}

type Tab = 'overview' | 'projets-fra' | 'publications' | 'domaines'

function fadeAnim(closing: boolean, delay: number, enterDelay: number) {
  return closing
    ? `fichefade-out 0.25s ${delay}ms ease forwards`
    : `fichefade 0.55s ${enterDelay}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`
}

interface ProjetFRA {
  id: string
  titre: string
  statut: string
  montantAccorde: number
  dateDebut?: string
  dateFinPrevue?: string
}

function KpiCard({ opacity, onClick, children }: { opacity?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <div
      className={`rounded-xl border border-slate-200 p-4 bg-slate-100/70${opacity ? ' opacity-35' : ''}${onClick ? ' cursor-pointer hover:border-purple-300 transition-colors' : ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export function FichePanel({ lab, publications, closingFiche, onBack, onClose, onOpenLab }: Props) {
  const [tab, setTab] = useState<Tab>('overview')
  const [projetFRA, setProjetFRA] = useState<ProjetFRA | null | undefined>(undefined)
  const [showCollabs, setShowCollabs] = useState(false)
  const [collabsClosing, setCollabsClosing] = useState(false)

  function closeCollabs() {
    setCollabsClosing(true)
    setTimeout(() => { setShowCollabs(false); setCollabsClosing(false) }, 180)
  }

  useEffect(() => {
    if (!lab.neonId) { setProjetFRA(null); return }
    setProjetFRA(undefined)
    fetch(`/api/carto/lab-projet?neonId=${lab.neonId}`)
      .then(r => r.json())
      .then(d => setProjetFRA(d.projet ?? null))
      .catch(() => setProjetFRA(null))
  }, [lab.neonId])

  return (
    <div className="flex-1 overflow-y-auto flex flex-col" style={{ animation: 'fichefade 0.35s ease forwards' }}>
      <PanelTopbar centerText="Actualité du laboratoire" onBack={onBack} onClose={onClose} />

      <div className="px-8 pt-8 max-w-[800px] mx-auto w-full">
        {/* Nom + badge */}
        <div
          className="flex items-start gap-3 mb-2"
          style={{ animation: fadeAnim(closingFiche, 240, 350), opacity: closingFiche ? 1 : 0 }}
        >
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-2" style={{ background: lab.type === 'fra' ? DOT_COLOR : LIGHT_COLOR }} />
          <div>
            <h1 className="text-3xl font-bold font-heading text-slate-900 leading-tight">{parseName(lab.name).name}</h1>
            <p className="text-slate-500 text-sm mt-1">
              {lab.city}{lab.country && lab.country !== 'France' ? ` · ${lab.country}` : ''}
              {parseName(lab.name).acronym ? ` · ${parseName(lab.name).acronym}` : ''}
            </p>
          </div>
        </div>

        <div
          className="flex flex-wrap gap-2 ml-5 mb-5"
          style={{ animation: fadeAnim(closingFiche, 180, 430), opacity: closingFiche ? 1 : 0 }}
        >
          {lab.type === 'fra' && (
            <span className="inline-flex items-center text-xs font-medium px-2 py-1 rounded-full" style={{ background: 'rgba(130,49,168,0.1)', color: DOT_COLOR }}>
              Soutenu par la FRA
            </span>
          )}
        </div>

        {/* Tabs */}
        <div
          className="flex border-b border-slate-200 mb-6"
          style={{ animation: fadeAnim(closingFiche, 120, 500), opacity: closingFiche ? 1 : 0 }}
        >
          {([
            { key: 'overview' as Tab,      label: 'Vue d\'ensemble' },
            ...(lab.neonId ? [{ key: 'projets-fra' as Tab, label: 'Projets FRA' }] : []),
            { key: 'publications' as Tab,  label: 'Publications' },
            { key: 'domaines' as Tab,      label: 'Domaines' },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer"
              style={{
                color: tab === key ? DOT_COLOR : '#62748e',
                borderBottom: tab === key ? `2px solid ${DOT_COLOR}` : '2px solid transparent',
                marginBottom: '-1px',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div
        className="px-8 pb-12 max-w-[800px] mx-auto w-full"
        style={{ animation: fadeAnim(closingFiche, 60, 560), opacity: closingFiche ? 1 : 0 }}
      >
        <div style={{ display: tab === 'overview' ? 'block' : 'none' }}>
          <>
            {/* KPI cards — 4 colonnes */}
            <div className="grid grid-cols-4 gap-3 mb-6 items-stretch">
              <KpiCard>
                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold uppercase tracking-wide mb-2">
                  <BookOpen size={11} /> Pub. Alzheimer
                </div>
                <p className="text-3xl font-bold font-heading" style={{ color: DOT_COLOR }}>
                  {lab.alzPubCount ? lab.alzPubCount.toLocaleString('fr-FR') : '—'}
                </p>
              </KpiCard>

              {(() => {
                const citPerPub = (lab.citedByCount && lab.worksCount)
                  ? Math.round(lab.citedByCount / lab.worksCount)
                  : null
                return (
                  <KpiCard opacity={!citPerPub}>
                    <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold uppercase tracking-wide mb-2">
                      <TrendingUp size={11} /> Impact
                    </div>
                    <p className="text-3xl font-bold font-heading" style={{ color: citPerPub ? DOT_COLOR : undefined }}>
                      {citPerPub || '—'}
                    </p>
                    {citPerPub ? <p className="text-[#62748e] text-xs mt-0.5">citations / pub.</p> : null}
                  </KpiCard>
                )
              })()}

              <KpiCard opacity={specializationRatio(lab) === null}>
                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold uppercase tracking-wide mb-2">
                  <Target size={11} /> Spécialisation
                </div>
                {(() => {
                  const ratio = specializationRatio(lab)
                  if (ratio === null) return <p className="text-3xl font-bold font-heading text-slate-700">—</p>
                  const pct = ratio * 100
                  const display = pct < 1 ? '< 1' : Math.round(pct).toString()
                  return (
                    <>
                      <p className="text-3xl font-bold font-heading" style={{ color: DOT_COLOR }}>
                        {display}&nbsp;%
                      </p>
                      <p className="text-[#62748e] text-xs mt-0.5">des publications</p>
                    </>
                  )
                })()}
              </KpiCard>

              <KpiCard
                opacity={!lab.topCollabs?.length}
                onClick={lab.topCollabs?.length ? () => setShowCollabs(true) : undefined}
              >
                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold uppercase tracking-wide mb-2">
                  <Share2 size={11} /> Réseau
                </div>
                <p className="text-3xl font-bold font-heading" style={{ color: lab.topCollabs?.length ? DOT_COLOR : undefined }}>
                  {lab.topCollabs?.length ? lab.topCollabs.length : '—'}
                </p>
                {lab.topCollabs?.length ? <p className="text-[#62748e] text-xs mt-0.5">co-laboratoires</p> : null}
              </KpiCard>
            </div>

            {/* Modale co-laboratoires — rendue via portal pour échapper aux transforms des ancêtres */}
            {showCollabs && lab.topCollabs?.length ? createPortal(
              <div
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                style={{ animation: `${collabsClosing ? 'fichefade-out' : 'fichefade'} 0.18s ease forwards` }}
                onClick={closeCollabs}
              >
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                <div
                  className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[70vh] flex flex-col"
                  style={{ animation: `${collabsClosing ? 'fichefade-out' : 'fichefade'} 0.22s ease forwards` }}
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <p className="font-heading font-semibold text-slate-800">Co-laboratoires ({lab.topCollabs.length})</p>
                    <button onClick={closeCollabs} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                      <X size={18} />
                    </button>
                  </div>
                  <div className="overflow-y-auto divide-y divide-slate-50 px-6">
                    {lab.topCollabs.map((c, i) => (
                      <div key={c.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-bold w-5 text-right flex-shrink-0" style={{ color: DOT_COLOR }}>{i + 1}</span>
                          {c.labId && onOpenLab ? (
                            <button
                              className="text-sm font-medium text-left hover:underline cursor-pointer truncate"
                              style={{ color: DOT_COLOR }}
                              onClick={() => { setShowCollabs(false); onOpenLab(c.labId!) }}
                            >
                              {c.nom}
                            </button>
                          ) : (
                            <span className="text-sm text-slate-700 truncate">{c.nom}</span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 flex-shrink-0">{c.count} co-pub.</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>,
              document.body
            ) : null}

            {/* Diagnostic IA */}
            <DiagnosticBlock lab={lab} publications={publications} />
          </>
        </div>

        {/* Projets FRA — toujours monté */}
        <div style={{ display: tab === 'projets-fra' ? 'block' : 'none' }}>
          {projetFRA === undefined && (
            <p className="text-sm" style={{ color: '#62748e' }}>Chargement…</p>
          )}
          {projetFRA === null && (
            <p className="text-sm mb-4" style={{ color: '#62748e' }}>Aucun projet en cours de suivi.</p>
          )}
          {projetFRA && (
            <a
              href={`/gestion/projets/${projetFRA.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between gap-4 rounded-xl p-5 border border-slate-200 transition-colors hover:border-purple-300 mb-4"
            >
              <div className="min-w-0 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: DOT_COLOR }}>
                  Projet en cours de suivi
                </p>
                <p className="text-base font-semibold text-slate-800 leading-snug">{projetFRA.titre}</p>
                <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                  {projetFRA.montantAccorde > 0 && (
                    <span>{projetFRA.montantAccorde.toLocaleString('fr-FR')} €</span>
                  )}
                  {projetFRA.dateDebut && projetFRA.dateFinPrevue && (
                    <span>{new Date(projetFRA.dateDebut).getFullYear()} → {new Date(projetFRA.dateFinPrevue).getFullYear()}</span>
                  )}
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: 'rgba(130,49,168,0.12)', color: DOT_COLOR }}>
                    {projetFRA.statut}
                  </span>
                </div>
              </div>
              <ArrowRight size={16} className="shrink-0 text-slate-400 group-hover:text-purple-500 transition-colors" />
            </a>
          )}
          {lab.neonId && (
            <div className="mt-2">
              <a
                href={`/gestion/laboratoires/${lab.neonId}`}
                className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg text-white transition-colors"
                style={{ background: DOT_COLOR }}
              >
                Fiche labo FRA →
              </a>
            </div>
          )}
        </div>

        {/* Publications — toujours monté pour éviter le restreamage */}
        <div style={{ display: tab === 'publications' ? 'block' : 'none' }}>
          {publications.length > 0 ? (
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
          ) : (
            <p className="text-[#62748e] text-sm">Aucune publication disponible.</p>
          )}
        </div>

        {/* Domaines — toujours monté */}
        <div style={{ display: tab === 'domaines' ? 'block' : 'none' }}>
          {lab.topics && lab.topics.length > 0 ? (
            <div className="mb-8">
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
          ) : (
            <p className="text-[#62748e] text-sm mb-8">Aucun domaine référencé.</p>
          )}

          <div className="flex flex-wrap gap-3">
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
          </div>
        </div>
      </div>
    </div>
  )
}
