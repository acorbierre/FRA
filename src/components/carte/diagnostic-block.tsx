'use client'

import { useEffect, useRef, useState } from 'react'
import { Sparkles, TrendingUp, TrendingDown } from 'lucide-react'
import type { Lab } from '@/data/alzheimer-labs'
import { DOT_COLOR } from './map-utils'

interface Publication {
  id: string
  title: string
  year: number
  citations: number
  doi: string | null
}

interface Props {
  lab: Lab
  publications: Publication[]
}

interface Section {
  label: string
  content: string
}

const SECTION_DEFS = [
  { key: 'Points forts',   icon: TrendingUp,   color: '#16a34a' },
  { key: 'Points faibles', icon: TrendingDown,  color: '#b45309' },
  { key: 'Bilan',          icon: Sparkles,      color: DOT_COLOR },
]

// Parse sections progressivement depuis le texte streamé partiel
function parseSections(raw: string): Section[] {
  const result: Section[] = []
  const parts = raw.split(/^## /m)
  for (const part of parts) {
    const trimmed = part.trimStart()
    if (!trimmed) continue
    const nl = trimmed.indexOf('\n')
    if (nl === -1) {
      result.push({ label: trimmed.trim(), content: '' })
      continue
    }
    const label = trimmed.slice(0, nl).trim()
    const content = trimmed.slice(nl + 1)
    if (label) result.push({ label, content })
  }
  return result
}

function renderText(raw: string, accentColor: string) {
  const parts = raw.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} style={{ color: accentColor }}>{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  )
}

export function DiagnosticBlock({ lab, publications }: Props) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setText('')
    setLoading(true)

    async function run() {
      try {
        const res = await fetch('/api/carte/diagnostic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lab, publications }),
          signal: ctrl.signal,
        })
        if (!res.ok || !res.body) { setLoading(false); return }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          setText(prev => prev + decoder.decode(value, { stream: true }))
        }
        setLoading(false)
      } catch {
        if (!ctrl.signal.aborted) setLoading(false)
      }
    }

    run()
    return () => ctrl.abort()
  }, [lab.id])

  const sections = parseSections(text)

  return (
    <div
      className="rounded-xl px-5 py-4 mt-2 mb-6"
      style={{
        background: 'linear-gradient(to bottom, rgba(130,49,168,0.09), rgba(130,49,168,0.03))',
        border: '1px solid rgba(130,49,168,0.18)',
      }}
    >
      <div className="flex items-center gap-2 mb-4" style={{ color: DOT_COLOR }}>
        <Sparkles size={13} />
        <span className="text-xs font-semibold uppercase tracking-wide">Diagnostic IA · Pertinence FRA</span>
      </div>

      {loading && !text ? (
        <div className="flex flex-col gap-3">
          {[88, 72, 56].map((w, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="h-2 rounded-full animate-pulse" style={{ background: 'rgba(130,49,168,0.15)', width: '40%', animationDelay: `${i * 0.1}s` }} />
              <div className="h-2 rounded-full animate-pulse" style={{ background: 'rgba(130,49,168,0.1)', width: `${w}%`, animationDelay: `${i * 0.1 + 0.05}s` }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {SECTION_DEFS.map(({ key, icon: Icon, color }) => {
            const section = sections.find(s => s.label === key)
            if (!section) return null
            // Est-ce la dernière section en cours de stream ?
            const isLast = loading && sections[sections.length - 1]?.label === key
            return (
              <div key={key}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon size={12} style={{ color }} />
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color }}>
                    {key}
                  </span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed pl-4">
                  {renderText(section.content, color)}
                  {isLast && (
                    <span
                      className="inline-block w-1 h-3.5 ml-0.5 align-middle animate-pulse"
                      style={{ background: DOT_COLOR, borderRadius: 1 }}
                    />
                  )}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
