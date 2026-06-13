// Test liaison HAL → RNSR pour récupérer la geo des UMR
// Usage : node scripts/test-hal-rnsr.mjs

const DELAY = 300
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }
async function get(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`)
  return res.json()
}

// IDs HAL des top labos Alzheimer (issus du test précédent)
const HAL_IDS = [476572, 1049721, 454310, 545691, 34586]

console.log('\n── Inspection des champs disponibles dans les structures HAL ──')

// 1. Récupérer TOUS les champs d'une structure pour voir ce qui est dispo
const inspectUrl =
  'https://api.archives-ouvertes.fr/ref/structure/' +
  '?q=docid:476572' +  // BPH Bordeaux
  '&rows=1&wt=json'

const inspectData = await get(inspectUrl)
const doc = inspectData.response?.docs?.[0]

if (doc) {
  console.log('\nChamps disponibles sur BPH (Bordeaux Population Health) :')
  for (const [key, val] of Object.entries(doc)) {
    const display = Array.isArray(val) ? val.slice(0, 2).join(', ') : val
    console.log(`  ${key.padEnd(30)} ${String(display).slice(0, 80)}`)
  }
}

await sleep(DELAY)

// 2. Requêter les top 5 avec les champs potentiellement utiles pour la geo
console.log('\n── Champs geo/RNSR sur les top 5 labos Alzheimer ──')

const ids = HAL_IDS.join(' OR ')
const url =
  'https://api.archives-ouvertes.fr/ref/structure/' +
  `?q=docid:(${ids})` +
  '&fl=docid,name_s,acronym_s,code_s,city_s,country_s,address_s,postCode_s,' +
  'latitude_d,longitude_d,rnsr_s,idRef_s,isni_s,siret_s,uai_s,url_s' +
  '&rows=10&wt=json'

const data = await get(url)
const docs = data.response?.docs ?? []

console.log(`\n${'Acronyme'.padEnd(12)} ${'RNSR'.padEnd(12)} ${'Ville'.padEnd(20)} ${'Adresse'.padEnd(30)} ${'Geo'}`)
console.log('─'.repeat(90))

for (const d of docs) {
  const acronym  = (d.acronym_s ?? d.code_s ?? '—').slice(0, 11).padEnd(12)
  const rnsr     = (Array.isArray(d.rnsr_s) ? d.rnsr_s[0] : d.rnsr_s ?? '—').padEnd(12)
  const ville    = (d.city_s ?? '—').slice(0, 19).padEnd(20)
  const adresse  = (d.address_s ?? '—').slice(0, 29).padEnd(30)
  const geo      = (d.latitude_d && d.longitude_d) ? `${d.latitude_d?.toFixed(2)}, ${d.longitude_d?.toFixed(2)}` : 'ABSENT'
  console.log(`${acronym} ${rnsr} ${ville} ${adresse} ${geo}`)
}

console.log()
process.exit(0)
