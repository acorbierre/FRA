// Test API HAL — publications Alzheimer groupées par unité de recherche (France)
// Usage : node scripts/test-hal.mjs

const DELAY = 300
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function get(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`)
  return res.json()
}

// ── 1. Publications "alzheimer" groupées par labo (facet labStructId) ──
console.log('\n── Étape 1 : publications Alzheimer par unité de recherche (HAL) ──')

const facetUrl =
  'https://api.archives-ouvertes.fr/search/' +
  '?q=alzheimer' +
  '&fq=labStructCountry_s:fr' +
  '&rows=0' +
  '&facet=true' +
  '&facet.field=labStructId_i' +
  '&facet.mincount=5' +
  '&facet.limit=30' +
  '&wt=json'

const facetData = await get(facetUrl)
const facetValues = facetData.facet_counts?.facet_fields?.labStructId_i ?? []

// Les facets HAL arrivent en tableau plat [id, count, id, count, ...]
const labCounts = []
for (let i = 0; i < facetValues.length; i += 2) {
  const id    = facetValues[i]
  const count = facetValues[i + 1]
  if (id && count > 0) labCounts.push({ id, count })
}

console.log(`${labCounts.length} unités de recherche trouvées (min. 5 pub. Alz)`)
console.log('Top 5 :', labCounts.slice(0, 5))

await sleep(DELAY)

// ── 2. Récupérer les détails des top labos via l'API structures HAL ──
console.log('\n── Étape 2 : détails des structures (nom, ville, geo) ──')

const topIds = labCounts.slice(0, 20).map(l => l.id)
const structUrl =
  'https://api.archives-ouvertes.fr/ref/structure/' +
  '?q=docid:(' + topIds.join(' OR ') + ')' +
  '&fl=docid,name_s,acronym_s,city_s,country_s,latitude_d,longitude_d,code_s,type_s' +
  '&rows=20' +
  '&wt=json'

const structData = await get(structUrl)
const structs = structData.response?.docs ?? []

console.log(`\n${'Acronyme'.padEnd(12)} ${'Nom'.padEnd(50)} ${'Ville'.padEnd(20)} ${'Geo'.padEnd(8)} ${'Pub.Alz'}`)
console.log('─'.repeat(100))

for (const s of structs) {
  const labCount = labCounts.find(l => l.id === s.docid)?.count ?? '?'
  const hasGeo   = !!(s.latitude_d && s.longitude_d)
  const acronym  = (s.acronym_s ?? s.code_s ?? '—').slice(0, 11).padEnd(12)
  const nom      = (s.name_s ?? '—').slice(0, 49).padEnd(50)
  const ville    = (s.city_s ?? '—').slice(0, 19).padEnd(20)
  console.log(`${acronym} ${nom} ${ville} ${hasGeo ? 'OK' : 'ABSENT'.padEnd(8)} ${labCount}`)
}

await sleep(DELAY)

// ── 3. Vérifier si nos labos cibles sont dans HAL ──
console.log('\n── Étape 3 : vérification labos FRA cibles ──')

const CIBLES = [
  'Lille Neuroscience',
  'IINS',
  'CBI Toulouse',
  'IGMM',
  'Grenoble Institut Neurosciences',
  'IM2A',
  'ICM',
]

for (const cible of CIBLES) {
  await sleep(DELAY)
  const url =
    'https://api.archives-ouvertes.fr/ref/structure/' +
    `?q=${encodeURIComponent(cible)}&fq=country_s:fr` +
    '&fl=docid,name_s,acronym_s,city_s,latitude_d,longitude_d,code_s' +
    '&rows=3&wt=json'
  const data = await get(url)
  const docs = data.response?.docs ?? []
  if (docs.length === 0) {
    console.log(`[NON TROUVE] "${cible}"`)
  } else {
    const d = docs[0]
    console.log(`[TROUVE] "${cible}" → ${d.acronym_s ?? d.code_s ?? '?'} — ${d.name_s} (${d.city_s ?? 'ville?'}) geo:${!!(d.latitude_d && d.longitude_d)}`)
  }
}

console.log()
process.exit(0)
