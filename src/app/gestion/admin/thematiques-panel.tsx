'use client'

import { useState, useTransition, useRef } from 'react'
import { Plus, Trash2, CheckCircle2, AlertCircle, Loader2, Pencil } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { Thematique } from '@/services/neon/thematiques'
import { addThematiqueAction, deleteThematiqueAction, updateThematiqueLabelAction } from './actions'

interface Props { thematiques: Thematique[] }

export default function ThematiquesPanel({ thematiques: initial }: Props) {
  const [items, setItems] = useState(initial)
  const [newLabel, setNewLabel] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingLabel, setEditingLabel] = useState('')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const editRef = useRef<HTMLInputElement>(null)

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  function startEdit(t: Thematique) {
    setEditingId(t.id)
    setEditingLabel(t.label)
    setTimeout(() => editRef.current?.select(), 0)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditingLabel('')
  }

  function handleRename(id: number) {
    if (!editingLabel.trim()) return cancelEdit()
    startTransition(async () => {
      try {
        const updated = await updateThematiqueLabelAction(id, editingLabel.trim())
        setItems(updated)
        setEditingId(null)
        showToast('success', 'Thématique renommée')
      } catch {
        showToast('error', 'Erreur lors de la modification')
      }
    })
  }

  function handleAdd() {
    if (!newLabel.trim()) return
    startTransition(async () => {
      try {
        const updated = await addThematiqueAction(newLabel.trim())
        setItems(updated)
        setNewLabel('')
        showToast('success', 'Thématique ajoutée')
      } catch {
        showToast('error', 'Erreur lors de l\'ajout')
      }
    })
  }

  function handleDelete(id: number) {
    startTransition(async () => {
      try {
        const updated = await deleteThematiqueAction(id)
        setItems(updated)
        showToast('success', 'Thématique supprimée')
      } catch {
        showToast('error', 'Erreur lors de la suppression')
      }
    })
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Ces thématiques apparaissent dans le formulaire de candidature et les fiches projet.
      </p>

      <div className="flex gap-2">
        <input
          value={newLabel}
          onChange={e => setNewLabel(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Nouvelle thématique…"
          className="flex-1 h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          onClick={handleAdd}
          disabled={isPending || !newLabel.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
          Ajouter
        </button>
      </div>

      <Card>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">Aucune thématique définie.</p>
          ) : (
            <ul className="divide-y divide-border">
              {items.map(t => (
                <li key={t.id} className="flex items-center gap-2 px-4 py-2.5">
                  {editingId === t.id ? (
                    <input
                      ref={editRef}
                      value={editingLabel}
                      onChange={e => setEditingLabel(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleRename(t.id)
                        if (e.key === 'Escape') cancelEdit()
                      }}
                      onBlur={() => handleRename(t.id)}
                      className="flex-1 h-8 rounded-md border border-primary px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  ) : (
                    <span className="flex-1 text-sm">{t.label}</span>
                  )}
                  <button
                    onClick={() => editingId === t.id ? cancelEdit() : startEdit(t)}
                    disabled={isPending}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
                    title="Renommer"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    disabled={isPending}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 cursor-pointer"
                    title="Supprimer"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

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
