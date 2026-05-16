'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'

const COLORS: Record<string, { bg: string; text: string }> = {
  'Brouillon':      { bg: 'bg-zinc-200',   text: 'text-zinc-700' },
  'Soumise':        { bg: 'bg-blue-100',   text: 'text-blue-800' },
  'En évaluation':  { bg: 'bg-amber-100',  text: 'text-amber-800' },
  'Retenue':        { bg: 'bg-green-100',  text: 'text-green-800' },
  'Refusée':        { bg: 'bg-red-100',    text: 'text-red-800' },
  'En cours':       { bg: 'bg-green-100',  text: 'text-green-800' },
  'Suspendu':       { bg: 'bg-amber-100',  text: 'text-amber-800' },
  'Terminé':        { bg: 'bg-zinc-200',   text: 'text-zinc-700' },
  'Terminée':       { bg: 'bg-zinc-200',   text: 'text-zinc-700' },
  'Résiliée':       { bg: 'bg-red-100',    text: 'text-red-800' },
}

interface Props {
  id: string
  statut: string
  options: string[]
  endpoint: string
}

export default function StatutSelect({ id, statut, options, endpoint }: Props) {
  const router = useRouter()
  const [value, setValue] = useState(statut)
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  async function handleSelect(next: string) {
    setOpen(false)
    setValue(next)
    await fetch(`/api/gestion/${endpoint}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut: next }),
    })
    startTransition(() => router.refresh())
  }

  const colors = COLORS[value] ?? COLORS['Brouillon']

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={pending}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-opacity disabled:opacity-50 ${colors.bg} ${colors.text}`}
      >
        {value}
        <ChevronDown className="size-3 opacity-60" />
      </button>

      {open && (
        <div className="absolute z-50 left-0 top-full mt-1 w-44 rounded-lg border border-border bg-background shadow-md py-1">
          {options.map(opt => {
            const c = COLORS[opt] ?? COLORS['Brouillon']
            return (
              <button
                key={opt}
                onClick={() => handleSelect(opt)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted/60 transition-colors ${
                  opt === value ? 'font-medium' : ''
                }`}
              >
                <span className={`px-2 py-0.5 rounded-full font-medium ${c.bg} ${c.text}`}>{opt}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
