import fs from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
const write = args.includes('--write')
const files = args.filter((arg) => !arg.startsWith('--'))

if (!files.length) {
  console.error('usage: node scripts/classify-brand-evidence-roles.mjs migrations/<brand>/brand-mod.json [--write]')
  process.exit(1)
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`)
}

function normalizeColor(value) {
  return typeof value === 'string' ? value.trim().toUpperCase() : null
}

function normalizeText(value) {
  return (value || '').replace(/\s+/g, ' ').trim()
}

function includesAny(text, terms) {
  const normalized = normalizeText(text).toLowerCase()
  return terms.some((term) => normalized.includes(term))
}

function collectText(value) {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return value.map(collectText).join(' ')
  if (typeof value === 'object') return Object.values(value).map(collectText).join(' ')
  return ''
}

function collectRoleEvidence(siteEvidence, role) {
  return Array.isArray(siteEvidence?.roleEvidence?.[role]) ? siteEvidence.roleEvidence[role] : []
}

function pickTopCandidate(candidates, predicate = () => true) {
  return candidates.filter(predicate).sort((a, b) => (b.score || 0) - (a.score || 0))[0] || null
}

function mapToken(mod, key) {
  return mod?.tokens?.mapped?.[key] || null
}

function classifyCanvas(siteEvidence, mod) {
  const topColors = Array.isArray(siteEvidence?.topColors) ? siteEvidence.topColors : []
  const neutralCanvas = pickTopCandidate(topColors, (item) =>
    ['neutral', 'black', 'black-brown', 'white', 'yellow-gold'].includes(item.family)
  )
  const mapped = mapToken(mod, '--du-bg-2')
  return {
    token: '--du-bg-2',
    value: normalizeColor(mapped?.value) || normalizeColor(neutralCanvas?.color),
    source: mapped ? 'brand-mod.mapped' : 'site-evidence.topColors',
    confidence: mapped?.status || (neutralCanvas ? 'evidence-derived' : 'unknown'),
    evidence: mapped?.evidence || siteEvidence?.dominantToneDecision?.reason || []
  }
}

function classifySurface(siteEvidence, mod) {
  const semantic = siteEvidence?.topColors || []
  const lightSurface = pickTopCandidate(semantic, (item) => ['white', 'yellow-gold'].includes(item.family))
  const mapped = mapToken(mod, '--du-bg-1')
  return {
    token: '--du-bg-1',
    value: normalizeColor(mapped?.value) || normalizeColor(lightSurface?.color),
    source: mapped ? 'brand-mod.mapped' : 'site-evidence.topColors',
    confidence: mapped?.status || (lightSurface ? 'evidence-derived' : 'unknown'),
    evidence: mapped?.evidence || lightSurface || null
  }
}

function classifyPrimaryAction(siteEvidence, actionScore, mod) {
  const candidates = actionScore?.candidates?.primaryActionFill || []
  const weighted = pickTopCandidate(candidates, (item) =>
    ['red', 'yellow-gold', 'orange', 'green', 'blue', 'pink', 'purple'].includes(item.family)
  )
  const mapped = mapToken(mod, '--du-primary-color')
  return {
    token: '--du-primary-color',
    value: normalizeColor(mapped?.value) || normalizeColor(weighted?.hex),
    source: mapped ? 'brand-mod.mapped' : 'action-evidence-score.primaryActionFill',
    confidence: mapped?.status || (weighted ? 'evidence-derived' : 'unknown'),
    evidence: weighted?.examples || mapped?.evidence || []
  }
}

function classifyActiveAction(siteEvidence, actionScore) {
  const candidates = actionScore?.candidates?.activeStateFill || []
  const weighted = pickTopCandidate(candidates, (item) =>
    ['red', 'yellow-gold', 'orange', 'green', 'blue', 'pink', 'purple'].includes(item.family)
  )
  return {
    token: 'semantic.action.active',
    value: normalizeColor(weighted?.hex),
    source: weighted ? 'action-evidence-score.activeStateFill' : null,
    confidence: weighted ? 'evidence-derived' : 'unknown',
    evidence: weighted?.examples || []
  }
}

function classifyTypography(brandEvidence, mod) {
  const font = brandEvidence?.cssEvidence?.font || {}
  return {
    body: mod?.tokens?.styleOnly?.['--style-font-body']?.value || font.body || null,
    display: mod?.tokens?.styleOnly?.['--style-font-display']?.value || null,
    source: 'brand-evidence.cssEvidence.font + brand-mod.styleOnly'
  }
}

function classifySemanticPalette(brandEvidence, thirdPartyEvidence) {
  const palette = brandEvidence?.cssEvidence?.categoryPalette || {}
  const thirdPartyPalette = Array.isArray(thirdPartyEvidence?.computedEvidence?.palette)
    ? thirdPartyEvidence.computedEvidence.palette
    : []
  return {
    values: palette,
    fallbackFamilies: thirdPartyPalette
      .filter((item) => item.role === 'accent' || item.role === 'neutral')
      .slice(0, 6)
      .map((item) => ({ hex: item.hex, family: item.family, role: item.role })),
    source: 'brand-evidence.cssEvidence.categoryPalette + third-party palette'
  }
}

function classifyAssets(brandEvidence) {
  const assets = Array.isArray(brandEvidence?.assetEvidence) ? brandEvidence.assetEvidence : []
  return {
    hero: assets.filter((item) => item.role === 'hero-background' || item.role === 'logo'),
    decorative: assets.filter((item) => includesAny(item.role, ['decorative', 'loading', 'badge', 'accent'])),
    content: assets.filter((item) => includesAny(item.role, ['campaign-banner', 'theme-badge'])),
    source: 'brand-evidence.assetEvidence'
  }
}

function classifyBrand(file) {
  const absolute = path.resolve(process.cwd(), file)
  const mod = readJson(absolute)
  if (!mod) {
    throw new Error(`Cannot read brand mod: ${file}`)
  }

  const migrationRoot = path.dirname(absolute)
  const brand = mod?.manifest?.brand || path.basename(migrationRoot)
  const brandEvidence = readJson(path.join(migrationRoot, 'brand-evidence.json')) || {}
  const thirdPartyEvidence = readJson(path.join(migrationRoot, 'third-party-evidence.dembrandt.json')) || {}
  const siteEvidence =
    readJson(path.join(migrationRoot, 'site-evidence-action.json')) ||
    readJson(path.join(migrationRoot, 'site-evidence.json')) ||
    {}
  const actionScore =
    readJson(path.join(migrationRoot, 'action-evidence-score.skills.json')) ||
    readJson(path.join(migrationRoot, 'action-evidence-score.json')) ||
    {}

  return {
    schema: 'brand-evidence-roles.v0.1',
    brand,
    displayName: mod?.manifest?.displayName || brand,
    sourceUrl: mod?.manifest?.sourceUrl || brandEvidence?.sourceUrl || '',
    createdAt: new Date().toISOString(),
    notes: [
      'This file classifies brand evidence by page role rather than only by color frequency.',
      'Use canvas/surface/action roles before mapping to DangoUI tokens or business-page recipes.',
      'Category/semantic colors must not be promoted to primary action color without CTA evidence.'
    ],
    roles: {
      canvas: classifyCanvas(siteEvidence, mod),
      surface: classifySurface(siteEvidence, mod),
      primaryAction: classifyPrimaryAction(siteEvidence, actionScore, mod),
      activeAction: classifyActiveAction(siteEvidence, actionScore),
      typography: classifyTypography(brandEvidence, mod),
      semanticPalette: classifySemanticPalette(brandEvidence, thirdPartyEvidence),
      assets: classifyAssets(brandEvidence)
    },
    diagnostics: {
      dominantToneDecision: siteEvidence?.dominantToneDecision || null,
      thirdPartySemanticColors: thirdPartyEvidence?.computedEvidence?.semanticColors || null,
      actionRoleCount: Object.fromEntries(
        Object.entries(actionScore?.candidates || {}).map(([key, value]) => [key, Array.isArray(value) ? value.length : 0])
      )
    }
  }
}

for (const file of files) {
  const result = classifyBrand(file)
  if (!write) {
    console.log(JSON.stringify(result, null, 2))
    continue
  }

  const outputFile = path.join(path.dirname(path.resolve(process.cwd(), file)), 'evidence-roles.json')
  writeJson(outputFile, result)
  console.log(`wrote ${path.relative(process.cwd(), outputFile)}`)
}
