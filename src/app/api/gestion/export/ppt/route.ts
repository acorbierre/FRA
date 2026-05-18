import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getProjetById } from '@/services/neon'
import PptxGenJS from 'pptxgenjs'

const PRIMARY   = '8231a8'
const LIGHT_BG  = 'f5f0f7'
const DARK_TEXT = '0a0a0a'
const MUTED     = '71717a'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { ids } = await req.json() as { ids: string[] }
  if (!ids?.length) return NextResponse.json({ error: 'Aucun projet sélectionné' }, { status: 400 })

  const projets = await Promise.all(ids.map(id => getProjetById(id).catch(() => null)))
  const valid = projets.filter(Boolean)

  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_WIDE'
  pptx.author  = 'FRA — Fondation Recherche Alzheimer'

  // --- Slide de couverture ---
  const cover = pptx.addSlide()
  cover.background = { color: PRIMARY }
  cover.addText('Projets financés', {
    x: 0.8, y: 1.8, w: 10, h: 1,
    fontSize: 36, bold: true, color: 'FFFFFF', fontFace: 'Calibri',
  })
  cover.addText('Fondation Recherche Alzheimer', {
    x: 0.8, y: 2.9, w: 10, h: 0.5,
    fontSize: 18, color: 'E8D5F0', fontFace: 'Calibri',
  })
  cover.addText(new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }), {
    x: 0.8, y: 4.8, w: 10, h: 0.4,
    fontSize: 13, color: 'C9A8DC', fontFace: 'Calibri',
  })
  cover.addText(`${valid.length} projet${valid.length > 1 ? 's' : ''}`, {
    x: 0.8, y: 5.3, w: 10, h: 0.4,
    fontSize: 13, color: 'C9A8DC', fontFace: 'Calibri',
  })

  // --- 1 slide par projet ---
  for (const projet of valid) {
    if (!projet) continue
    const slide = pptx.addSlide()
    slide.background = { color: 'FFFFFF' }

    // Bande colorée gauche
    slide.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: 0.18, h: '100%',
      fill: { color: PRIMARY },
    })

    // Thématique
    if (projet.thematique) {
      slide.addText(projet.thematique.toUpperCase(), {
        x: 0.4, y: 0.35, w: 12, h: 0.3,
        fontSize: 9, bold: true, color: PRIMARY, fontFace: 'Calibri', charSpacing: 1.5,
      })
    }

    // Titre
    slide.addText(projet.titre, {
      x: 0.4, y: 0.65, w: 9, h: 1,
      fontSize: 22, bold: true, color: DARK_TEXT, fontFace: 'Calibri',
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
        fontSize: 11, color: MUTED, fontFace: 'Calibri',
      })
    }

    // Séparateur
    slide.addShape(pptx.ShapeType.line, {
      x: 0.4, y: 2.1, w: 12, h: 0,
      line: { color: 'E4E4E7', width: 0.75 },
    })

    // Description ou résumé
    const texte = projet.description
    if (texte) {
      slide.addText(texte, {
        x: 0.4, y: 2.25, w: 9, h: 2.8,
        fontSize: 12, color: DARK_TEXT, fontFace: 'Calibri',
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
      fontSize: 11, bold: true, color: PRIMARY, fontFace: 'Calibri',
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
        x: 0.4, y: 5.1, w: 12, h: 0.35,
        fontSize: 10, color: MUTED, fontFace: 'Calibri',
      })
    }

    // Numéro de slide
    slide.addText(String(valid.indexOf(projet) + 1), {
      x: 12.2, y: 5.1, w: 0.3, h: 0.35,
      fontSize: 9, color: MUTED, fontFace: 'Calibri', align: 'right',
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
