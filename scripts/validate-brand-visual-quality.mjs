import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const args = process.argv.slice(2)
const strict = args.includes('--strict')
const write = args.includes('--write')
const brandFilter = readArg('--brand')
const registryFile = path.resolve(root, 'public/brand-previews/registry.json')
const reports = []
const errors = []

function readArg(name) {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : null
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

function normalizeColor(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function includesAny(value, terms) {
  return terms.some((term) => value.includes(term))
}

function collectText(value) {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return value.map(collectText).join(' ')
  if (typeof value === 'object') return Object.values(value).map(collectText).join(' ')
  return ''
}

function issue(list, severity, code, message, evidence = {}) {
  list.push({ severity, code, message, evidence })
}

function tokenValue(preview, name) {
  return preview?.preset?.tokens?.find((token) => token?.name === name)?.value
}

function categoryColors(evidence) {
  const palette = evidence?.cssEvidence?.categoryPalette
  if (!palette || typeof palette !== 'object') return new Set()
  return new Set(Object.values(palette).map(normalizeColor).filter(Boolean))
}

function assetRoles(evidence, preview) {
  const roles = new Set()
  for (const asset of evidence?.assets || []) {
    if (asset?.role) roles.add(asset.role)
  }
  for (const asset of evidence?.assetEvidence || []) {
    if (asset?.role) roles.add(asset.role)
  }
  for (const asset of Object.values(preview?.preset?.assets || {})) {
    if (asset?.role) roles.add(asset.role)
  }
  return roles
}

function pageRoles(preview) {
  return new Set((preview?.pages || []).flatMap((page) => page?.components || []))
}

function buildReport(entry) {
  const previewFile = path.resolve(root, 'public', entry.path.replace(/^\/+/, ''))
  const preview = readJson(previewFile)
  const migrationRoot = path.resolve(root, entry.migrationRoot || `migrations/${entry.id}`)
  const evidence = readJson(path.resolve(migrationRoot, 'brand-evidence.json')) || {}
  const inventory = readJson(path.resolve(migrationRoot, 'asset-inventory.json')) || {}
  const mod = readJson(path.resolve(migrationRoot, 'brand-mod.json')) || {}
  const issues = []

  if (!preview) {
    issue(issues, 'blocking', 'missing-preview-json', `Cannot read preview JSON at ${entry.path}`)
    return { brand: entry.id, level: 'protocol-blocked', issues }
  }

  const primary = normalizeColor(tokenValue(preview, '--du-primary-color'))
  const text = collectText({ evidence, preview, mod }).toLowerCase()
  const primaryText = collectText({
    token: preview.preset?.tokens?.filter((token) => token?.name === '--du-primary-color'),
    signals: preview.preset?.signals?.filter((signal) => collectText(signal).includes('--du-primary-color')),
    colorRecipe: preview.styleRecipeDetails?.color
  }).toLowerCase()
  const semanticColors = categoryColors(evidence)
  const hasCategorySemantics = semanticColors.size >= 3 || includesAny(text, ['categorypalette', 'taxonomy', 'semantic category', '分类', '品类'])
  const hasActionEvidence = includesAny(primaryText, ['cta', 'button', 'action', 'primary action', '主操作', '按钮', '行动'])
  const primaryLooksSemantic = includesAny(primaryText, ['semantic', 'category', 'taxonomy', 'news', 'game', 'app', 'card', '分類', '分类', '品类'])

  if (primary && semanticColors.has(primary) && hasCategorySemantics && !hasActionEvidence) {
    issue(
      issues,
      'warning',
      'primary-color-looks-like-category-color',
      '--du-primary-color appears to come from a taxonomy/category color, not from a primary action or brand mark.',
      { primary, categoryPalette: evidence.cssEvidence?.categoryPalette || null }
    )
  }

  if (primary && primaryLooksSemantic && !hasActionEvidence) {
    issue(
      issues,
      'warning',
      'primary-color-evidence-is-semantic-not-action',
      '--du-primary-color is justified as a semantic/category color; primary action color needs CTA/button/logo computed evidence.',
      { primary, primaryEvidence: primaryText.slice(0, 600) }
    )
  }

  if (evidence?.sourceEvidence?.primaryCta && !hasActionEvidence) {
    issue(
      issues,
      'warning',
      'primary-cta-not-used-as-color-evidence',
      'Evidence has a primary CTA, but the preview does not justify --du-primary-color from CTA/button computed style.',
      { primaryCta: evidence.sourceEvidence.primaryCta, primary }
    )
  }

  const roles = assetRoles(evidence, preview)
  const requiredWhenPresent = ['hero-background', 'logo']
  for (const role of requiredWhenPresent) {
    const evidenceHasRole = (evidence.assets || []).some((asset) => asset?.role === role)
    const previewHasRole = Object.values(preview.preset?.assets || {}).some((asset) => asset?.role === role)
    if (evidenceHasRole && !previewHasRole) {
      issue(issues, 'blocking', `missing-${role}-preview-asset`, `Evidence contains ${role}, but preview assets do not expose it.`)
    }
  }

  if (roles.size >= 4 && (preview.pages || []).length < 3) {
    issue(
      issues,
      'warning',
      'asset-rich-source-has-too-few-pages',
      'Source has a rich asset vocabulary; standard demo should expose at least three page templates before business apply.',
      { assetRoles: Array.from(roles), pages: preview.pages?.length || 0 }
    )
  }

  const pages = pageRoles(preview)
  for (const role of ['HeroHeader', 'Image', 'Button']) {
    if (!pages.has(role)) {
      issue(issues, 'warning', `missing-${role.toLowerCase()}-component-role`, `Preview pages do not show ${role}, so visual transfer cannot be inspected.`)
    }
  }

  const missingForDemoGate = inventory.missingForDemoGate || []
  if (missingForDemoGate.length) {
    issue(
      issues,
      'warning',
      'asset-inventory-has-demo-gate-gaps',
      'Asset inventory still lists required evidence before the demo can be treated as visually verified.',
      { missingForDemoGate }
    )
  }

  const mustVerifyText = collectText(preview.mustVerifyBeforeApply).toLowerCase()
  if (!includesAny(mustVerifyText, ['screenshot', 'computed', '截图', '渲染', 'crop', '比例'])) {
    issue(
      issues,
      'warning',
      'missing-rendered-verification-items',
      'mustVerifyBeforeApply should include rendered screenshot/computed checks, not only data/schema checks.'
    )
  }

  const hasDecorativeAsset = Array.from(roles).some((role) => role.includes('decorative')) || roles.has('loading-animation')
  const motionRecipeText = collectText(preview.styleRecipeDetails?.motion).toLowerCase()
  if (hasDecorativeAsset && !motionRecipeText) {
    issue(
      issues,
      'warning',
      'decorative-motion-not-modeled',
      'Evidence contains decorative or animated assets, but preview has no motion/decoration recipe.'
    )
  }

  const warningCount = issues.filter((item) => item.severity === 'warning').length
  const blockingCount = issues.filter((item) => item.severity === 'blocking').length
  const level = blockingCount
    ? 'protocol-blocked'
    : warningCount
      ? 'draft-visual-preview'
      : 'visual-quality-ready'

  return {
    brand: entry.id,
    displayName: entry.displayName,
    sourceUrl: entry.sourceUrl,
    level,
    primaryColor: primary || null,
    assetRoles: Array.from(roles).sort(),
    pageCount: preview.pages?.length || 0,
    issues
  }
}

function writeReport(report) {
  const file = path.resolve(root, 'migrations', report.brand, 'visual-quality-report.json')
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, `${JSON.stringify(report, null, 2)}\n`)
}

function main() {
  const registry = readJson(registryFile)
  if (!registry?.brands?.length) {
    errors.push('public/brand-previews/registry.json must contain brands[]')
    return finish()
  }

  const entries = registry.brands.filter((entry) => !brandFilter || entry.id === brandFilter)
  if (brandFilter && entries.length === 0) {
    errors.push(`brand ${brandFilter} not found in preview registry`)
    return finish()
  }

  for (const entry of entries) {
    const report = buildReport(entry)
    reports.push(report)
    if (write) writeReport(report)
  }

  finish()
}

function finish() {
  for (const error of errors) console.error(`brand-quality validation failed: ${error}`)

  for (const report of reports) {
    console.log(`brand-quality ${report.brand}: ${report.level}`)
    for (const item of report.issues) {
      const prefix = item.severity === 'blocking' ? '  blocking' : '  warning'
      console.log(`${prefix}: ${item.code} - ${item.message}`)
    }
    if (!report.issues.length) console.log('  ok: no visual quality gaps detected')
  }

  const blocking = reports.flatMap((report) => report.issues).some((item) => item.severity === 'blocking')
  const warnings = reports.flatMap((report) => report.issues).some((item) => item.severity === 'warning')
  if (errors.length || blocking || (strict && warnings)) process.exit(1)
}

main()
