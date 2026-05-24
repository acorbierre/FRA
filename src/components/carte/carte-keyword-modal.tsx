'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { SlidersHorizontal, X, Plus, Loader2 } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DEFAULT_NOM_KEYWORDS, DEFAULT_PANEL_KEYWORDS } from '@/lib/carte-keywords'

interface KeywordRow { id: string; keyword: string }

interface Props { customKeywords: string[] }

export default function CarteKeywordModal({ customKeywords: initialKeywords }: Props) {
  const router = useRouter()
  const [open, setOpen]         = useState(false)
  const [items, setItems]       = useState<KeywordRow[]>([])
  const [loading, setLoading]   = useState(false)
  const [inputVal, setInputVal] = useState('')
  const [adding, setAdding]     = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError]       = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/gestion/carte/keywords')
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch {
      setError('Impossible de charger les mots-clés')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      setError(null)
      fetchItems()
    }
  }

  const handleAdd = async () => {
    const keywords = inputVal.split(',').map(k => k.trim().toLowerCase()).filter(Boolean)
    if (keywords.length === 0) return
    setAdding(true)
    setError(null)
    try {
      const results = await Promise.all(
        keywords.map(kw =>
          fetch('/api/gestion/carte/keywords', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keyword: kw }),
          }).then(r => r.json())
        )
      )
      const added = results.filter(d => d?.id)
      if (added.length > 0) {
        setItems(prev => [...prev, ...added])
        setInputVal('')
        router.refresh()
      }
      const errors = results.filter(d => !d?.id).map(d => d?.error).filter(Boolean)
      if (errors.length > 0) setError(errors.join(', '))
    } catch {
      setError('Erreur réseau')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    setError(null)
    try {
      await fetch('/api/gestion/carte/keywords', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setItems(prev => prev.filter(i => i.id !== id))
      router.refresh()
    } catch {
      setError('Erreur lors de la suppression')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger
        className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 transition-colors text-sm font-medium cursor-pointer"
        title="Configurer les mots-clés"
      >
        <SlidersHorizontal size={15} />
        <span>Filtres</span>
        {initialKeywords.length > 0 && (
          <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-1.5 py-0.5 rounded-full leading-none">
            +{initialKeywords.length}
          </span>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold font-heading text-slate-900 leading-tight">
            Mots-clés de la cartographie
          </DialogTitle>
        </DialogHeader>

        {/* Section non modifiable */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Par défaut — non modifiables
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[...DEFAULT_NOM_KEYWORDS, ...DEFAULT_PANEL_KEYWORDS].map(kw => (
              <span
                key={kw}
                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-100" />

        {/* Section personnalisable */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Personnalisés
          </p>

          {loading ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm py-1">
              <Loader2 size={14} className="animate-spin" />
              Chargement…
            </div>
          ) : items.length === 0 ? (
            <p className="text-slate-400 text-sm py-1">Aucun mot-clé ajouté</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {items.map(item => (
                <span
                  key={item.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200"
                >
                  {item.keyword}
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="text-purple-400 hover:text-purple-700 transition-colors disabled:opacity-40 ml-0.5 cursor-pointer"
                    aria-label={`Supprimer ${item.keyword}`}
                  >
                    {deletingId === item.id
                      ? <Loader2 size={10} className="animate-spin" />
                      : <X size={10} />
                    }
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Champ d'ajout */}
          <div className="flex gap-2 pt-1">
            <Input
              value={inputVal}
                onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
              placeholder="mot1, mot2, mot3…"
              className="h-8 text-sm"
              disabled={adding}
            />
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={adding || !inputVal.trim()}
              className="h-8 gap-1.5 flex-shrink-0"
            >
              {adding ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              Ajouter
            </Button>
          </div>

          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
