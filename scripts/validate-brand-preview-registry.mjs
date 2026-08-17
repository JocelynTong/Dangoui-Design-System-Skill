import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const registryFile = path.resolve(root, 'public/brand-previews/registry.json')
const requiredEntryFields = [
  'id',
  'displayName',
  'sourceUrl',
  'path',
  'migrationRoot',
  'status',
  'standardDemo',
  'businessApply'
]
const requiredTokens = ['--du-bg-2', '--du-bg-1', '--du-text-1', '--du-primary-color']
const errors = []
const warnings = []

function readJson(file, scope) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (error) {
    errors.push(`${scope}: cannot read JSON (${error.message})`)
    return null
  }
}

function fail(scope, message) {
  errors.push(`${scope}: ${message}`)
}

function warn(scope, message) {
  warnings.push(`${scope}: ${message}`)
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function validateRegistryEntry(entry, index) {
  const scope = `registry.brands[${index}]${entry?.id ? ` (${entry.id})` : ''}`

  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    fail(scope, 'entry must be an object')
    return
  }

  for (const field of requiredEntryFields) {
    if (!(field in entry)) fail(scope, `missing ${field}`)
  }

  for (const field of ['brand', 'preview']) {
    if (field in entry) fail(scope, `legacy ${field} field is not allowed; use id/path`)
  }

  for (const field of ['id', 'displayName', 'sourceUrl', 'path', 'migrationRoot', 'status']) {
    if (field in entry && !isNonEmptyString(entry[field])) fail(scope, `${field} must be a non-empty string`)
  }

  if (typeof entry.standardDemo !== 'boolean') fail(scope, 'standardDemo must be boolean')
  if (typeof entry.businessApply !== 'boolean') fail(scope, 'businessApply must be boolean')

  if (isNonEmptyString(entry.path)) {
    if (!entry.path.startsWith('/brand-previews/')) {
      fail(scope, 'path must start with /brand-previews/')
    }
    if (entry.path.includes('public/')) {
      fail(scope, 'path must be a public URL path, not a filesystem path')
    }
  }

  if (!entry.id || !entry.path) return

  const previewFile = path.resolve(root, 'public', entry.path.replace(/^\/+/, ''))
  if (!fs.existsSync(previewFile)) {
    fail(scope, `preview JSON does not exist: ${entry.path}`)
    return
  }

  const preview = readJson(previewFile, entry.path)
  if (!preview) return

  validatePreview(entry, preview, entry.path)
}

function validatePreview(entry, preview, scope) {
  if (preview.brand !== entry.id) fail(scope, `brand (${preview.brand}) must match registry id (${entry.id})`)
  if (preview.displayName !== entry.displayName) {
    warn(scope, `displayName (${preview.displayName}) differs from registry (${entry.displayName})`)
  }
  if (preview.sourceUrl !== entry.sourceUrl) fail(scope, 'sourceUrl must match registry sourceUrl')
  if (preview.status !== entry.status) fail(scope, 'status must match registry status')
  if (preview.standardDemo !== entry.standardDemo) fail(scope, 'standardDemo must match registry standardDemo')
  if (preview.businessApply !== entry.businessApply) fail(scope, 'businessApply must match registry businessApply')
  if (preview.migrationRoot !== entry.migrationRoot) fail(scope, 'migrationRoot must match registry migrationRoot')

  if (entry.standardDemo !== true) {
    fail(scope, 'registry preview entries must be standardDemo=true; business previews do not belong here')
  }
  if (entry.businessApply !== false) {
    fail(scope, 'registry preview entries must be businessApply=false')
  }

  const preset = preview.preset
  if (!preset || typeof preset !== 'object') {
    fail(scope, 'missing preset')
    return
  }

  if (preset.id !== entry.id) fail(scope, `preset.id (${preset.id}) must match registry id (${entry.id})`)
  if (!isNonEmptyString(preset.label)) fail(scope, 'preset.label is required')
  if (!isNonEmptyString(preset.source)) fail(scope, 'preset.source is required')
  if (!Array.isArray(preset.tokens) || preset.tokens.length < requiredTokens.length) {
    fail(scope, 'preset.tokens must include core DangoUI tokens')
  } else {
    const tokenNames = new Set(preset.tokens.map((token) => token?.name))
    for (const token of requiredTokens) {
      if (!tokenNames.has(token)) fail(scope, `preset.tokens missing ${token}`)
    }
  }

  if (!preset.assets || typeof preset.assets !== 'object' || !Object.keys(preset.assets).length) {
    fail(scope, 'preset.assets must not be empty')
  }

  if (!Array.isArray(preview.pages) || preview.pages.length < 2) {
    fail(scope, 'pages must include at least two standard demo pages')
  } else {
    for (const page of preview.pages) validatePage(scope, entry.id, page)
  }

  const recipeCategories = preview.styleRecipeDetails && Object.keys(preview.styleRecipeDetails)
  if (!recipeCategories?.length) {
    fail(scope, 'styleRecipeDetails must expose style tab evidence')
  }

  if (!Array.isArray(preview.mustVerifyBeforeApply) || preview.mustVerifyBeforeApply.length < 2) {
    warn(scope, 'mustVerifyBeforeApply should list concrete visual checks before business apply')
  }
}

function validatePage(scope, brand, page) {
  const pageScope = `${scope} page ${page?.id || '<missing>'}`
  if (!isNonEmptyString(page?.id)) fail(pageScope, 'id is required')
  if (page?.id && !page.id.startsWith(`${brand}-`)) fail(pageScope, `id must start with ${brand}-`)
  if (!isNonEmptyString(page?.kind)) fail(pageScope, 'kind is required')
  if (!isNonEmptyString(page?.layoutRecipe)) warn(pageScope, 'layoutRecipe should explain the page template')
  if (!Array.isArray(page?.components) || page.components.length < 3) {
    fail(pageScope, 'components must list the DangoUI/component roles used by the preview')
  }
}

function main() {
  if (!fs.existsSync(registryFile)) {
    fail('public/brand-previews/registry.json', 'registry file is required for standard demo previews')
  }

  const registry = readJson(registryFile, 'public/brand-previews/registry.json')
  if (!registry) return finish()

  if (registry.schema !== 'brand-preview-registry.v0.1') {
    fail('registry', 'schema must be brand-preview-registry.v0.1')
  }

  if ('items' in registry) fail('registry', 'legacy items[] is not allowed; use brands[]')
  if (!Array.isArray(registry.brands)) fail('registry', 'brands[] is required')

  const seen = new Set()
  for (const [index, entry] of (registry.brands || []).entries()) {
    if (entry?.id) {
      if (seen.has(entry.id)) fail(`registry.brands[${index}]`, `duplicate id ${entry.id}`)
      seen.add(entry.id)
    }
    validateRegistryEntry(entry, index)
  }

  if (!seen.size) fail('registry', 'brands[] must not be empty')
  finish(seen.size)
}

function finish(count = 0) {
  for (const warning of warnings) console.warn(`brand-preview warning: ${warning}`)

  if (errors.length) {
    for (const error of errors) console.error(`brand-preview validation failed: ${error}`)
    process.exit(1)
  }

  console.log(`brand-preview summary: ${count} preview(s) ok`)
}

main()
