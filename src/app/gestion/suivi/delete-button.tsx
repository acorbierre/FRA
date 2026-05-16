'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

interface Props { id: string; endpoint: string }

export default function DeleteButton({ id, endpoint }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirm, setConfirm] = useState(false)

  function handleClick() {
    if (!confirm) { setConfirm(true); return }
    fetch(`/api/gestion/${endpoint}/${id}`, { method: 'DELETE' }).then(() => {
      startTransition(() => router.refresh())
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      title={confirm ? 'Cliquer pour confirmer' : 'Supprimer'}
      className={`flex items-center justify-center size-7 rounded-md transition-colors disabled:opacity-50 ${
        confirm
          ? 'bg-red-50 text-destructive'
          : 'text-muted-foreground hover:text-destructive hover:bg-red-50'
      }`}
    >
      <Trash2 className="size-3.5" />
    </button>
  )
}
