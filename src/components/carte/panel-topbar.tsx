'use client'

import { ArrowLeft } from 'lucide-react'

interface Props {
  centerText: string
  onBack: () => void
  onClose: () => void
  children?: React.ReactNode
}

export function PanelTopbar({ centerText, onBack, onClose, children }: Props) {
  return (
    <div
      className="sticky top-0 bg-white border-b border-slate-200 px-8 flex items-center gap-4 z-10 flex-shrink-0"
      style={{ height: '56px' }}
    >
      <button
        onClick={onBack}
        className="text-slate-500 hover:text-slate-700 flex items-center gap-1.5 text-sm font-medium transition-colors cursor-pointer"
      >
        <ArrowLeft size={15} /> Retour
      </button>
      <span className="text-slate-200">|</span>
      {children ?? (
        <span className="text-slate-500 text-sm truncate flex-1 text-center">{centerText}</span>
      )}
      <button
        onClick={onClose}
        className="text-slate-500 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 cursor-pointer"
      >
        ✕
      </button>
    </div>
  )
}
