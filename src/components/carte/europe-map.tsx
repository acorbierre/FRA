'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import { type Lab } from '@/data/alzheimer-labs'
import { ExternalLink, BookOpen, Quote, Tag, ArrowRight, ArrowLeft } from 'lucide-react'

interface Props { labs: Lab[] }
interface Cluster { labs: Lab[]; cx: number; cy: number }

const DOT_COLOR   = '#8231A8'
const LIGHT_COLOR = '#C084D8'

const STREAM_LINES = [
  'Cartographie',
  'des équipes de',
  'recherche',
  'en Alzheimer',
  'et Neurosciences',
]

const HIGHLIGHT_WORDS = ['Alzheimer', 'Neurosciences']

function buildHighlightMap(lines: string[]): boolean[][] {
  return lines.map(line => {
    const map = new Array(line.length).fill(false)
    for (const word of HIGHLIGHT_WORDS) {
      const idx = line.toLowerCase().indexOf(word.toLowerCase())
      if (idx !== -1) for (let i = idx; i < idx + word.length; i++) map[i] = true
    }
    return map
  })
}

const HIGHLIGHT_MAP = buildHighlightMap(STREAM_LINES)

// Taille du dot — puissance 0.32 avec multiplicateur réduit pour garder des dots lisibles
function rOuter(alzTotal: number) {
  if (!alzTotal || alzTotal === 0) return 5
  return 3 + Math.pow(alzTotal, 0.35) * 0.6
}
function rInner(alzTotal: number) { return rOuter(alzTotal) * 0.38 }

function dominantCity(labs: Lab[]) {
  const counts: Record<string, number> = {}
  for (const l of labs) counts[l.city] = (counts[l.city] ?? 0) + 1
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''
}

function titleCase(str: string) {
  return str.toLowerCase().replace(/(?:^|\s|-)\S/g, c => c.toUpperCase())
}

function formatCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

// Seuil de spécialisation : >= 15% des publications portent sur Alzheimer
const SPECIALIST_RATIO_THRESHOLD = 0.15

function specializationRatio(lab: Lab): number | null {
  if (!lab.worksCount || !lab.alzPubCount) return null
  return lab.alzPubCount / lab.worksCount
}

function impactScore(lab: Lab): number | null {
  if (!lab.alzPubCount || !lab.citedByCount) return null
  return lab.citedByCount / lab.alzPubCount
}

function isSpecialist(lab: Lab): boolean {
  const r = specializationRatio(lab)
  return r !== null && r >= SPECIALIST_RATIO_THRESHOLD
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

  const [tooltip,      setTooltip]      = useState<{ city: string; count: number; alzTotal: number; x: number; y: number } | null>(null)
  const [ready,        setReady]        = useState(false)
  const [sweeping,     setSweeping]     = useState(false)
  const [panel,        setPanel]        = useState<Lab[] | null>(null)
  const [panelOpen,    setPanelOpen]    = useState(false) // contrôle le shift SVG indépendamment
  const [selectedLab,  setSelectedLab]  = useState<Lab | null>(null)
  const [streamLines,  setStreamLines]  = useState<string[]>(STREAM_LINES.map(() => ''))
  const [isMobile,     setIsMobile]     = useState(false)
  const [publications, setPublications] = useState<{ id: string; title: string; year: number; citations: number; doi: string | null }[]>([])

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

    const countries = topojson.feature(world, world.objects.countries)
    g.append('g').selectAll('path')
      .data((countries as any).features)
      .join('path')
      .attr('d', path as any)
      .attr('fill', '#E0E2E7')
      .attr('stroke', '#9BA3B5')
      .attr('stroke-width', 0.5)
      .on('mouseover', function() { d3.select(this).transition().duration(150).attr('fill', '#D0D4DE') })
      .on('mouseout',  function() { d3.select(this).transition().duration(300).attr('fill', '#E0E2E7') })

    const clusters = computeClusters(labs, projection)

    clusters.forEach((cluster, idx) => {
      const { cx, cy } = cluster
      const hasFra = cluster.labs.some(l => l.type === 'fra')
      const alzTotal = cluster.labs.reduce((s, l) => s + (l.alzPubCount ?? 0), 0)
      const ro = rOuter(alzTotal)
      const ri = rInner(alzTotal)

      const labG = g.append('g')
        .attr('transform', `translate(${cx},${cy}) scale(0)`)
        .style('cursor', 'pointer')

      labG.transition()
        .duration(550)
        .delay(800 + idx * 45)
        .ease(d3.easeBackOut.overshoot(1.4))
        .attr('transform', `translate(${cx},${cy}) scale(1)`)

      const halo = labG.append('circle')
        .attr('r', ro)
        .attr('fill', 'rgb(130,49,168)')
        .attr('fill-opacity', 0.15)

      if (hasFra) {
        labG.append('circle')
          .attr('r', 6)
          .attr('fill', 'none')
          .attr('stroke', LIGHT_COLOR)
          .attr('stroke-width', 0.8)
          .attr('class', 'fra-pulse')
        labG.append('circle').attr('r', 6).attr('fill', DOT_COLOR)
      }

      labG.append('circle').attr('r', ro + 4).attr('fill', 'transparent')
        .on('mouseenter', (e: MouseEvent) => {
          halo.transition().duration(150).attr('r', ro * 1.35).attr('fill-opacity', 0.28)
          const rect = svgRef.current!.parentElement!.getBoundingClientRect()
          setTooltip({ city: dominantCity(cluster.labs), count: cluster.labs.length, alzTotal, x: e.clientX - rect.left, y: e.clientY - rect.top })
        })
        .on('mousemove', (e: MouseEvent) => {
          const rect = svgRef.current!.parentElement!.getBoundingClientRect()
          setTooltip(t => t ? { ...t, x: e.clientX - rect.left, y: e.clientY - rect.top } : null)
        })
        .on('mouseleave', () => {
          halo.transition().duration(200).attr('r', ro).attr('fill-opacity', 0.15)
          setTooltip(null)
        })
        .on('click', () => { setTooltip(null); setPanel(cluster.labs); setPanelOpen(true); setSelectedLab(null) })
    })

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 8])
      .on('zoom', event => g.attr('transform', event.transform))
    zoomRef.current = zoom

    const initialTransform = d3.zoomIdentity.translate(width / 2, height / 2).scale(0.18).translate(-width / 2, -height / 2)
    const targetTransform  = d3.zoomIdentity.translate(width / 2, height / 2).scale(1.8).translate(-width / 2, -height / 2)

    svg.call(zoom)
    svg.call(zoom.transform, initialTransform)
    setTimeout(() => {
      svg.transition().duration(2000).ease(d3.easeCubicOut).call(zoom.transform, targetTransform)
    }, 150)
  }, [labs])

  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(r => r.json())
      .then((world: any) => {
        worldRef.current = world
        draw(world)
        setReady(true)
        setTimeout(() => setSweeping(true), 100)
      })

    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    const onResize = () => { checkMobile(); if (worldRef.current) draw(worldRef.current) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [draw])

  useEffect(() => {
    if (!ready) return
    const delay = setTimeout(() => {
      let li = 0, ci = 0
      const iv = setInterval(() => {
        if (li >= STREAM_LINES.length) { clearInterval(iv); return }
        const snapLi = li, snapCi = ci
        setStreamLines(prev => {
          const next = [...prev]
          next[snapLi] = STREAM_LINES[snapLi].slice(0, snapCi + 1)
          return next
        })
        ci++
        if (ci >= STREAM_LINES[li].length) {
          li++; ci = 0
          if (li >= STREAM_LINES.length) clearInterval(iv)
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

  // momentum : reste true pendant toute la durée de la transition (ouverture ET fermeture fiche)
  const [momentum,        setMomentum]        = useState(false)
  const [closingPanel,    setClosingPanel]    = useState(false)
  const [closingFiche,    setClosingFiche]    = useState(false)
  const [sortBy,          setSortBy]          = useState<'publications' | 'alpha' | 'fra'>('publications')
  const [specialistOnly,  setSpecialistOnly]  = useState(false)

  const openFiche = (lab: Lab) => {
    setPublications([])
    setMomentum(true)
    setSelectedLab(lab)
    // Fetch top 5 publications Alzheimer pour ce labo via OpenAlex
    fetch(
      `https://api.openalex.org/works?filter=institutions.id:${lab.id},title.search:alzheimer` +
      `&sort=publication_year:desc&per-page=5&select=id,title,publication_year,cited_by_count,doi`,
      { headers: { 'User-Agent': 'mailto:contact@fra-recherche.org' } }
    )
      .then(r => r.json())
      .then(data => setPublications(
        (data.results ?? []).map((w: any) => ({
          id:        w.id,
          title:     w.title ?? '',
          year:      w.publication_year ?? null,
          citations: w.cited_by_count ?? 0,
          doi:       w.doi ?? null,
        }))
      ))
      .catch(() => {})
  }

  const closeFiche = () => {
    setClosingFiche(true)
    setTimeout(() => {
      setClosingFiche(false)
      setMomentum(true)
      setSelectedLab(null)
      setTimeout(() => setMomentum(false), 900)
    }, 350)
  }

  const closePanel = () => {
    setPanelOpen(false)       // SVG revient immédiatement
    setClosingPanel(true)     // panel slide-out simultané
    setTimeout(() => { setPanel(null); setSelectedLab(null); setClosingPanel(false) }, 550)
  }

  const panelWidth = selectedLab ? '100%' : (isMobile ? '100%' : '540px')
  const svgShift   = panelOpen && !isMobile ? 'translateX(-180px)' : 'translateX(0)'
  const MOMENTUM_EASING = 'width 0.65s 120ms cubic-bezier(0.76, 0, 0.24, 1)'
  const NORMAL_EASING   = 'width 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  const SLIDE_OUT_EASING = 'panelslide-out 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards'

  return (
    <div className="relative w-full" style={{ height: '100vh' }}>
      <style>{`
        .fra-pulse {
          transform-box: fill-box;
          transform-origin: center;
          animation: fra-pulse 2.2s ease-out infinite;
        }
        @keyframes fra-pulse {
          0%   { transform: scale(1); opacity: 0.75; }
          100% { transform: scale(3.2); opacity: 0; }
        }
        @keyframes panelslide {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        @keyframes panelslide-out {
          from { transform: translateX(0); }
          to   { transform: translateX(100%); }
        }
        @keyframes panelitem {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fichefade {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fichefade-out {
          from { opacity: 1; transform: translateY(0); }
          to   { opacity: 0; transform: translateY(32px); }
        }
      `}</style>

      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ transform: svgShift, transition: 'transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
      />

      {/* Stream text */}
      <div className="absolute top-[70px] left-4 right-4 sm:right-auto sm:left-[5%] sm:top-1/2 sm:-translate-y-1/2 pointer-events-none z-10 select-none">
        {STREAM_LINES.map((line, i) => (
          <p key={i} className="font-heading font-bold text-slate-700/60 leading-tight"
            style={{ fontSize: isMobile ? 'clamp(0.85rem, 3.5vw, 1rem)' : 'clamp(1.4rem, 2.2vw, 2.1rem)', minHeight: '1.25em' }}>
            {streamLines[i].split('').map((char, ci) => (
              <span key={ci} style={{
                color: HIGHLIGHT_MAP[i][ci] ? DOT_COLOR : undefined,
                ...(ci === streamLines[i].length - 1
                  ? { display: 'inline', animation: 'charfade 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards' }
                  : {}),
              }}>{char === ' ' ? '\u00A0' : char}</span>
            ))}
          </p>
        ))}
      </div>

      {/* Boutons zoom */}
      {ready && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-10">
          <button onClick={() => handleZoom(1.4)} className="w-8 h-8 rounded-lg bg-white/80 border border-slate-200 text-slate-500 text-lg leading-none flex items-center justify-center hover:bg-white transition-colors shadow-sm">+</button>
          <button onClick={() => handleZoom(1 / 1.4)} className="w-8 h-8 rounded-lg bg-white/80 border border-slate-200 text-slate-500 text-lg leading-none flex items-center justify-center hover:bg-white transition-colors shadow-sm">−</button>
        </div>
      )}

      {/* Panel */}
      {(panel || closingPanel) && (
        <div
          className="absolute inset-0 sm:inset-auto sm:top-0 sm:right-0 sm:h-full bg-white border-l border-slate-200 flex flex-col overflow-hidden z-20 shadow-xl"
          style={{
            width: panelWidth,
            transition: momentum ? MOMENTUM_EASING : NORMAL_EASING,
            animation: closingPanel
              ? SLIDE_OUT_EASING
              : 'panelslide 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
          }}
        >
          {/* ── Vue liste (panel standard) ── */}
          {!selectedLab && (
            <>
              <div className="flex items-start justify-between px-6 py-5 border-b border-slate-200 flex-shrink-0">
                <div>
                  <p className="text-2xl font-bold font-heading text-slate-900 leading-tight">{titleCase(dominantCity(panel ?? []))}</p>
                  <p className="text-slate-500 text-sm mt-1">
                    {(panel ?? []).filter(l => !specialistOnly || isSpecialist(l)).length} institution{(panel ?? []).filter(l => !specialistOnly || isSpecialist(l)).length > 1 ? 's' : ''}
                    {specialistOnly && <span className="ml-1.5 text-xs font-medium px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(130,49,168,0.1)', color: DOT_COLOR }}>spécialistes uniquement</span>}
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <button
                    onClick={() => setSpecialistOnly(v => !v)}
                    title="Spécialiste = ≥ 15 % des publications portent sur Alzheimer"
                    className="text-xs font-medium px-2.5 py-1 rounded-full border transition-colors cursor-pointer whitespace-nowrap"
                    style={specialistOnly
                      ? { background: DOT_COLOR, color: 'white', borderColor: DOT_COLOR }
                      : { background: 'transparent', color: '#64748b', borderColor: '#e2e8f0' }}
                  >
                    Spécialistes
                  </button>
                  <label className="flex items-center gap-1.5 text-sm text-slate-500 cursor-pointer">
                    <span className="whitespace-nowrap">Trier par</span>
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value as typeof sortBy)}
                      className="text-sm text-slate-500 bg-transparent border-none focus:outline-none cursor-pointer hover:text-slate-700 transition-colors"
                    >
                      <option value="publications">Nombre de publications</option>
                      <option value="alpha">Ordre alphabétique</option>
                      <option value="fra">Partenaires FRA</option>
                    </select>
                  </label>
                  <button onClick={closePanel} className="text-slate-500 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 flex-shrink-0 cursor-pointer">✕</button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                {[...(panel ?? [])].filter(l => !specialistOnly || isSpecialist(l)).sort((a, b) => {
                  if (sortBy === 'alpha') return a.name.localeCompare(b.name, 'fr')
                  if (sortBy === 'fra') {
                    if (a.type === 'fra' && b.type !== 'fra') return -1
                    if (b.type === 'fra' && a.type !== 'fra') return 1
                    return (b.alzPubCount ?? 0) - (a.alzPubCount ?? 0)
                  }
                  return (b.alzPubCount ?? 0) - (a.alzPubCount ?? 0)
                }).map((lab, idx) => (
                  <div
                    key={lab.id}
                    className="group px-6 py-4 flex items-start gap-3 cursor-pointer hover:bg-purple-50 transition-colors"
                    style={{
                      ...(lab.type === 'fra' ? { background: 'rgba(130,49,168,0.07)' } : {}),
                      animation: 'panelitem 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
                      animationDelay: `${idx * 60}ms`,
                      opacity: 0,
                    }}
                    onClick={() => openFiche(lab)}
                  >
                    <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: lab.type === 'fra' ? DOT_COLOR : LIGHT_COLOR }} />
                    <div className="min-w-0 flex-1">
                      <p className="font-heading font-medium leading-snug text-slate-700" style={{ fontSize: '1.05rem' }}>{lab.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <p className="tracking-wide font-medium" style={{ fontSize: '0.8rem', color: DOT_COLOR }}>{lab.city.toUpperCase()}</p>
                        {lab.type === 'fra' && (
                          <span className="text-xs font-medium px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(130,49,168,0.1)', color: DOT_COLOR }}>Soutenu FRA</span>
                        )}
                        {isSpecialist(lab) && (
                          <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Spécialiste</span>
                        )}
                      </div>
                      {lab.alzPubCount ? (
                        <p className="flex items-center gap-1.5 mt-1.5 text-slate-700" style={{ fontSize: '0.85rem' }}>
                          <BookOpen size={13} className="flex-shrink-0 text-slate-700" />
                          {lab.alzPubCount.toLocaleString('fr-FR')}
                          <span className="font-normal text-slate-700">publications Alzheimer</span>
                        </p>
                      ) : null}
                    </div>
                    <ArrowRight
                      size={20}
                      className="flex-shrink-0 self-center opacity-0 group-hover:opacity-100 translate-x-0 group-hover:translate-x-1.5 transition-all duration-200"
                      style={{ color: DOT_COLOR }}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Vue fiche labo (pleine largeur) ── */}
          {selectedLab && (
            <div className="flex-1 overflow-y-auto" style={{ animation: 'fichefade 0.35s ease forwards' }}>
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-slate-200 px-8 py-4 flex items-center gap-4 z-10">
                <button
                  onClick={closeFiche}
                  className="text-slate-500 hover:text-slate-700 flex items-center gap-1.5 text-sm font-medium transition-colors cursor-pointer"
                >
                  <ArrowLeft size={15} /> Retour
                </button>
                <span className="text-slate-200">|</span>
                <span className="text-slate-500 text-sm truncate">{dominantCity(panel ?? [])}</span>
                <button onClick={closePanel} className="ml-auto text-slate-500 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 cursor-pointer">✕</button>
              </div>

              {/* Corps */}
              <div className="px-8 py-8 max-w-2xl mx-auto">
                {/* Nom + badge */}
                <div className="flex items-start gap-3 mb-2" style={{ animation: closingFiche ? 'fichefade-out 0.25s 240ms ease forwards' : 'fichefade 0.55s 350ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards', opacity: closingFiche ? 1 : 0 }}>
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-2" style={{ background: selectedLab.type === 'fra' ? DOT_COLOR : LIGHT_COLOR }} />
                  <div>
                    <h1 className="text-2xl font-bold font-heading text-slate-900 leading-tight">{selectedLab.name}</h1>
                    <p className="text-slate-500 text-sm mt-1">{selectedLab.city} · {selectedLab.country}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 ml-5 mb-6" style={{ animation: closingFiche ? 'fichefade-out 0.25s 180ms ease forwards' : 'fichefade 0.55s 430ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards', opacity: closingFiche ? 1 : 0 }}>
                  {selectedLab.type === 'fra' && (
                    <span className="inline-flex items-center text-xs font-medium px-2 py-1 rounded-full" style={{ background: 'rgba(130,49,168,0.1)', color: DOT_COLOR }}>
                      Soutenu par la FRA
                    </span>
                  )}
                  {isSpecialist(selectedLab) && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200" title={`${Math.round((specializationRatio(selectedLab) ?? 0) * 100)} % des publications portent sur Alzheimer`}>
                      ★ Spécialiste Alzheimer
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mt-6 mb-6" style={{ animation: closingFiche ? 'fichefade-out 0.25s 120ms ease forwards' : 'fichefade 0.55s 520ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards', opacity: closingFiche ? 1 : 0 }}>
                  <div className="rounded-xl border border-slate-200 p-4 bg-slate-100/70">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1">
                      <BookOpen size={12} /> Publications Alzheimer
                    </div>
                    <p className="text-3xl font-bold font-heading" style={{ color: DOT_COLOR }}>
                      {selectedLab.alzPubCount ? selectedLab.alzPubCount.toLocaleString('fr-FR') : '—'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-4 bg-slate-100/70">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1">
                      <Quote size={12} /> Citations (toutes thématiques)
                    </div>
                    <p className="text-3xl font-bold font-heading text-slate-700">
                      {selectedLab.citedByCount ? formatCount(selectedLab.citedByCount) : '—'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-4 bg-slate-100/70">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1">
                      <Quote size={12} /> Score d'impact
                    </div>
                    <p className="text-3xl font-bold font-heading text-slate-700">
                      {impactScore(selectedLab) !== null ? Math.round(impactScore(selectedLab)!).toLocaleString('fr-FR') : '—'}
                    </p>
                    <p className="text-slate-400 text-xs mt-0.5">citations / pub. Alzheimer</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-4 bg-slate-100/70">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1">
                      <BookOpen size={12} /> Spécialisation
                    </div>
                    {specializationRatio(selectedLab) !== null ? (
                      <>
                        <p className="text-3xl font-bold font-heading" style={{ color: isSpecialist(selectedLab) ? '#b45309' : 'rgb(100 116 139)' }}>
                          {Math.round((specializationRatio(selectedLab) ?? 0) * 100)} %
                        </p>
                        <p className="text-slate-400 text-xs mt-0.5">des publications en Alzheimer</p>
                      </>
                    ) : (
                      <p className="text-3xl font-bold font-heading text-slate-700">—</p>
                    )}
                  </div>
                </div>

                {/* Publications récentes */}
                {publications.length > 0 && (
                  <div className="mb-12" style={{ animation: closingFiche ? 'fichefade-out 0.25s 60ms ease forwards' : 'fichefade 0.55s 620ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards', opacity: closingFiche ? 1 : 0 }}>
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wide mb-4">
                      <BookOpen size={12} /> 5 publications récentes
                    </div>
                    <div className="flex flex-col gap-4">
                      {publications.map((pub, i) => (
                        <a
                          key={i}
                          href={pub.doi ? `https://doi.org/${pub.doi.replace('https://doi.org/', '')}` : `https://openalex.org/${pub.id.split('/').pop()}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-start gap-3"
                        >
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2" style={{ background: DOT_COLOR, opacity: 0.5 }} />
                          <div className="min-w-0 flex-1">
                            <p className="font-heading font-medium text-slate-700 leading-snug line-clamp-2 group-hover:underline group-hover:text-slate-900 transition-colors" style={{ fontSize: '1.05rem' }}>{pub.title}</p>
                            <p className="text-slate-400 text-xs mt-1">{pub.year} · {pub.citations.toLocaleString('fr-FR')} citations</p>
                          </div>
                          <ExternalLink size={15} className="flex-shrink-0 mt-1.5 text-slate-400 group-hover:text-purple-500 transition-colors" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Domaines de recherche */}
                {selectedLab.topics && selectedLab.topics.length > 0 && (
                  <div className="mb-12" style={{ animation: closingFiche ? 'fichefade-out 0.25s 30ms ease forwards' : 'fichefade 0.55s 720ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards', opacity: closingFiche ? 1 : 0 }}>
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wide mb-4">
                      <Tag size={12} /> Domaines de recherche
                    </div>
                    <div className="flex flex-col gap-2">
                      {selectedLab.topics.map((t, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: DOT_COLOR, opacity: 1 - i * 0.15 }} />
                          <span className="text-slate-700 text-sm">{t.name}</span>
                          {t.field && <span className="text-slate-500 text-xs">· {t.field}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Liens */}
                <div className="flex flex-wrap gap-3" style={{ animation: closingFiche ? 'fichefade-out 0.25s 0ms ease forwards' : 'fichefade 0.55s 820ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards', opacity: closingFiche ? 1 : 0 }}>
                  {selectedLab.url && (
                    <a
                      href={selectedLab.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:border-purple-300 hover:text-purple-700 transition-colors"
                    >
                      Site web <ExternalLink size={12} />
                    </a>
                  )}
                  {selectedLab.neonId && (
                    <a
                      href={`/gestion/laboratoires/${selectedLab.neonId}`}
                      className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg text-white transition-colors"
                      style={{ background: DOT_COLOR }}
                    >
                      Fiche labo FRA →
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Légende */}
      {ready && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 border border-slate-200 shadow-sm z-10">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: LIGHT_COLOR }} />
            <span className="text-slate-500 text-xs whitespace-nowrap">Cluster · taille ∝ publications</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: DOT_COLOR }} />
            <span className="text-slate-500 text-xs whitespace-nowrap">Présence FRA</span>
          </div>
        </div>
      )}

      {/* Overlay chargement */}
      {!sweeping && (
        <div className="fixed inset-0 bg-white z-[100] pointer-events-none flex items-center justify-center">
          {!ready && (
            <div className="relative w-4 h-4">
              <div className="absolute -inset-3 rounded-full bg-slate-300 animate-ping opacity-50" />
              <div className="relative w-4 h-4 rounded-full bg-slate-300" />
            </div>
          )}
        </div>
      )}
      {sweeping && (
        <div className="fixed inset-0 bg-white z-[100] pointer-events-none" style={{ animation: 'sweepup 1s cubic-bezier(0.76, 0, 0.24, 1) 0.2s forwards' }} />
      )}

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none z-50 bg-white border border-slate-200 rounded-xl shadow-lg p-3 w-56"
          style={{ left: Math.min(tooltip.x + 16, (svgRef.current?.clientWidth ?? 800) - 240), top: tooltip.y - 80 }}
        >
          <p className="text-lg font-bold font-heading text-slate-900 leading-tight">{titleCase(tooltip.city)}</p>
          <p className="text-slate-500 text-sm mt-1">{tooltip.count} institution{tooltip.count > 1 ? 's' : ''}</p>
          {tooltip.alzTotal > 0 && (
            <p className="text-slate-600 text-sm mt-0.5">{tooltip.alzTotal.toLocaleString('fr-FR')} pub. Alzheimer</p>
          )}
        </div>
      )}
    </div>
  )
}
