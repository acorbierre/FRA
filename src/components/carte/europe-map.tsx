'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import { LAB_CONFIG, type Lab } from '@/data/alzheimer-labs'

interface Props { labs: Lab[] }
interface Cluster { labs: Lab[]; cx: number; cy: number }

const DOT_COLOR   = '#8231A8'
const LIGHT_COLOR = '#C084D8'

const STREAM_LINES = [
  'Cartographie',
  'des équipes de',
  'recherche en',
  'Neurosciences',
  '& Alzheimer',
]
const HALO_COLOR  = 'rgba(130,49,168,0.25)'

function rOuter(count: number) { return 6 + Math.pow(count, 0.6) * 2.8 }
function rInner(count: number) { return rOuter(count) * 0.38 }

function titleCase(str: string) {
  return str.toLowerCase().replace(/(?:^|\s|-)\S/g, c => c.toUpperCase())
}

function computeClusters(labs: Lab[], projection: d3.GeoProjection, threshold = 15): Cluster[] {
  const points = labs
    .map(lab => {
      const c = projection([lab.lon, lab.lat])
      return c ? { lab, x: c[0], y: c[1] } : null
    })
    .filter(Boolean) as { lab: Lab; x: number; y: number }[]

  const assigned = new Set<number>()
  const clusters: Cluster[] = []

  for (let i = 0; i < points.length; i++) {
    if (assigned.has(i)) continue
    const group = [i]
    assigned.add(i)
    for (let j = i + 1; j < points.length; j++) {
      if (assigned.has(j)) continue
      const dx = points[i].x - points[j].x
      const dy = points[i].y - points[j].y
      if (Math.sqrt(dx * dx + dy * dy) < threshold) { group.push(j); assigned.add(j) }
    }
    const cx = group.reduce((s, k) => s + points[k].x, 0) / group.length
    const cy = group.reduce((s, k) => s + points[k].y, 0) / group.length
    clusters.push({ labs: group.map(k => points[k].lab), cx, cy })
  }
  return clusters
}

export default function EuropeMap({ labs }: Props) {
  const svgRef   = useRef<SVGSVGElement>(null)
  const worldRef = useRef<any>(null)
  const zoomRef  = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)

  const [tooltip,     setTooltip]     = useState<{ city: string; count: number; fraCount: number; x: number; y: number } | null>(null)
  const [ready,       setReady]       = useState(false)
  const [panel,       setPanel]       = useState<Lab[] | null>(null)
  const [streamLines, setStreamLines] = useState<string[]>(STREAM_LINES.map(() => ''))
  const [streamDone,  setStreamDone]  = useState(false)

  const draw = useCallback((world: any) => {
    if (!svgRef.current) return

    const container = svgRef.current.parentElement!
    const width  = container.clientWidth  || window.innerWidth
    const height = container.clientHeight || window.innerHeight

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svgRef.current.setAttribute('width',  String(width))
    svgRef.current.setAttribute('height', String(height))

    const projection = d3.geoMercator()
      .center([2, 47])
      .scale(width * 0.55)
      .translate([width / 2, height / 2])

    const path = d3.geoPath().projection(projection)

    svg.append('rect').attr('width', width).attr('height', height).attr('fill', '#F3F4F6')

    const g = svg.append('g')

    // Tous les pays — même couleur, pas de distinction
    const countries = topojson.feature(world, world.objects.countries)
    g.append('g').selectAll('path')
      .data((countries as any).features)
      .join('path')
      .attr('d', path as any)
      .attr('fill', '#E0E2E7')
      .attr('stroke', '#9BA3B5')
      .attr('stroke-width', 0.5)

    // Clusters fixes — double cercle
    const clusters = computeClusters(labs, projection)

    clusters.forEach(cluster => {
      const { cx, cy } = cluster
      const count  = cluster.labs.length
      const hasFra = cluster.labs.some(l => l.type === 'fra')
      const ro     = rOuter(count)
      const ri     = rInner(count)

      const labG = g.append('g')
        .attr('transform', `translate(${cx},${cy})`)
        .style('cursor', 'pointer')

      // Halo proportionnel au cluster
      labG.append('circle').attr('r', ro).attr('fill', HALO_COLOR)

      // Petit dot fixe si présence FRA
      if (hasFra) {
        labG.append('circle').attr('r', 6).attr('fill', DOT_COLOR)
      }

      // Zone de hover (basée sur le halo)
      labG.append('circle').attr('r', ro + 4).attr('fill', 'transparent')
        .on('mouseenter', (e: MouseEvent) => {
          const rect = svgRef.current!.getBoundingClientRect()
          const fraCount = cluster.labs.filter(l => l.type === 'fra').length
          setTooltip({ city: cluster.labs[0].city, count, fraCount, x: e.clientX - rect.left, y: e.clientY - rect.top })
        })
        .on('mousemove', (e: MouseEvent) => {
          const rect = svgRef.current!.getBoundingClientRect()
          setTooltip(t => t ? { ...t, x: e.clientX - rect.left, y: e.clientY - rect.top } : null)
        })
        .on('mouseleave', () => setTooltip(null))
        .on('click', () => { setTooltip(null); setPanel(cluster.labs) })
    })

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 8])
      .on('zoom', event => g.attr('transform', event.transform))
    zoomRef.current = zoom

    // État initial très dézoomé, centré sur le SVG
    const initialTransform = d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(0.18)
      .translate(-width / 2, -height / 2)

    const targetTransform = d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(1.15)
      .translate(-width / 2, -height / 2)

    svg.call(zoom)
    svg.call(zoom.transform, initialTransform)

    // Animation d'intro vers le zoom cible
    setTimeout(() => {
      svg.transition()
        .duration(2000)
        .ease(d3.easeCubicOut)
        .call(zoom.transform, targetTransform)
    }, 150)
  }, [labs])

  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(r => r.json())
      .then((world: any) => {
        worldRef.current = world
        draw(world)
        setReady(true)
      })

    const onResize = () => { if (worldRef.current) draw(worldRef.current) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [draw])

  // Animation stream text — démarre 400ms après le chargement de la carte
  useEffect(() => {
    if (!ready) return
    const delay = setTimeout(() => {
      let li = 0, ci = 0
      const iv = setInterval(() => {
        if (li >= STREAM_LINES.length) { clearInterval(iv); setStreamDone(true); return }
        // Capture les valeurs avant tout appel asynchrone
        const snapLi = li, snapCi = ci
        setStreamLines(prev => {
          const next = [...prev]
          next[snapLi] = STREAM_LINES[snapLi].slice(0, snapCi + 1)
          return next
        })
        ci++
        if (ci >= STREAM_LINES[li].length) {
          li++; ci = 0
          if (li >= STREAM_LINES.length) { clearInterval(iv); setStreamDone(true) }
        }
      }, 32)
      return () => clearInterval(iv)
    }, 100)
    return () => clearTimeout(delay)
  }, [ready])


  const handleZoom = (factor: number) => {
    if (!svgRef.current || !zoomRef.current) return
    d3.select(svgRef.current).transition().duration(250).call(zoomRef.current.scaleBy, factor)
  }

  return (
    <div className="relative w-full" style={{ height: '100vh' }}>
      <svg ref={svgRef} className="w-full h-full" />

      {/* Bloc gauche : folded map + stream text */}
      <div className="absolute left-[5%] top-1/2 -translate-y-1/2 pointer-events-none z-10 select-none">
        {/* Stream text */}
        {STREAM_LINES.map((line, i) => (
          <p key={i} className="font-heading font-bold text-slate-700/60 leading-tight"
            style={{ fontSize: 'clamp(1.25rem, 1.9vw, 1.8rem)' }}>
            {streamLines[i].split('').map((char, ci) => (
              <span
                key={ci}
                style={ci === streamLines[i].length - 1
                  ? { display: 'inline', animation: 'charfade 0.3s ease forwards' }
                  : undefined}
              >{char === ' ' ? '\u00A0' : char}</span>
            ))}
          </p>
        ))}
      </div>

      {/* Boutons zoom */}
      {ready && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-1">
          <button onClick={() => handleZoom(1.4)} className="w-8 h-8 rounded-lg bg-white/80 border border-slate-200 text-slate-500 text-lg leading-none flex items-center justify-center hover:bg-white transition-colors shadow-sm">+</button>
          <button onClick={() => handleZoom(1 / 1.4)} className="w-8 h-8 rounded-lg bg-white/80 border border-slate-200 text-slate-500 text-lg leading-none flex items-center justify-center hover:bg-white transition-colors shadow-sm">−</button>
        </div>
      )}

      {/* Panel overlay */}
      {panel && (
        <div className="absolute top-0 right-0 h-full w-[440px] bg-white border-l border-slate-200 flex flex-col overflow-hidden z-20 shadow-xl">
          <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0">
            <div>
              <p className="text-2xl font-bold font-heading text-slate-900 leading-tight">{titleCase(panel[0].city)}</p>
              <p className="text-slate-400 text-sm mt-1">{panel.length} laboratoire{panel.length > 1 ? 's' : ''}</p>
            </div>
            <button
              onClick={() => setPanel(null)}
              className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 mt-1 flex-shrink-0"
            >✕</button>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {panel.map(lab => {
              const cfg = LAB_CONFIG[lab.type]
              return (
                <div
                  key={lab.id}
                  className={`px-6 py-4 flex items-start gap-3 ${lab.neonId ? 'cursor-pointer' : ''} ${lab.type === 'fra' ? 'hover:bg-purple-50' : 'hover:bg-slate-50'}`}
                  style={lab.type === 'fra' ? { background: 'rgba(130,49,168,0.07)' } : {}}
                  onClick={() => { if (lab.neonId) window.location.href = `/gestion/laboratoires/${lab.neonId}` }}
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: lab.type === 'fra' ? DOT_COLOR : LIGHT_COLOR }} />
                  <div className="min-w-0">
                    <p className="text-slate-700 text-sm font-medium leading-snug">{lab.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: lab.type === 'fra' ? DOT_COLOR : '#94a3b8' }}>{cfg.label}</p>
                    {lab.neonId && (
                      <p className="text-purple-600 text-xs mt-1.5">→ Voir la fiche labo</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Légende */}
      {ready && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 border border-slate-200 shadow-sm z-10">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: LIGHT_COLOR }} />
            <span className="text-slate-500 text-xs">Cluster laboratoires</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: DOT_COLOR }} />
            <span className="text-slate-500 text-xs">Présence FRA</span>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none z-50 bg-white border border-slate-200 rounded-xl shadow-lg p-3 w-56"
          style={{ left: Math.min(tooltip.x + 16, (svgRef.current?.clientWidth ?? 800) - 240), top: tooltip.y - 80 }}
        >
          <p className="text-lg font-bold font-heading text-slate-900 leading-tight">{titleCase(tooltip.city)}</p>
          <p className="text-slate-500 text-sm mt-1">{tooltip.count} laboratoire{tooltip.count > 1 ? 's' : ''}</p>
          {tooltip.fraCount > 0 && (
            <p className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: DOT_COLOR }} />
              <span className="text-slate-600 text-sm">dont {tooltip.fraCount} FRA</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
