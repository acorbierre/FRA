'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Pencil, Sparkles, Check, X, Loader2 } from 'lucide-react'

interface Props {
  id: string
  titre: string
  titreCourt?: string
  href: string
}

export default function TitreProjet({ id, titre, titreCourt: initialTitreCourt, href }: Props) {
  const [titreCourt, setTitreCourt] = useState(initialTitreCourt)
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState(initialTitreCourt ?? '')
  const [suggesting, setSuggesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const displayed = titreCourt || titre

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  function handleOpen(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setInput(titreCourt ?? '')
    setOpen(true)
  }

  async function handleSuggest(e: React.MouseEvent) {
    e.preventDefault()
    setSuggesting(true)
    try {
      const res = await fetch(`/api/gestion/projet/${id}/titre-ia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titre }),
      })
      const data = await res.json()
      if (data.suggestion) setInput(data.suggestion)
    } finally {
      setSuggesting(false)
    }
  }

  async function handleSave(e: React.MouseEvent) {
    e.preventDefault()
    if (!input.trim()) return
    setSaving(true)
    try {
      await fetch(`/api/gestion/projet/${id}/titre-ia`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titreCourt: input.trim() }),
      })
      setTitreCourt(input.trim())
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  function handleCancel(e: React.MouseEvent) {
    e.preventDefault()
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative flex items-center gap-1.5 min-w-0">
      <div className="group/tooltip relative shrink min-w-0">
        <Link
          href={href}
          className="truncate text-[15px] font-medium hover:text-primary transition-colors block"
        >
          {displayed}
        </Link>
        <div className="pointer-events-none absolute bottom-full left-0 mb-1.5 z-50 hidden group-hover/tooltip:block">
          <div className="rounded-md bg-foreground px-2.5 py-1.5 text-xs text-background shadow-md max-w-72 leading-snug">
            {titre}
          </div>
        </div>
      </div>

      <button
        onClick={handleOpen}
        title="Modifier le titre court"
        className="shrink-0 cursor-pointer text-muted-foreground/40 hover:text-foreground transition-colors"
      >
        <Pencil className="size-3" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-80 rounded-lg border border-border bg-background shadow-lg p-3 space-y-2">
          <p className="text-xs text-muted-foreground truncate" title={titre}>{titre}</p>
          <div className="flex items-center gap-1.5">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave(e as unknown as React.MouseEvent) }}
              placeholder="Titre court…"
              className="flex-1 min-w-0 text-sm border border-border rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary bg-background"
            />
            <button
              onClick={handleSuggest}
              disabled={suggesting}
              title="Suggestion IA"
              className="shrink-0 cursor-pointer text-violet-400 hover:text-violet-600 transition-colors disabled:opacity-50"
            >
              {suggesting ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
            </button>
          </div>
          <div className="flex justify-end gap-1.5">
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-border hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="size-3" /> Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !input.trim()}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
              Valider
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
