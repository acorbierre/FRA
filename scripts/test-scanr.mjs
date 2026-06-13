// Test API ScanR — structures de recherche françaises avec geo + publications
// Usage : node scripts/test-scanr.mjs

const DELAY = 300
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }
async function get(url, opts = {}) {
  const res = await fetch(url, opts)
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`)
  return res.json()
}

// ── 1. Inspecter l'API ScanR ──
console.log('\n── Étape 1 : recherche structures "alzheimer" dans ScanR ──')

// ScanR v2 API — recherche de structures
const searchBody = {
  query: 'alzheimer',
  filters: { status: { type: 'MultiValueSearchFilter', values: ['active'] } },
  fields: ['id', 'label', 'address', 'kind', 'nature', 'publications'],
  size: 10,
  from: 0,
}

let data
try {
  const res = await fetch('https://api.scanr.fr/v2/structure/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(searchBody),
  })
  data = await res.json()
  console.log('Status:', res.status)
} catch (err) {
  console.log('Erreur v2 POST :', err.message)
  data = null
}

if (data?.results?.length) {
  const first = data.results[0]
  console.log('\nChamps dispo sur premier résultat :')
  console.log(JSON.stringify(first, null, 2).slice(0, 1000))
} else {
  console.log('Pas de résultat v2 POST, on essaie GET v1...')
  await sleep(DELAY)

  // Fallback v1
  try {
    const r = await get(
      'https://api.scanr.fr/api/v1/structures/search' +
      '?query=alzheimer&status=active&size=5&page=0'
    )
    console.log('v1 réponse :', JSON.stringify(r).slice(0, 800))
  } catch (err) {
    console.log('Erreur v1 GET :', err.message)
  }
}

await sleep(DELAY)

// ── 2. Chercher un labo connu par son code RNSR ──
console.log('\n── Étape 2 : lookup par code RNSR (BPH = 201622170H) ──')

try {
  const r = await get('https://api.scanr.fr/v2/structure/201622170H')
  console.log('Champs dispo :')
  for (const [k, v] of Object.entries(r)) {
    console.log(`  ${k.padEnd(25)} ${JSON.stringify(v).slice(0, 80)}`)
  }
} catch (err) {
  console.log('Erreur lookup RNSR :', err.message)

  // Fallback avec ID HAL
  await sleep(DELAY)
  try {
    const r = await get('https://api.scanr.fr/v2/structure/476572')
    console.log('Via ID HAL :', JSON.stringify(r).slice(0, 500))
  } catch (err2) {
    console.log('Erreur lookup HAL ID :', err2.message)
  }
}

await sleep(DELAY)

// ── 3. Tester l'endpoint publications avec filtre labo ──
console.log('\n── Étape 3 : publications alzheimer pour BPH (RNSR 201622170H) ──')

try {
  const body = {
    query: 'alzheimer',
    filters: { structures: { type: 'MultiValueSearchFilter', values: ['201622170H'] } },
    size: 0,
  }
  const res = await fetch('https://api.scanr.fr/v2/publication/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const r = await res.json()
  console.log('Status:', res.status, '— Total publications Alz pour BPH :', r.total ?? r.hits?.total ?? JSON.stringify(r).slice(0, 200))
} catch (err) {
  console.log('Erreur publications :', err.message)
}

console.log()
process.exit(0)
