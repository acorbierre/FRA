'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { CheckCircle2, AlertCircle, Loader2, Palette } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { saveAppearanceSettings } from './actions'
import type { AppSettings } from '@/services/neon/settings'
import { CANDIDATURE_STATUTS, PROJET_STATUTS } from '@/lib/config'

const COLOR_PALETTE = [
  { label: 'Bleu pâle',   value: 'bg-blue-50 text-blue-700',     swatch: 'bg-blue-100' },
  { label: 'Bleu',        value: 'bg-blue-100 text-blue-800',    swatch: 'bg-blue-200' },
  { label: 'Vert pâle',   value: 'bg-green-100 text-green-800',  swatch: 'bg-green-100' },
  { label: 'Vert',        value: 'bg-green-600 text-white',      swatch: 'bg-green-600' },
  { label: 'Amber pâle',  value: 'bg-amber-50 text-amber-700',   swatch: 'bg-amber-100' },
  { label: 'Amber',       value: 'bg-amber-100 text-amber-800',  swatch: 'bg-amber-200' },
  { label: 'Orange pâle', value: 'bg-orange-50 text-orange-700', swatch: 'bg-orange-100' },
  { label: 'Orange',      value: 'bg-orange-100 text-orange-800',swatch: 'bg-orange-200' },
  { label: 'Rouge pâle',  value: 'bg-red-50 text-red-700',       swatch: 'bg-red-100' },
  { label: 'Rouge',       value: 'bg-red-100 text-red-800',      swatch: 'bg-red-200' },
  { label: 'Violet pâle', value: 'bg-purple-50 text-purple-700', swatch: 'bg-purple-100' },
  { label: 'Gris',        value: 'bg-zinc-100 text-zinc-600',    swatch: 'bg-zinc-200' },
]

function ColorPicker({
  currentValue,
  onChange,
}: {
  currentValue: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} className="relative inline-flex items-center gap-1.5">
      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${currentValue}`}>
        Aperçu
      </span>
      <button
        onClick={() => setOpen(o => !o)}
        title="Changer la couleur"
        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
      >
        <Palette className="size-3.5" />
      </button>
      {open && (
        <div className="absolute left-0 bottom-full mb-1.5 z-50 bg-white border border-border rounded-xl shadow-lg p-2.5 w-max">
          <div className="grid grid-cols-6 gap-1.5">
            {COLOR_PALETTE.map(c => (
              <button
                key={c.value}
                title={c.label}
                onClick={() => { onChange(c.value); setOpen(false) }}
                className={`w-6 h-6 rounded-md border-2 transition-all cursor-pointer ${c.swatch} ${
                  currentValue === c.value
                    ? 'border-foreground scale-110'
                    : 'border-transparent hover:border-foreground/30'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface Props { settings: AppSettings }

export default function AppearancePanel({ settings }: Props) {
  const [colors, setColors] = useState({ ...settings.statut_colors })
  const [labels, setLabels] = useState({ ...settings.statut_labels })
  const [labelsGestion, setLabelsGestion] = useState({ ...settings.statut_labels_gestion })
  const [projetColors, setProjetColors] = useState({ ...settings.projet_colors })
  const [projetLabels, setProjetLabels] = useState({ ...settings.projet_labels })
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  function saveCandidatures() {
    startTransition(async () => {
      try {
        await saveAppearanceSettings('statut_colors', colors)
        await saveAppearanceSettings('statut_labels', labels)
        await saveAppearanceSettings('statut_labels_gestion', labelsGestion)
        showToast('success', 'Statuts candidatures mis à jour')
      } catch {
        showToast('error', 'Erreur lors de la sauvegarde')
      }
    })
  }

  function saveProjets() {
    startTransition(async () => {
      try {
        await saveAppearanceSettings('projet_colors', projetColors)
        await saveAppearanceSettings('projet_labels', projetLabels)
        showToast('success', 'Statuts projets mis à jour')
      } catch {
        showToast('error', 'Erreur lors de la sauvegarde')
      }
    })
  }

  return (
    <div className="space-y-8">

      {/* Candidatures */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Statuts — Candidatures</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Libellés affichés selon le contexte et couleur du badge</p>
          </div>
          <button
            onClick={saveCandidatures}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isPending && <Loader2 className="size-3.5 animate-spin" />}
            Enregistrer
          </button>
        </div>
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-36">Statut interne</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Libellé candidat</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Libellé gestion</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-36">Couleur</th>
                </tr>
              </thead>
              <tbody>
                {CANDIDATURE_STATUTS.map(statut => (
                  <tr key={statut} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{statut}</td>
                    <td className="px-4 py-3">
                      <input
                        value={labels[statut] ?? statut}
                        onChange={e => setLabels(l => ({ ...l, [statut]: e.target.value }))}
                        className="w-full border border-border rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </td>
                    <td className="px-4 py-3">
                      {statut === 'Brouillon' ? (
                        <span className="text-xs text-muted-foreground italic">Non visible en gestion</span>
                      ) : (
                        <input
                          value={labelsGestion[statut] ?? statut}
                          onChange={e => setLabelsGestion(l => ({ ...l, [statut]: e.target.value }))}
                          className="w-full border border-border rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ColorPicker
                        currentValue={colors[statut] ?? 'bg-zinc-100 text-zinc-600'}
                        onChange={v => setColors(cs => ({ ...cs, [statut]: v }))}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>

      {/* Projets */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Statuts — Projets</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Libellé et couleur du badge dans l'espace gestion</p>
          </div>
          <button
            onClick={saveProjets}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isPending && <Loader2 className="size-3.5 animate-spin" />}
            Enregistrer
          </button>
        </div>
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-36">Statut interne</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Libellé</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-36">Couleur</th>
                </tr>
              </thead>
              <tbody>
                {PROJET_STATUTS.map(statut => (
                  <tr key={statut} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{statut}</td>
                    <td className="px-4 py-3">
                      <input
                        value={projetLabels[statut] ?? statut}
                        onChange={e => setProjetLabels(l => ({ ...l, [statut]: e.target.value }))}
                        className="w-full border border-border rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <ColorPicker
                        currentValue={projetColors[statut] ?? 'bg-zinc-100 text-zinc-600'}
                        onChange={v => setProjetColors(cs => ({ ...cs, [statut]: v }))}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>

      {toast && (
        <div className={`fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium z-50 ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
          {toast.msg}
        </div>
      )}
    </div>
  )
}
