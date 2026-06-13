// Test co-auteurs via HAL — facet labStructId sur publications Alzheimer d'un labo
// Usage : node scripts/test-coauteurs-hal.mjs

const DELAY = 300
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }
async function get(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// Quelques labos HAL connus (issus de nos tests précédents)
const LABOS = [
  { id: '476572',  nom: 'BPH (Bordeaux Population Health)' },
  { id: '1049721', nom: 'LilNCog (Lille Neurosciences & Cognition)' },
  { id: '454310',  nom: 'Centre Inria de Paris' },
  { id: '34586',   nom: 'JPArc (Rouen Neurosciences)' },
]

console.log('\n── Test co-auteurs HAL — facet labStructId ──\n')

for (const labo of LABOS) {
  console.log(`\n[${labo.nom}]`)

  // Publications Alzheimer de ce labo + facet sur les co-labos
  const url =
    'https://api.archives-ouvertes.fr/search/' +
    `?q=alzheimer&fq=labStructId_i:${labo.id}` +
    '&rows=0&facet=true' +
    '&facet.field=labStructId_i' +
    '&facet.mincount=2' +
    '&facet.limit=10' +
    '&wt=json'

  const data  = await get(url)
  const total = data.response?.numFound ?? 0
  const vals  = data.facet_counts?.facet_fields?.labStructId_i ?? []

  console.log(`  Publications Alz totales : ${total}`)

  // Extraire les co-labos (exclure le labo lui-même)
  const colabs = []
  for (let i = 0; i < vals.length; i += 2) {
    const coId    = String(vals[i])
    const coCount = Number(vals[i + 1])
    if (coId !== labo.id) colabs.push({ id: coId, count: coCount })
  }

  if (colabs.length === 0) {
    console.log('  Aucun co-labo trouvé')
    await sleep(DELAY)
    continue
  }

  // Récupérer les noms des co-labos
  await sleep(DELAY)
  const ids      = colabs.map(c => c.id).join(' OR ')
  const struct   = await get(
    `https://api.archives-ouvertes.fr/ref/structure/?q=docid:(${ids})` +
    '&fl=docid,name_s,acronym_s&rows=10&wt=json'
  )
  const structs  = struct.response?.docs ?? []

  console.log(`  Top co-labos (publications communes sur Alzheimer) :`)
  for (const colab of colabs.slice(0, 8)) {
    const s    = structs.find(s => String(s.docid) === colab.id)
    const name = s ? (s.acronym_s ?? s.name_s ?? '?') : `ID:${colab.id}`
    console.log(`    ${String(colab.count).padStart(3)} pub. communes  →  ${name}`)
  }

  await sleep(DELAY)
}

console.log()
process.exit(0)
