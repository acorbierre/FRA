// Dry run — combien de labos français éligibles via HAL + geocodage ?
// Usage : node scripts/count-hal-labos.mjs

const DELAY = 200
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }
async function get(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// ── 1. Récupérer TOUS les labos avec pub. Alz (facet.limit élevé) ──
console.log('\n── Étape 1 : tous les labos français avec publications Alzheimer ──')

const facetData = await get(
  'https://api.archives-ouvertes.fr/search/' +
  '?q=alzheimer&fq=labStructCountry_s:fr' +
  '&rows=0&facet=true&facet.field=labStructId_i' +
  '&facet.mincount=10&facet.limit=500&wt=json'
)
const facetValues = facetData.facet_counts?.facet_fields?.labStructId_i ?? []
const labCounts = []
for (let i = 0; i < facetValues.length; i += 2) {
  if (facetValues[i] && facetValues[i+1] > 0) labCounts.push({ id: facetValues[i], count: facetValues[i+1] })
}
console.log(`Total UMR avec ≥1 pub. Alz : ${labCounts.length}`)

await sleep(DELAY)

// ── 2. Récupérer les détails en batches de 50 ──
console.log('\n── Étape 2 : récupération des adresses (batches de 50) ──')

const allStructs = []
const BATCH = 50

for (let i = 0; i < labCounts.length; i += BATCH) {
  const batch = labCounts.slice(i, i + BATCH)
  const ids = batch.map(l => l.id).join(' OR ')
  const data = await get(
    'https://api.archives-ouvertes.fr/ref/structure/' +
    `?q=docid:(${ids})` +
    '&fl=docid,name_s,acronym_s,address_s,city_s,latitude_d,longitude_d' +
    `&rows=${BATCH}&wt=json`
  )
  const docs = data.response?.docs ?? []
  for (const d of docs) {
    const labCount = labCounts.find(l => l.id == d.docid)?.count ?? 0
    allStructs.push({ ...d, alz_count: labCount })
  }
  process.stdout.write(`\r  ${Math.min(i + BATCH, labCounts.length)}/${labCounts.length} récupérés...`)
  await sleep(DELAY)
}

console.log()

const withAddress = allStructs.filter(s => s.address_s)
const withGeoAlready = allStructs.filter(s => s.latitude_d && s.longitude_d)
console.log(`\nStructures récupérées : ${allStructs.length}`)
console.log(`Avec adresse          : ${withAddress.length}`)
console.log(`Avec geo directe      : ${withGeoAlready.length}`)

await sleep(DELAY)

// ── 3. Tester le geocodage sur un échantillon de 10 adresses ──
console.log('\n── Étape 3 : test geocodage sur échantillon (10 adresses) ──')

const sample = withAddress.filter(s => !(s.latitude_d && s.longitude_d)).slice(0, 10)
let geocoded = 0

for (const s of sample) {
  await sleep(150)
  try {
    const q = encodeURIComponent(s.address_s)
    const r = await get(`https://api-adresse.data.gouv.fr/search/?q=${q}&limit=1`)
    const coords = r.features?.[0]?.geometry?.coordinates
    const city   = r.features?.[0]?.properties?.city ?? '?'
    if (coords) {
      geocoded++
      console.log(`  ✓ ${(s.acronym_s ?? s.name_s ?? '?').slice(0, 30).padEnd(30)} → ${city} (${coords[1].toFixed(2)}, ${coords[0].toFixed(2)})`)
    } else {
      console.log(`  ✗ ${(s.acronym_s ?? s.name_s ?? '?').slice(0, 30)} → pas de résultat`)
    }
  } catch {
    console.log(`  ✗ erreur geocodage`)
  }
}

const geocodeRate = sample.length ? Math.round(geocoded / sample.length * 100) : 0
const estimated = Math.round(withAddress.length * geocodeRate / 100) + withGeoAlready.length

console.log(`\nTaux geocodage estimé : ${geocodeRate}% (${geocoded}/${sample.length})`)
console.log(`\n── Estimation finale ──`)
console.log(`Labos éligibles estimés : ~${estimated}`)
console.log(`  dont geo directe HAL  : ${withGeoAlready.length}`)
console.log(`  dont géocodés adresse : ~${Math.round(withAddress.length * geocodeRate / 100)}`)
console.log()

process.exit(0)
