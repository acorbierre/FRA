'use client'

import { useState } from 'react'

const COLORS = [
  'oklch(0.82 0.08 303)',
  'oklch(0.82 0.08 260)',
  'oklch(0.83 0.07 200)',
  'oklch(0.83 0.08 155)',
  'oklch(0.88 0.07 90)',
  'oklch(0.85 0.08 50)',
  'oklch(0.83 0.07 20)',
  'oklch(0.83 0.07 330)',
]

interface Segment { label: string; value: number }

interface Props { data: Segment[] }

function polarToCart(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180)
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function segmentPath(cx: number, cy: number, outerR: number, innerR: number, start: number, end: number) {
  const gap = 0.001
  const s = start + gap, e = end - gap
  const largeArc = e - s > 180 ? 1 : 0
  const os = polarToCart(cx, cy, outerR, s)
  const oe = polarToCart(cx, cy, outerR, e)
  const is = polarToCart(cx, cy, innerR, s)
  const ie = polarToCart(cx, cy, innerR, e)
  return [
    `M ${os.x} ${os.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${oe.x} ${oe.y}`,
    `L ${ie.x} ${ie.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${is.x} ${is.y}`,
    'Z',
  ].join(' ')
}

export default function DonutChart({ data }: Props) {
  const [hovered, setHovered] = useState<number | null>(null)
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return <p className="text-sm text-muted-foreground">Aucune donnée</p>

  const cx = 90, cy = 90, outerR = 72, innerR = 46
  let angle = 0
  const segments = data.map((d, i) => {
    const pct = d.value / total
    const sweep = pct * 360
    const path = segmentPath(cx, cy, outerR, innerR, angle, angle + sweep)
    angle += sweep
    return { ...d, pct, path, color: COLORS[i % COLORS.length] }
  })

  const hov = hovered !== null ? segments[hovered] : null

  return (
    <div className="flex items-center gap-8">
      <div className="relative shrink-0" style={{ width: 180, height: 180 }}>
        <svg viewBox="0 0 180 180" width={180} height={180}>
          {segments.map((seg, i) => (
            <path
              key={i}
              d={seg.path}
              fill={seg.color}
              opacity={hovered === null || hovered === i ? 1 : 0.4}
              className="cursor-pointer transition-opacity"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {hov ? (
            <>
              <span className="text-lg font-semibold leading-none">{hov.value}</span>
              <span className="text-xs text-muted-foreground mt-0.5">{Math.round(hov.pct * 100)}%</span>
            </>
          ) : (
            <>
              <span className="text-lg font-semibold leading-none">{total}</span>
              <span className="text-xs text-muted-foreground mt-0.5">total</span>
            </>
          )}
        </div>
      </div>

      <ul className="space-y-2 min-w-0">
        {segments.map((seg, i) => (
          <li
            key={i}
            className="flex items-center gap-2 text-sm cursor-default"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
            <span className={hovered === i ? 'font-medium text-foreground' : 'text-muted-foreground'}>
              {seg.label}
            </span>
            <span className="ml-auto font-medium tabular-nums">{seg.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
