import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getProjetById } from '@/services/neon'
import PptxGenJS from 'pptxgenjs'
import { readFileSync } from 'fs'
import { join } from 'path'

const PRIMARY   = '8231a8'
const LIGHT_BG  = 'f5f0f7'
const DARK_TEXT = '0a0a0a'
const MUTED     = '71717a'
const FONT      = 'Plus Jakarta Sans'

function getLogo(): string {
  try {
    const buf = readFileSync(join(process.cwd(), 'assets', 'logo-FRA.webp'))
    return `data:image/webp;base64,${buf.toString('base64')}`
  } catch {
    return ''
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { ids } = await req.json() as { ids: string[] }
  if (!ids?.length) return NextResponse.json({ error: 'Aucun projet sélectionné' }, { status: 400 })

  const projets = await Promise.all(ids.map(id => getProjetById(id).catch(() => null)))
  const valid = projets.filter(Boolean)

  const logoData = getLogo()

  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_WIDE'
  pptx.author  = 'FRA — Fondation Recherche Alzheimer'

  // --- Slide maître ---
  pptx.defineSlideMaster({
    title: 'FRA_MASTER',
    background: { color: 'FFFFFF' },
    objects: [
      // Bande colorée gauche
      { rect: { x: 0, y: 0, w: 0.18, h: '100%', fill: { color: PRIMARY } } },
      // Logo en bas à droite (ratio 1200×628 ≈ 1.91)
      ...(logoData ? [{ image: { x: 11.0, y: 6.55, w: 1.9, h: 0.99, data: logoData } }] : []),
      // Pied de page
      { text: {
        text: 'Fondation Recherche Alzheimer — Confidentiel',
        options: { x: 0.4, y: 6.9, w: 10, h: 0.3, fontSize: 8, color: 'C4C4C8', fontFace: FONT },
      }},
    ],
  })

  // --- Slide de couverture ---
  const cover = pptx.addSlide()
  cover.background = { color: PRIMARY }

  // Logo centré, grand (ratio 1200×628 ≈ 1.91)
  if (logoData) {
    cover.addImage({ data: logoData, x: 3.92, y: 0.7, w: 5.5, h: 2.88 })
  }
  cover.addText('Projets financés', {
    x: 0.8, y: 3.8, w: 11.7, h: 1.0,
    fontSize: 34, bold: true, color: 'FFFFFF', fontFace: FONT, align: 'center',
  })
  cover.addText(new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }), {
    x: 0.8, y: 4.9, w: 11.7, h: 0.4,
    fontSize: 13, color: 'C9A8DC', fontFace: FONT, align: 'center',
  })
  cover.addText(`${valid.length} projet${valid.length > 1 ? 's' : ''}`, {
    x: 0.8, y: 5.4, w: 11.7, h: 0.4,
    fontSize: 13, color: 'C9A8DC', fontFace: FONT, align: 'center',
  })

  // --- 1 slide par projet ---
  for (const projet of valid) {
    if (!projet) continue
    const slide = pptx.addSlide({ masterName: 'FRA_MASTER' })

    // Thématique
    if (projet.thematique) {
      slide.addText(projet.thematique.toUpperCase(), {
        x: 0.4, y: 0.35, w: 12, h: 0.3,
        fontSize: 9, bold: true, color: PRIMARY, fontFace: FONT, charSpacing: 1.5,
      })
    }

    // Titre
    slide.addText(projet.titre, {
      x: 0.4, y: 0.65, w: 9, h: 1,
      fontSize: 22, bold: true, color: DARK_TEXT, fontFace: FONT,
    })

    // Chips infos
    const chips: string[] = []
    if (projet.montantAccorde) chips.push(`${projet.montantAccorde.toLocaleString('fr-FR')} €`)
    if (projet.ville) chips.push(projet.ville)
    if (projet.anneeSelection) chips.push(`Sélection ${projet.anneeSelection}`)
    if (projet.dimensionInternationale) chips.push('Dimension internationale')

    if (chips.length) {
      slide.addText(chips.join('   ·   '), {
        x: 0.4, y: 1.65, w: 12, h: 0.35,
        fontSize: 11, color: MUTED, fontFace: FONT,
      })
    }

    // Séparateur
    slide.addShape(pptx.ShapeType.line, {
      x: 0.4, y: 2.1, w: 12, h: 0,
      line: { color: 'E4E4E7', width: 0.75 },
    })

    // Description
    if (projet.description) {
      slide.addText(projet.description, {
        x: 0.4, y: 2.25, w: 9, h: 2.8,
        fontSize: 12, color: DARK_TEXT, fontFace: FONT,
        valign: 'top', wrap: true,
      })
    }

    // Encart statut
    slide.addShape(pptx.ShapeType.rect, {
      x: 10, y: 2.25, w: 2.5, h: 0.7,
      fill: { color: LIGHT_BG }, line: { color: LIGHT_BG },
    })
    slide.addText(projet.statut, {
      x: 10, y: 2.25, w: 2.5, h: 0.7,
      fontSize: 11, bold: true, color: PRIMARY, fontFace: FONT,
      align: 'center', valign: 'middle',
    })

    // Dates
    if (projet.dateDebut || projet.dateFinPrevue) {
      const fmt = (d: string) => new Date(d).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
      const dates = [
        projet.dateDebut ? `Début : ${fmt(projet.dateDebut)}` : null,
        projet.dateFinPrevue ? `Fin prévue : ${fmt(projet.dateFinPrevue)}` : null,
      ].filter(Boolean).join('   ·   ')
      slide.addText(dates, {
        x: 0.4, y: 5.1, w: 10, h: 0.35,
        fontSize: 10, color: MUTED, fontFace: FONT,
      })
    }

    // Numéro de slide
    slide.addText(String(valid.indexOf(projet) + 1), {
      x: 12.2, y: 5.1, w: 0.3, h: 0.35,
      fontSize: 9, color: MUTED, fontFace: FONT, align: 'right',
    })
  }

  const buffer = await pptx.write({ outputType: 'nodebuffer' })
  const uint8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer as ArrayBuffer)
  return new NextResponse(uint8.buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'Content-Disposition': `attachment; filename="projets-fra-${Date.now()}.pptx"`,
    },
  })
}
