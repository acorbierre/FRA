// Diagnostic labos manquants dans la carto
// Usage : node scripts/debug-labos.mjs

const HEADERS = { 'User-Agent': 'mailto:contact@fra-recherche.org' }
const DELAY   = 400

const LABOS = [
  'CEA Fontenay-aux-Roses',
  'Institut de NeuroPhysiopathologie',
  'Lille Neuroscience Cognition',
  'Institut Interdisciplinaire des Neurosciences',
  'Centre de Biologie Integrative Toulouse',
  'Hospices Civils de Lyon',
  'Institut de Genetique Moleculaire de Montpellier',
  'Inserm UMR1245',
  'Gustave Roussy',
  'Grenoble Institut Neurosciences',
]

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function get(url) {
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`)
  return res.json()
}

async function checkLabo(name) {
  // 1. Chercher l'institution par nom
  const searchUrl =
    `https://api.openalex.org/institutions` +
    `?filter=display_name.search:${encodeURIComponent(name)}` +
    `&per-page=5` +
    `&select=id,display_name,country_code,geo,works_count,cited_by_count,topics`

  const data = await get(searchUrl)
  const results = data.results ?? []

  if (results.length === 0) {
    return { name, status: 'NON TROUVE dans OpenAlex', openalex_name: null, geo: null, alz_count: null, works_count: null, topics: [] }
  }

  // Prendre le premier résultat FR si dispo, sinon le premier tout court
  const inst = results.find(r => r.country_code?.toLowerCase() === 'fr') ?? results[0]
  const hasGeo = !!(inst.geo?.latitude && inst.geo?.longitude)

  // 2. Chercher ses publications Alzheimer
  await sleep(DELAY)
  const shortId = inst.id.split('/').pop()
  const worksUrl =
    `https://api.openalex.org/works` +
    `?filter=default.search:alzheimer,institutions.id:${shortId}` +
    `&per-page=1`
  const worksData = await get(worksUrl)
  const alzCount = worksData.meta?.count ?? 0

  // 3. Topics principaux
  const topTopics = (inst.topics ?? []).slice(0, 3).map(t => t.display_name)

  return {
    name,
    status: 'TROUVE',
    openalex_name: inst.display_name,
    geo: hasGeo ? `${inst.geo.city} (${inst.geo.latitude?.toFixed(2)}, ${inst.geo.longitude?.toFixed(2)})` : 'ABSENT',
    alz_count: alzCount,
    works_count: inst.works_count ?? 0,
    topics: topTopics,
  }
}

console.log('\nDiagnostic labos manquants dans la carto FRA\n' + '='.repeat(60))

for (const labo of LABOS) {
  await sleep(DELAY)
  try {
    const r = await checkLabo(labo)
    console.log(`\n[${r.status}] "${r.name}"`)
    if (r.status === 'TROUVE') {
      console.log(`  OpenAlex : ${r.openalex_name}`)
      console.log(`  Geo      : ${r.geo}`)
      console.log(`  Pub. Alz : ${r.alz_count}`)
      console.log(`  Works tot: ${r.works_count}`)
      console.log(`  Topics   : ${r.topics.join(' / ') || 'aucun'}`)

      const raisons = []
      if (r.geo === 'ABSENT') raisons.push('pas de geo → skippé à l\'import')
      if (r.alz_count === 0) raisons.push('0 publications Alzheimer → absent du group_by')
      if (r.alz_count > 0 && r.alz_count < 10) raisons.push(`seulement ${r.alz_count} pub. Alz → peut être hors top 200`)
      if (raisons.length) console.log(`  >> Cause probable : ${raisons.join(', ')}`)
    }
  } catch (err) {
    console.log(`\n[ERREUR] "${labo}" : ${err.message}`)
  }
}

console.log('\n' + '='.repeat(60) + '\n')
process.exit(0)
