import fs from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
const write = args.includes('--write')
const files = args.filter((arg) => arg !== '--write')

function fail(message) {
  console.error(`normalize-brand-mod-dtcg failed: ${message}`)
  process.exit(1)
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function sanitizeTokenName(key) {
  return key
    .replace(/^--/, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function inferType(key, value) {
  if (typeof value === 'number') return 'number'
  if (typeof value === 'object' && value !== null) return 'object'
  if (typeof value !== 'string') return 'string'

  const normalized = value.trim()
  if (/^#([0-9a-f]{3,8})$/i.test(normalized)) return 'color'
  if (/^(rgb|rgba|hsl|hsla)\(/i.test(normalized)) return 'color'
  if (/font/i.test(key) || /serif|sans|mono|Helvetica|Arial|Noto/i.test(normalized)) {
    return 'fontFamily'
  }
  if (/shadow/i.test(key) || /\b-?\d+(\.\d+)?(px|rem|em)\b.*\b-?\d+(\.\d+)?(px|rem|em)\b/.test(normalized)) {
    return 'shadow'
  }
  if (/^(-?\d+(\.\d+)?)(px|rem|em|vh|vw|%)$/.test(normalized)) return 'dimension'
  if (/^\d+\s*\/\s*\d+$/.test(normalized)) return 'string'
  return 'string'
}

function legacyDescription(entry) {
  return entry.evidence || entry.source || entry.reason || entry.usage || 'Generated from legacy Brand MOD token mirror.'
}

function createDtcgToken({ key, entry, channel }) {
  const value = entry?.value
  const token = {
    '$type': inferType(key, value),
    '$value': value,
    '$description': legacyDescription(entry || {}),
    '$extensions': {
      'echo.brand.target': key,
      'echo.brand.channel': channel,
      'echo.brand.status': entry?.status || channel,
      'echo.brand.usage': entry?.usage || '',
      'echo.brand.legacyKey': key
    }
  }

  if (entry?.evidence) token.$extensions['echo.brand.evidence'] = entry.evidence
  if (entry?.source) token.$extensions['echo.brand.source'] = entry.source
  if (entry?.reason) token.$extensions['echo.brand.reason'] = entry.reason

  return token
}

function normalizeMod(file) {
  const absolute = path.resolve(process.cwd(), file)
  if (!fs.existsSync(absolute)) fail(`file not found: ${file}`)

  const mod = readJson(absolute)
  if (!mod.tokens?.mapped || !mod.tokens?.styleOnly) {
    fail(`${file} must contain tokens.mapped and tokens.styleOnly`)
  }

  const dtcg = {
    '$description': `${mod.manifest?.displayName || mod.manifest?.brand || 'Brand'} DTCG token contract generated from Brand MOD token mirrors.`,
    '$extensions': {
      'echo.brand.schema': 'brand-mod.tokens.dtcg/v0.1',
      'echo.brand.sourceFile': file,
      'echo.brand.note': 'DTCG is canonical for reusable token values; mapped/styleOnly are compatibility mirrors for current demo consumers.'
    },
    mapped: {},
    styleOnly: {}
  }

  for (const [key, entry] of Object.entries(mod.tokens.mapped)) {
    dtcg.mapped[sanitizeTokenName(key)] = createDtcgToken({ key, entry, channel: 'mapped' })
  }

  for (const [key, entry] of Object.entries(mod.tokens.styleOnly)) {
    dtcg.styleOnly[sanitizeTokenName(key)] = createDtcgToken({ key, entry, channel: 'styleOnly' })
  }

  mod.tokens.dtcg = dtcg

  if (write) {
    fs.writeFileSync(absolute, `${JSON.stringify(mod, null, 2)}\n`)
  }

  console.log(`${write ? 'normalized' : 'would normalize'}: ${file}`)
}

if (!files.length) {
  fail('usage: node scripts/normalize-brand-mod-dtcg.mjs migrations/<brand>/brand-mod.json [more files] --write')
}

for (const file of files) normalizeMod(file)
