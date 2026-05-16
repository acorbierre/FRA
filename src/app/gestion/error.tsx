'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export default function GestionError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error('[Gestion]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center">
      <div className="size-12 rounded-full bg-red-50 flex items-center justify-center">
        <AlertTriangle className="size-5 text-red-500" />
      </div>
      <div className="space-y-1">
        <p className="font-medium text-foreground">Une erreur est survenue</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          {error.message ?? 'Erreur inattendue. Consultez la console pour plus de détails.'}
        </p>
      </div>
      <button
        onClick={reset}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm font-medium transition-colors cursor-pointer"
      >
        <RotateCcw className="size-3.5" />
        Réessayer
      </button>
    </div>
  )
}
