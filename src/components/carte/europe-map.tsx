'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import { type Lab } from '@/data/alzheimer-labs'
import { ExternalLink, BookOpen, Quote, Tag, ArrowRight, ArrowLeft, ArrowDown, TrendingUp, Target, Sparkles } from 'lucide-react'

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
function specializationRatio(lab: Lab): number | null {
  if (!lab.worksCount || !lab.alzPubCount) return null
  return lab.alzPubCount / lab.worksCount
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
  const [sortBy,          setSortBy]          = useState<'publications' | 'impact' | 'specialisation' | 'composite' | 'alpha' | 'fra'>('composite')
  const [topLabsMode,     setTopLabsMode]     = useState(false)
  const [topLabsExpanded, setTopLabsExpanded] = useState(false)
  const [closingTopLabs,  setClosingTopLabs]  = useState(false)
  const [topSort,         setTopSort]         = useState<'publications' | 'impact' | 'specialisation' | 'composite'>('impact')

  const openTopLabs = () => {
    setTopLabsMode(true)
    setTopLabsExpanded(false)   // démarre à 0px
    setPanel(labs)
    setPanelOpen(true)
    setMomentum(true)
    // Double rAF : assure que le DOM a rendu la largeur 0 avant de déclencher la transition
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setTopLabsExpanded(true)
    }))
    setTimeout(() => setMomentum(false), 900)
  }

  const fromTopLabsRef = useRef(false)
  const [ficheOrigin, setFicheOrigin] = useState<'cluster' | 'toplabs'>('cluster')

  const openFiche = (lab: Lab) => {
    fromTopLabsRef.current = topLabsMode
    setFicheOrigin(topLabsMode ? 'toplabs' : 'cluster')
    setTopLabsMode(false)
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

  const closeFiche = (backToTopLabs = false) => {
    setClosingFiche(true)
    setTimeout(() => {
      setClosingFiche(false)
      setMomentum(true)
      setSelectedLab(null)
      if (backToTopLabs) { setTopLabsMode(true); setTopLabsExpanded(true) }
      setTimeout(() => setMomentum(false), 900)
    }, 350)
  }

  const closePanel = () => {
    if (topLabsMode) {
      setClosingTopLabs(true)
      setTopLabsExpanded(false)   // déclenche width 100% → 0%
      setTimeout(() => {
        setPanel(null); setSelectedLab(null)
        setTopLabsMode(false); setClosingTopLabs(false); setPanelOpen(false)
      }, 620)
    } else {
      setPanelOpen(false)
      setClosingPanel(true)
      setTopLabsExpanded(false)
      setTimeout(() => { setPanel(null); setSelectedLab(null); setClosingPanel(false) }, 550)
    }
  }

  // Score composite — calculé au niveau composant pour être réutilisable partout
  const maxImpact = Math.max(...labs.map(l => (l.citedByCount ?? 0) / (l.worksCount || 1)))
  const maxAlzPub = Math.max(...labs.map(l => l.alzPubCount ?? 0))
  const maxSpec   = Math.max(...labs.map(l => (l.alzPubCount ?? 0) / (l.worksCount || 1)))
  const compositeScore = (l: Lab) => {
    const impact = maxImpact > 0 ? ((l.citedByCount ?? 0) / (l.worksCount || 1)) / maxImpact : 0
    const alzPub = maxAlzPub > 0 ? (l.alzPubCount ?? 0) / maxAlzPub : 0
    const spec   = maxSpec   > 0 ? ((l.alzPubCount ?? 0) / (l.worksCount || 1)) / maxSpec : 0
    return 0.40 * impact + 0.35 * alzPub + 0.25 * spec
  }

  const panelWidth = selectedLab ? '100%' : topLabsMode ? (topLabsExpanded ? '100%' : '0px') : (isMobile ? '100%' : '540px')
  const svgShift   = panelOpen && !isMobile && !topLabsMode ? 'translateX(-180px)' : 'translateX(0)'
  const MOMENTUM_EASING       = 'width 0.65s 120ms cubic-bezier(0.76, 0, 0.24, 1)'
  const TOPLABS_EASING        = 'width 0.72s cubic-bezier(0.87, 0, 0.13, 1)'
  const TOPLABS_CLOSE_EASING  = 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
  const NORMAL_EASING         = 'width 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
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

      {/* Bouton Top labos */}
      {ready && (
        <button
          onClick={openTopLabs}
          className="absolute left-4 sm:left-[5%] z-10 cursor-pointer font-heading font-semibold flex items-center gap-1.5 transition-colors hover:opacity-70"
          style={{
            top: isMobile ? 'calc(70px + 7.5rem)' : 'calc(50% + 7.5rem)',
            color: DOT_COLOR,
            fontSize: '1rem',
          }}
        >
          Top laboratoires <ArrowRight size={14} />
        </button>
      )}

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
            transition: topLabsMode ? TOPLABS_EASING : momentum ? MOMENTUM_EASING : NORMAL_EASING,
            animation: closingPanel
              ? SLIDE_OUT_EASING
              : topLabsMode
                ? 'none'
                : 'panelslide 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
          }}
        >
          {/* ── Vue top laboratoires ── */}
          {!selectedLab && topLabsMode && (() => {
            const sorted = [...labs].filter(l => {
              if (topSort === 'impact')     return (l.citedByCount ?? 0) > 0 && (l.worksCount ?? 0) > 0
              if (topSort === 'specialisation') return (l.worksCount ?? 0) > 0 && (l.alzPubCount ?? 0) > 0
              if (topSort === 'composite')  return (l.alzPubCount ?? 0) > 0 && (l.worksCount ?? 0) > 0
              return (l.alzPubCount ?? 0) > 0
            }).sort((a, b) => {
              if (topSort === 'impact')     return ((b.citedByCount ?? 0) / (b.worksCount ?? 1)) - ((a.citedByCount ?? 0) / (a.worksCount ?? 1))
              if (topSort === 'specialisation') return ((b.alzPubCount ?? 0) / (b.worksCount ?? 1)) - ((a.alzPubCount ?? 0) / (a.worksCount ?? 1))
              if (topSort === 'composite')  return compositeScore(b) - compositeScore(a)
              return (b.alzPubCount ?? 0) - (a.alzPubCount ?? 0)
            }).slice(0, 20)

            const metricLabel = (lab: Lab) => {
              if (topSort === 'impact')     return `${Math.round((lab.citedByCount ?? 0) / (lab.worksCount ?? 1)).toLocaleString('fr-FR')} cit./pub.`
              if (topSort === 'specialisation') return `${Math.round(((lab.alzPubCount ?? 0) / (lab.worksCount ?? 1)) * 100)}\u202f%`
              if (topSort === 'composite')  return `${Math.round(compositeScore(lab) * 100)}\u202f/ 100`
              return `${(lab.alzPubCount ?? 0).toLocaleString('fr-FR')} publications`
            }

            return (
              <>
                {/* Topbar — même structure que la fiche */}
                <div className="sticky top-0 bg-white border-b border-slate-200 px-8 flex items-center gap-4 z-10 flex-shrink-0" style={{ height: '56px' }}>
                  <button
                    onClick={closePanel}
                    className="text-slate-500 hover:text-slate-700 flex items-center gap-1.5 text-sm font-medium transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={15} /> Retour
                  </button>
                  <span className="text-slate-200">|</span>
                  <div className="flex-1 flex items-center justify-center gap-6">
                    <span className="font-heading text-[#62748e] text-sm">Trier par :</span>
                    {([
                      { key: 'impact',         label: "Score d'impact" },
                      { key: 'publications',   label: 'Publications Alzheimer' },
                      { key: 'specialisation', label: 'Spécialisation Alzheimer' },
                      { key: 'composite',      label: 'Pertinence FRA' },
                    ] as const).map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => setTopSort(tab.key)}
                        className="font-heading cursor-pointer flex items-center gap-1 transition-colors"
                        style={{
                          fontSize: '0.88rem',
                          fontWeight: topSort === tab.key ? 700 : 500,
                          color: topSort === tab.key ? '#0f172a' : '#64748b',
                        }}
                      >
                        {tab.label}
                        <ArrowDown size={12} style={{ opacity: topSort === tab.key ? 1 : 0.5 }} />
                      </button>
                    ))}
                  </div>
                  <button onClick={closePanel} className="text-slate-500 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 cursor-pointer">✕</button>
                </div>
                {/* Liste — même container et style que la fiche */}
                <div className="flex-1 overflow-y-auto">
                  <div className="px-8 py-8 max-w-2xl mx-auto">
                    {topSort === 'impact' && (
                      <p className="text-[#62748e] text-sm leading-relaxed mb-8">
                        Le score d'impact mesure le nombre moyen de citations reçues par publication, toutes thématiques confondues. Un score élevé signale un laboratoire dont les travaux font référence dans la communauté scientifique — un indicateur de crédibilité et d'influence particulièrement pertinent pour identifier des partenaires FRA de haut niveau.
                      </p>
                    )}
                    {topSort === 'publications' && (
                      <p className="text-[#62748e] text-sm leading-relaxed mb-8">
                        Le nombre de publications Alzheimer est extrait d'OpenAlex, base de données bibliographique ouverte qui indexe plus de 250 millions de travaux scientifiques. Il reflète le volume de contributions d'un laboratoire sur la thématique Alzheimer et maladies apparentées.
                      </p>
                    )}
                    {topSort === 'specialisation' && (
                      <p className="text-[#62748e] text-sm leading-relaxed mb-8">
                        Le taux de spécialisation correspond à la part des publications Alzheimer dans la production scientifique totale du laboratoire. Un taux élevé indique un laboratoire fortement centré sur la thématique — un critère de pertinence complémentaire au volume brut de publications.
                      </p>
                    )}
                    {topSort === 'composite' && (
                      <p className="text-[#62748e] text-sm leading-relaxed mb-8">
                        La pertinence FRA croise trois indicateurs pour identifier les laboratoires à la fois influents, actifs sur Alzheimer et centrés sur le sujet : score d'impact (40&nbsp;%), volume de publications Alzheimer (35&nbsp;%) et taux de spécialisation (25&nbsp;%). Chaque métrique est normalisée de 0 à 100 par rapport au maximum du dataset, puis pondérée pour donner un score global sur 100.
                      </p>
                    )}
                    {sorted.map((lab, idx) => (
                      <button
                        key={lab.id}
                        onClick={() => openFiche(lab)}
                        className="w-full text-left py-6 border-b border-slate-100 cursor-pointer"
                        style={{ animation: `fichefade 0.4s cubic-bezier(0.25,0.46,0.45,0.94) ${idx * 30}ms both` }}
                      >
                        <div className="flex items-start gap-3 mb-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-2" style={{ background: lab.type === 'fra' ? DOT_COLOR : LIGHT_COLOR }} />
                          <div>
                            <h2 className="text-2xl font-bold font-heading text-slate-900 leading-tight">{lab.name}</h2>
                            <p className="flex items-center gap-2 text-2xl font-bold font-heading leading-tight" style={{ color: '#7F8997' }}>
                              {topSort === 'impact'         && <TrendingUp size={20} strokeWidth={2.5} />}
                              {topSort === 'specialisation' && <Target size={20} strokeWidth={2.5} />}
                              {topSort === 'composite'      && <Sparkles size={20} strokeWidth={2.5} />}
                              {topSort === 'publications'   && <BookOpen size={20} strokeWidth={2.5} />}
                              {metricLabel(lab)}
                            </p>
                            <p className="text-slate-500 text-sm mt-1">{lab.city}</p>
                          </div>
                        </div>
                        {lab.type === 'fra' && (
                          <div className="ml-5">
                            <span className="inline-flex items-center text-xs font-medium px-2 py-1 rounded-full" style={{ background: 'rgba(130,49,168,0.1)', color: DOT_COLOR }}>
                              Soutenu par la FRA
                            </span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )
          })()}

          {/* ── Vue liste (panel standard) ── */}
          {!selectedLab && !topLabsMode && (
            <>
              <div className="flex items-start justify-between px-6 py-5 border-b border-slate-200 flex-shrink-0">
                <div>
                  <p className="text-2xl font-bold font-heading text-slate-900 leading-tight">{titleCase(dominantCity(panel ?? []))}</p>
                  <p className="text-slate-500 text-sm mt-1">
                    {(panel ?? []).length} institution{(panel ?? []).length > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <label className="flex items-center gap-1.5 text-sm text-slate-500 cursor-pointer">
                    <span className="whitespace-nowrap">Trier par</span>
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value as typeof sortBy)}
                      className="text-sm text-slate-500 bg-transparent border-none focus:outline-none cursor-pointer hover:text-slate-700 transition-colors"
                    >
                      <option value="publications">Publications Alzheimer</option>
                      <option value="impact">Score d'impact</option>
                      <option value="specialisation">Spécialisation Alzheimer</option>
                      <option value="composite">Pertinence FRA</option>
                      <option value="alpha">Ordre alphabétique</option>
                      <option value="fra">Partenaires FRA</option>
                    </select>
                  </label>
                  <button onClick={closePanel} className="text-slate-500 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 flex-shrink-0 cursor-pointer">✕</button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                {[...(panel ?? [])].sort((a, b) => {
                  if (sortBy === 'alpha') return a.name.localeCompare(b.name, 'fr')
                  if (sortBy === 'fra') {
                    if (a.type === 'fra' && b.type !== 'fra') return -1
                    if (b.type === 'fra' && a.type !== 'fra') return 1
                    return (b.alzPubCount ?? 0) - (a.alzPubCount ?? 0)
                  }
                  if (sortBy === 'impact') return ((b.citedByCount ?? 0) / (b.worksCount || 1)) - ((a.citedByCount ?? 0) / (a.worksCount || 1))
                  if (sortBy === 'specialisation') return ((b.alzPubCount ?? 0) / (b.worksCount || 1)) - ((a.alzPubCount ?? 0) / (a.worksCount || 1))
                  if (sortBy === 'composite') return compositeScore(b) - compositeScore(a)
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
                      <p className="font-heading font-semibold leading-snug text-slate-700" style={{ fontSize: '1.1rem' }}>{lab.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <p className="tracking-wide font-medium" style={{ fontSize: '0.8rem', color: DOT_COLOR }}>{lab.city.toUpperCase()}</p>
                        {lab.type === 'fra' && (
                          <span className="text-xs font-medium px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(130,49,168,0.1)', color: DOT_COLOR }}>Soutenu FRA</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5" style={{ fontSize: '0.85rem', color: '#62748e' }}>
                        {lab.alzPubCount ? (
                          <span className="flex items-center gap-1">
                            <BookOpen size={12} className="flex-shrink-0" />
                            {lab.alzPubCount.toLocaleString('fr-FR')} pub.
                          </span>
                        ) : null}
                        {lab.citedByCount && lab.worksCount ? (
                          <span className="flex items-center gap-1">
                            <TrendingUp size={12} className="flex-shrink-0" />
                            {Math.round(lab.citedByCount / lab.worksCount).toLocaleString('fr-FR')} cit./pub.
                          </span>
                        ) : null}
                        {specializationRatio(lab) !== null ? (
                          <span className="flex items-center gap-1">
                            <Target size={12} className="flex-shrink-0" />
                            {Math.round((specializationRatio(lab) ?? 0) * 100)}&nbsp;%
                          </span>
                        ) : null}
                        {(lab.alzPubCount ?? 0) > 0 && (lab.worksCount ?? 0) > 0 ? (
                          <span className="flex items-center gap-1">
                            <Sparkles size={12} className="flex-shrink-0" />
                            {Math.round(compositeScore(lab) * 100)}&nbsp;/ 100
                          </span>
                        ) : null}
                      </div>
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
              <div className="sticky top-0 bg-white border-b border-slate-200 px-8 flex items-center gap-4 z-10 flex-shrink-0" style={{ height: '56px' }}>
                <button
                  onClick={() => closeFiche(fromTopLabsRef.current)}
                  className="text-slate-500 hover:text-slate-700 flex items-center gap-1.5 text-sm font-medium transition-colors cursor-pointer"
                >
                  <ArrowLeft size={15} /> Retour
                </button>
                <span className="text-slate-200">|</span>
                <span className="text-slate-500 text-sm truncate flex-1 text-center">Actualité du laboratoire</span>
                <button onClick={closePanel} className="text-slate-500 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 cursor-pointer">✕</button>
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
                    {selectedLab.citedByCount && selectedLab.worksCount ? (
                      <>
                        <p className="text-3xl font-bold font-heading text-slate-700">
                          {Math.round(selectedLab.citedByCount / selectedLab.worksCount).toLocaleString('fr-FR')}
                        </p>
                        <p className="text-[#62748e] text-xs mt-0.5">citations moy. / publication</p>
                      </>
                    ) : (
                      <>
                        <p className="text-3xl font-bold font-heading text-slate-700">—</p>
                        <p className="text-[#62748e] text-xs mt-0.5">disponible après import</p>
                      </>
                    )}
                  </div>
                  <div className="rounded-xl border border-slate-200 p-4 bg-slate-100/70">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1">
                      <BookOpen size={12} /> Spécialisation
                    </div>
                    {specializationRatio(selectedLab) !== null ? (
                      <>
                        <p className="text-3xl font-bold font-heading text-slate-700">
                          {Math.round((specializationRatio(selectedLab) ?? 0) * 100)} %
                        </p>
                        <p className="text-[#62748e] text-xs mt-0.5">des publications en Alzheimer</p>
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
                            <p className="font-heading font-semibold text-slate-700 leading-snug line-clamp-2 group-hover:underline group-hover:text-slate-900 transition-colors" style={{ fontSize: '1.1rem' }}>{pub.title}</p>
                            <p className="text-[#62748e] text-xs mt-1">{pub.year} · {pub.citations.toLocaleString('fr-FR')} citations</p>
                          </div>
                          <ExternalLink size={15} className="flex-shrink-0 mt-1.5 text-[#62748e] group-hover:text-purple-500 transition-colors" />
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
