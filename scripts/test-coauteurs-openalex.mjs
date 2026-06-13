// Test co-auteurs via OpenAlex — authorships sur publications Alzheimer d'un labo
// Usage : node scripts/test-coauteurs-openalex.mjs

const HEADERS = { 'User-Agent': 'mailto:contact@fra-recherche.org' }
const DELAY   = 400
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }
async function get(url) {
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// Labos connus dans OpenAlex (matchés lors de l'import HAL)
const LABOS = [
  { id: 'I2800770827', nom: 'Institut du Cerveau (ICM)' },
  { id: 'I4210145201', nom: 'Institut de Neurophysiopathologie (INP Marseille)' },
  { id: 'I114457229',  nom: 'Hospices Civils de Lyon' },
  { id: 'I2800602034', nom: 'Gustave Roussy' },
]

console.log('\n── Test co-auteurs OpenAlex — authorships sur publications Alzheimer ──\n')

for (const labo of LABOS) {
  console.log(`\n[${labo.nom}]`)

  // Récupérer les publications Alzheimer récentes avec leurs authorships
  const url =
    `https://api.openalex.org/works` +
    `?filter=institutions.id:${labo.id},default.search:alzheimer` +
    `&per-page=50` +
    `&select=id,authorships,publication_year` +
    `&sort=publication_year:desc`

  const data  = await get(url)
  const works = data.results ?? []
  console.log(`  Publications Alz récupérées : ${works.length} (total: ${data.meta?.count ?? '?'})`)

  if (works.length === 0) { await sleep(DELAY); continue }

  // Agréger les institutions co-autrices
  const instCounts = new Map()
  for (const work of works) {
    const seenInWork = new Set()
    for (const authorship of work.authorships ?? []) {
      for (const inst of authorship.institutions ?? []) {
        if (!inst.id || inst.id.includes(labo.id)) continue
        if (seenInWork.has(inst.id)) continue
        seenInWork.add(inst.id)
        instCounts.set(inst.id, {
          name:  inst.display_name ?? '?',
          count: (instCounts.get(inst.id)?.count ?? 0) + 1,
        })
      }
    }
  }

  // Trier par fréquence
  const top = [...instCounts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8)

  if (top.length === 0) {
    console.log('  Aucune institution co-autrice trouvée')
  } else {
    console.log('  Top institutions co-autrices (sur publications Alzheimer) :')
    for (const [id, { name, count }] of top) {
      const shortId = id.split('/').pop()
      console.log(`    ${String(count).padStart(3)} pub. communes  →  ${name.slice(0, 55)} [${shortId}]`)
    }
  }

  await sleep(DELAY)
}

console.log()
process.exit(0)
