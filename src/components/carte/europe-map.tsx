'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import { type Lab } from '@/data/alzheimer-labs'
import { ArrowRight } from 'lucide-react'
import {
  DOT_COLOR, LIGHT_COLOR,
  STREAM_LINES, HIGHLIGHT_MAP,
  rOuter, dominantCity, titleCase, computeClusters,
} from './map-utils'
import { TopLabsPanel } from './top-labs-panel'
import { FichePanel } from './fiche-panel'
import { CityPanel } from './city-panel'

interface Props { labs: Lab[]; initialLabId?: string | null }

type TopSort = 'publications' | 'specialisation' | 'composite'
type SortBy  = 'publications' | 'impact' | 'specialisation' | 'composite' | 'alpha' | 'fra'

// ── State machine ──────────────────────────────────────────────────────────────
// Un seul discriminant décrit l'état du panel. Impossible d'avoir selectedLab
// ET topLabsMode vrais simultanément — chaque tag est un état légal et unique.
type PanelState =
  | { tag: 'closed' }
  | { tag: 'city';            labs: Lab[]; slide?: boolean }
  | { tag: 'toplabs' }
  | { tag: 'fiche';           lab: Lab; origin: 'city' | 'toplabs'; cityLabs?: Lab[] }
  | { tag: 'closing-city';    labs: Lab[] }
  | { tag: 'closing-toplabs' }
  | { tag: 'closing-fiche';   lab: Lab; returnTo: 'city' | 'toplabs'; cityLabs?: Lab[] }
// ──────────────────────────────────────────────────────────────────────────────

const MOMENTUM_EASING  = 'width 0.65s 120ms cubic-bezier(0.76, 0, 0.24, 1)'
const TOPLABS_EASING   = 'width 0.72s cubic-bezier(0.87, 0, 0.13, 1)'
const NORMAL_EASING    = 'width 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
const SLIDE_OUT_EASING = 'panelslide-out 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards'

export default function EuropeMap({ labs, initialLabId }: Props) {
  const svgRef   = useRef<SVGSVGElement>(null)
  const worldRef = useRef<any>(null)
  const zoomRef  = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)

  const [tooltip,     setTooltip]     = useState<{ city: string; count: number; alzTotal: number; x: number; y: number } | null>(null)
  const [ready,       setReady]       = useState(false)
  const [sweeping,    setSweeping]    = useState(false)
  const [streamLines, setStreamLines] = useState<string[]>(STREAM_LINES.map(() => ''))
  const [isMobile,    setIsMobile]    = useState(false)
  const [publications, setPublications] = useState<{ id: string; title: string; year: number; citations: number; doi: string | null }[]>([])

  // Panel state machine + animation helpers
  const [panelState,      setPanelState]      = useState<PanelState>({ tag: 'closed' })
  const panelStateRef = useRef<PanelState>({ tag: 'closed' })
  const [topLabsExpanded, setTopLabsExpanded] = useState(false)
  const [momentum,        setMomentum]        = useState(false)
  const [sortBy,          setSortBy]          = useState<SortBy>('composite')
  const [topSort,         setTopSort]         = useState<TopSort>('publications')

  // Score composite — partagé entre CityPanel et TopLabsPanel
  const maxImpact = Math.max(...labs.map(l => (l.citedByCount ?? 0) / (l.worksCount || 1)))
  const maxAlzPub = Math.max(...labs.map(l => l.alzPubCount ?? 0))
  const maxSpec   = Math.max(...labs.map(l => (l.alzPubCount ?? 0) / (l.worksCount || 1)))
  const compositeScore = useCallback((l: Lab) => {
    const impact = maxImpact > 0 ? ((l.citedByCount ?? 0) / (l.worksCount || 1)) / maxImpact : 0
    const alzPub = maxAlzPub > 0 ? (l.alzPubCount ?? 0) / maxAlzPub : 0
    const spec   = maxSpec   > 0 ? ((l.alzPubCount ?? 0) / (l.worksCount || 1)) / maxSpec : 0
    return 0.40 * impact + 0.35 * alzPub + 0.25 * spec
  }, [maxImpact, maxAlzPub, maxSpec])

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
      const hasFra   = cluster.labs.some(l => l.type === 'fra')
      const alzTotal = cluster.labs.reduce((s, l) => s + (l.alzPubCount ?? 0), 0)
      const ro = rOuter(alzTotal)

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
        labG.append('circle').attr('r', 4.5).attr('fill', DOT_COLOR)
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
        .on('click', () => {
          setTooltip(null)
          history.pushState({ carto: 'city' }, '')
          setPanelState({ tag: 'city', labs: cluster.labs, slide: true })
        })
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

  const initialLabIdRef = useRef<string | null | undefined>(initialLabId)
  useEffect(() => {
    if (!ready || !initialLabIdRef.current) return
    const lab = labs.find(l => String(l.id) === String(initialLabIdRef.current))
    if (!lab) return
    history.pushState({ carto: 'fiche', labId: lab.id }, '')
    setPublications([])
    setMomentum(true)
    setTimeout(() => setMomentum(false), 900)
    setPanelState({ tag: 'fiche', lab, origin: 'city' })
    fetchPublications(lab)
  }, [ready, labs])

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

  // Sync ref + browser back button
  useEffect(() => { panelStateRef.current = panelState }, [panelState])

  useEffect(() => {
    const handle = () => {
      const ps = panelStateRef.current
      if (ps.tag === 'fiche') {
        const { lab, origin, cityLabs } = ps
        setPanelState({ tag: 'closing-fiche', lab, returnTo: origin, cityLabs })
        setTimeout(() => {
          setMomentum(true)
          setTimeout(() => setMomentum(false), 900)
          if (origin === 'toplabs') { setTopLabsExpanded(true); setPanelState({ tag: 'toplabs' }) }
          else setPanelState({ tag: 'city', labs: cityLabs ?? [] })
        }, 350)
      } else if (ps.tag === 'city') {
        setPanelState({ tag: 'closing-city', labs: ps.labs })
        setTimeout(() => setPanelState({ tag: 'closed' }), 550)
      } else if (ps.tag === 'toplabs') {
        setTopLabsExpanded(false)
        setPanelState({ tag: 'closing-toplabs' })
        setTimeout(() => setPanelState({ tag: 'closed' }), 620)
      }
    }
    window.addEventListener('popstate', handle)
    return () => window.removeEventListener('popstate', handle)
  }, [])

  const handleZoom = (factor: number) => {
    if (!svgRef.current || !zoomRef.current) return
    d3.select(svgRef.current).transition().duration(250).call(zoomRef.current.scaleBy, factor)
  }

  // ── Transitions ───────────────────────────────────────────────────────────────

  const openTopLabs = () => {
    history.pushState({ carto: 'toplabs' }, '')
    setPanelState({ tag: 'toplabs' })
    setTopLabsExpanded(false)
    setMomentum(true)
    requestAnimationFrame(() => requestAnimationFrame(() => setTopLabsExpanded(true)))
    setTimeout(() => setMomentum(false), 900)
  }

  const fetchPublications = (lab: Lab) => {
    if (lab.id.startsWith('hal_')) {
      const halId = lab.id.replace('hal_', '')
      fetch(
        `https://api.archives-ouvertes.fr/search/` +
        `?q=alzheimer&fq=labStructId_i:${halId}` +
        `&sort=submittedDate_tdate+desc&rows=10` +
        `&fl=halId_s,title_s,producedDateY_i,doiId_s&wt=json`
      )
        .then(r => r.json())
        .then(data => setPublications(
          (data.response?.docs ?? []).map((w: any) => ({
            id:        w.halId_s ?? '',
            title:     Array.isArray(w.title_s) ? w.title_s[0] : (w.title_s ?? ''),
            year:      w.producedDateY_i ?? null,
            citations: 0,
            doi:       w.doiId_s ?? null,
          }))
        ))
        .catch(() => {})
    } else {
      fetch(
        `https://api.openalex.org/works?filter=institutions.id:${lab.id},title.search:alzheimer` +
        `&sort=publication_year:desc&per-page=10&select=id,title,publication_year,cited_by_count,doi`,
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
  }

  const openFiche = (lab: Lab) => {
    history.pushState({ carto: 'fiche', labId: lab.id }, '')
    const origin: 'city' | 'toplabs' = panelState.tag === 'toplabs' ? 'toplabs' : 'city'
    const cityLabs = panelState.tag === 'city' ? panelState.labs : undefined
    setPanelState({ tag: 'fiche', lab, origin, cityLabs })
    setPublications([])
    setMomentum(true)
    setTimeout(() => setMomentum(false), 900)
    fetchPublications(lab)
  }

  const closeFiche = () => {
    if (panelState.tag !== 'fiche') return
    const { lab, origin, cityLabs } = panelState
    setPanelState({ tag: 'closing-fiche', lab, returnTo: origin, cityLabs })
    setTimeout(() => {
      setMomentum(true)
      setTimeout(() => setMomentum(false), 900)
      if (origin === 'toplabs') {
        setTopLabsExpanded(true)
        setPanelState({ tag: 'toplabs' })
      } else {
        setPanelState({ tag: 'city', labs: cityLabs ?? [] })
      }
    }, 350)
  }

  const closePanel = () => {
    const ps = panelState
    if (ps.tag === 'toplabs' || ps.tag === 'closing-toplabs') {
      setTopLabsExpanded(false)
      setPanelState({ tag: 'closing-toplabs' })
      setTimeout(() => setPanelState({ tag: 'closed' }), 620)
    } else if (ps.tag === 'city' || ps.tag === 'closing-city') {
      setPanelState({ tag: 'closing-city', labs: ps.labs })
      setTimeout(() => setPanelState({ tag: 'closed' }), 550)
    } else if (ps.tag === 'fiche' || ps.tag === 'closing-fiche') {
      const cityLabs = ps.cityLabs ?? []
      setPanelState({ tag: 'closing-city', labs: cityLabs })
      setTimeout(() => setPanelState({ tag: 'closed' }), 550)
    }
  }

  // ── Dérivés d'affichage ───────────────────────────────────────────────────────

  const panelWidth = (() => {
    if (panelState.tag === 'fiche' || panelState.tag === 'closing-fiche') return '100%'
    if (panelState.tag === 'toplabs' || panelState.tag === 'closing-toplabs') return topLabsExpanded ? '100%' : '0px'
    if (panelState.tag === 'city' || panelState.tag === 'closing-city') return isMobile ? '100%' : '540px'
    return '0px'
  })()

  const panelTransition = (() => {
    if (panelState.tag === 'toplabs' || panelState.tag === 'closing-toplabs') return TOPLABS_EASING
    if (momentum) return MOMENTUM_EASING
    return NORMAL_EASING
  })()

  const panelAnimation = (() => {
    if (panelState.tag === 'closing-city') return SLIDE_OUT_EASING
    if (panelState.tag === 'toplabs' || panelState.tag === 'closing-toplabs') return 'none'
    if (panelState.tag === 'city' && panelState.slide) return 'panelslide 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards'
    return 'none'
  })()

  const svgShift = (['city', 'fiche', 'closing-fiche'] as PanelState['tag'][]).includes(panelState.tag) && !isMobile
    ? 'translateX(-180px)' : 'translateX(0)'

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
            top: isMobile ? 'calc(70px + 7rem)' : 'calc(50% + 6rem)',
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
          <button onClick={() => handleZoom(1.4)} className="w-8 h-8 rounded-lg bg-white/80 border border-slate-200 text-slate-500 text-lg leading-none flex items-center justify-center hover:bg-white transition-colors shadow-sm cursor-pointer">+</button>
          <button onClick={() => handleZoom(1 / 1.4)} className="w-8 h-8 rounded-lg bg-white/80 border border-slate-200 text-slate-500 text-lg leading-none flex items-center justify-center hover:bg-white transition-colors shadow-sm cursor-pointer">−</button>
        </div>
      )}

      {/* Panel */}
      {panelState.tag !== 'closed' && (
        <div
          className="absolute inset-0 sm:inset-auto sm:top-0 sm:right-0 sm:h-full bg-white border-l border-slate-200 flex flex-col overflow-hidden z-20 shadow-xl"
          style={{
            width: panelWidth,
            transition: panelTransition,
            animation: panelAnimation,
          }}
        >
          {(panelState.tag === 'toplabs' || panelState.tag === 'closing-toplabs') && (
            <TopLabsPanel
              labs={labs}
              topSort={topSort}
              onSortChange={setTopSort}
              compositeScore={compositeScore}
              onLabClick={openFiche}
              onBack={closePanel}
              onClose={closePanel}
            />
          )}

          {(panelState.tag === 'city' || panelState.tag === 'closing-city') && (
            <CityPanel
              labs={panelState.labs}
              sortBy={sortBy}
              onSortChange={setSortBy}
              compositeScore={compositeScore}
              onLabClick={openFiche}
              onClose={closePanel}
            />
          )}

          {(panelState.tag === 'fiche' || panelState.tag === 'closing-fiche') && (
            <FichePanel
              lab={panelState.lab}
              publications={publications}
              closingFiche={panelState.tag === 'closing-fiche'}
              onBack={closeFiche}
              onClose={closePanel}
              onOpenLab={(labId) => {
                const target = labs.find(l => l.id === labId)
                if (target) openFiche(target)
              }}
            />
          )}
        </div>
      )}

      {/* Légende */}
      {ready && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 border border-slate-200 shadow-sm z-10">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: LIGHT_COLOR }} />
            <span className="text-slate-500 text-xs whitespace-nowrap">Cluster · taille = volume de publications Alzheimer</span>
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
