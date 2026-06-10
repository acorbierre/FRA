'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarCheck, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SyncCalendarButton() {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const router = useRouter()

  async function handleSync() {
    setState('loading')
    try {
      const res = await fetch('/api/calendar/sync-demo', { method: 'POST' })
      if (!res.ok) throw new Error()
      router.refresh()
      setState('done')
      setTimeout(() => setState('idle'), 4000)
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 4000)
    }
  }

  return (
    <Button onClick={handleSync} disabled={state === 'loading'}>
      {state === 'loading' ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <CalendarCheck className="size-4" />
      )}
      {state === 'done' ? 'Synchronisé !' : state === 'error' ? 'Erreur' : 'Synchroniser le calendrier'}
    </Button>
  )
}
