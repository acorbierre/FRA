'use client'

import { useState } from 'react'
import { Info, X } from 'lucide-react'

const SOURCES = [
  {
    name: 'HAL',
    logo: '/logos/hal.png',
    fullName: 'Hyper Articles en Ligne',
    url: 'https://hal.science',
    badge: 'France · UMR',
    description: 'Référentiel officiel des unités de recherche françaises. Utilisé pour identifier les laboratoires ayant publié sur la maladie d\'Alzheimer (granularité UMR), compter leurs publications thématiques, et cartographier leurs réseaux de co-publication.',
  },
  {
    name: 'OpenAlex',
    logo: '/logos/openalex.png',
    fullName: 'Open Scholarly Graph',
    url: 'https://openalex.org',
    badge: 'Europe · Citations',
    description: 'Base de données bibliométrique mondiale en open access. Utilisée pour les institutions de recherche européennes hors France (Allemagne, Royaume-Uni, Italie, Espagne, Pays-Bas, Belgique, Suisse) et pour enrichir les laboratoires français avec leurs données de citations et leur production scientifique totale.',
  },
  {
    name: 'BAN',
    logo: '/logos/ban.png',
    fullName: 'Base Adresse Nationale',
    url: 'https://adresse.data.gouv.fr',
    badge: 'Géocodage',
    description: 'API de géocodage du gouvernement français (data.gouv.fr). Convertit les adresses postales des laboratoires en coordonnées géographiques (latitude / longitude) pour les placer sur la carte.',
  },
]

export function InfoSourcesButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="pointer-events-auto text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
        title="Sources de données"
      >
        <Info size={18} />
      </button>

      {open && (
        // pointer-events-auto pour contrecarrer le pointer-events-none du header parent
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-auto"
          style={{ background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)' }}
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-5xl bg-white rounded-3xl p-10"
            style={{ boxShadow: '0 40px 100px -16px rgba(0,0,0,0.25), 0 8px 32px -4px rgba(0,0,0,0.08)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-10">
              <div>
                <h2 className="text-2xl font-bold font-heading text-slate-900">Sources de données</h2>
                <p className="text-slate-500 mt-1.5">La cartographie agrège 3 bases open data complémentaires.</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer mt-1"
              >
                <X size={22} />
              </button>
            </div>

            {/* Sources — 3 colonnes */}
            <div className="grid grid-cols-3 gap-8">
              {SOURCES.map(s => (
                <div key={s.name} className="flex flex-col gap-5">
                  {/* Logo */}
                  <img
                    src={s.logo}
                    alt={s.name}
                    className="h-12 object-contain object-left"
                  />

                  {/* Nom + badge */}
                  <div>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base font-bold text-slate-900 hover:underline"
                    >
                      {s.fullName}
                    </a>
                    <div className="mt-1.5">
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {s.badge}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-500 leading-relaxed">{s.description}</p>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-10 pt-6 border-t border-slate-100 text-xs text-slate-400 text-center">
              Toutes les sources sont libres d'accès et gratuites · Données mises à jour manuellement
            </div>
          </div>
        </div>
      )}
    </>
  )
}
