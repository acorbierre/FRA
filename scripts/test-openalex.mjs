// Test OpenAlex — debug structure API puis institutions Alzheimer Europe
// Usage : node scripts/test-openalex.mjs

const HEADERS = { 'User-Agent': 'mailto:contact@fra-recherche.org' }
const DELAY   = 300

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }
async function get(url) {
  const res = await fetch(url, { headers: HEADERS })
  return res.json()
}

// ── 1. Inspecter une institution connue (INSERM) pour comprendre la structure
console.log('\n── Étape 1 : structure d\'une institution connue (INSERM) ──')
const insermData = await get(
  'https://api.openalex.org/institutions?filter=display_name.search:inserm&per-page=1'
)
const inserm = insermData.results?.[0]
if (inserm) {
  console.log('Champs disponibles :', Object.keys(inserm).join(', '))
  console.log('topics (3 premiers) :', JSON.stringify(inserm.topics?.slice(0, 3) ?? 'absent'))
  console.log('x_concepts (3 premiers) :', JSON.stringify(inserm.x_concepts?.slice(0, 3) ?? 'absent'))
  console.log('works_count :', inserm.works_count)
} else {
  console.log('Aucun résultat pour INSERM')
  console.log('Brut :', JSON.stringify(insermData).slice(0, 400))
}

await sleep(DELAY)

// ── 2. Approche works — publications alzheimer groupées par institution France
console.log('\n── Étape 2 : works "alzheimer" groupés par institution (France) ──')
const worksData = await get(
  'https://api.openalex.org/works' +
  '?filter=default.search:alzheimer,institutions.country_code:fr' +
  '&group_by=institutions.id' +
  '&per-page=20'
)
const groups = worksData.group_by ?? []
console.log(`${groups.length} institutions trouvées via works`)
console.log('Exemple groupe :', JSON.stringify(groups[0] ?? {}))

await sleep(DELAY)

// ── 3. Si on a des institution IDs, récupérer leurs détails
if (groups.length > 0) {
  console.log('\n── Étape 3 : détail des top institutions ──')
  const topIds = groups.slice(0, 10).map(g => g.key).filter(Boolean).join('|')
  const detailData = await get(
    `https://api.openalex.org/institutions?filter=openalex_id:${topIds}&per-page=10`
  )
  const details = detailData.results ?? []

  console.log(`\n${'Institution'.padEnd(45)} ${'Pays'} ${'Pub.Alz (works)'}`)
  console.log('─'.repeat(65))

  for (const inst of details) {
    const grp = groups.find(g => g.key === inst.id)
    console.log(`${inst.display_name.slice(0, 44).padEnd(45)} ${(inst.country_code ?? '??').toUpperCase().padEnd(5)} ${grp?.count ?? '?'}`)
  }
}

console.log()
process.exit(0)
