import fs from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
const write = args.includes('--write')
const files = args.filter((arg) => !arg.startsWith('--'))

if (!files.length) {
  console.error('usage: node scripts/score-action-evidence.mjs migrations/<brand>/action-evidence-v02.json [--write]')
  process.exit(1)
}

const PRIMARY_TEXT_RE = /(download|apply|submit|publish|register|signup|sign up|join|claim|install|start|open|shop|buy|book|next|more|summary|news|detail|details|view|explore|launch|play|领取|下载|报名|提交|发布|立即|查看|打开|进入|开始|继续|参与|购买|预约|次へ|ダウンロード|応募|送信|投稿|登録|参加|開始|続く|次へ|詳しく|受け取|申し込|ニュース)/i
const ACTIVE_STATE_RE = /(^|[\s.:_-])(is-active|active|selected|current|checked|pressed)(?=$|[\s.:_-])/i
const STATE_COMPONENT_RE = /(tab-select|tab|toggle|chip|segment|filter|pill)/i
const NAV_RE = /(nav|menu|pager|pagination|pagetop|prev|next|back|forward)/i
const BLACKLIST_PRIMARY_TEXT_RE = /^(すべて|全部|all)$/i

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`)
}

function rgbToHex(input) {
  if (!input || typeof input !== 'string') return null
  const value = input.trim().toLowerCase()
  if (value.startsWith('#')) return value.toUpperCase()
  const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!match) return null
  const [, r, g, b] = match.map(Number)
  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, '0')).join('').toUpperCase()}`
}

function isTransparent(color) {
  if (!color) return true
  return /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*0(?:\.0+)?\s*\)/i.test(color) || color === 'transparent'
}

function classifyFamily(hex) {
  const normalized = hex?.toUpperCase()
  if (!normalized) return 'unknown'
  const int = Number.parseInt(normalized.slice(1), 16)
  const r = (int >> 16) & 255
  const g = (int >> 8) & 255
  const b = int & 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  const lightness = (max + min) / 2

  if (delta < 12 && lightness > 230) return 'white'
  if (delta < 12 && lightness < 30) return 'black'
  if (delta < 12) return 'neutral'
  if (r > 210 && g > 170 && b < 120) return 'yellow-gold'
  if (r > 180 && g < 110 && b < 110) return 'red'
  if (g > 150 && r < 170 && b < 170) return 'green'
  if (b > 170 && r < 170) return 'blue'
  if (r > 180 && b > 180 && g < 170) return 'purple'
  return 'mixed'
}

function normalizeText(text) {
  return (text || '').replace(/\s+/g, ' ').trim()
}

function isActiveLike(entry) {
  return ACTIVE_STATE_RE.test(`${entry.selector || ''} ${entry.className || ''}`)
}

function isStateComponentLike(entry) {
  return STATE_COMPONENT_RE.test(`${entry.selector || ''} ${entry.className || ''}`)
}

function isNavLike(entry) {
  return NAV_RE.test(`${entry.selector || ''} ${entry.className || ''}`) || entry.role === 'nav'
}

function hasPrimaryIntent(entry) {
  const text = normalizeText(entry.text)
  if (!text) return false
  if (BLACKLIST_PRIMARY_TEXT_RE.test(text)) return false
  return PRIMARY_TEXT_RE.test(text)
}

function areaWeight(entry) {
  const area = entry?.rect?.area || 0
  if (area >= 30000) return 1.6
  if (area >= 15000) return 1.35
  if (area >= 7000) return 1.15
  return 1
}

function backgroundWeight(hex) {
  const family = classifyFamily(hex)
  if (family === 'white' || family === 'black' || family === 'neutral') return 0.4
  return 1
}

function scorePrimaryAction(entry, hex) {
  let score = Number(entry.actionScore || 1)
  if (entry.tag === 'button') score *= 1.08
  if (entry.tag === 'a' && entry.href) score *= 1.12
  if (entry.firstScreen) score *= 1.1
  score *= areaWeight(entry)
  score *= backgroundWeight(hex)
  if (hasPrimaryIntent(entry)) score *= 2.4
  if (isNavLike(entry)) score *= 0.45
  if (isActiveLike(entry)) score *= 0.5
  if ((entry.role || '') === 'control') score *= 0.8
  return Number(score.toFixed(3))
}

function scoreActiveState(entry, hex) {
  let score = Number(entry.actionScore || 1)
  if (isActiveLike(entry)) score *= 2.8
  if (isStateComponentLike(entry)) score *= 1.8
  if (classifyFamily(hex) === 'white' || classifyFamily(hex) === 'neutral') score *= 0.25
  if (hasPrimaryIntent(entry)) score *= 0.35
  return Number(score.toFixed(3))
}

function scoreNeutralSurface(entry, hex) {
  const family = classifyFamily(hex)
  if (family !== 'white' && family !== 'neutral') return 0
  let score = Number(entry.actionScore || 1)
  if (isActiveLike(entry)) score *= 0.3
  if (isNavLike(entry)) score *= 0.7
  if (entry.tag === 'button' || entry.tag === 'a') score *= 1.2
  return Number(score.toFixed(3))
}

function scoreTextBorder(entry, hex, field) {
  let score = Number(entry.actionScore || 1)
  if (field === 'color') score *= 0.9
  if (field === 'borderTopColor') score *= 0.6
  if (classifyFamily(hex) === 'white' && !isActiveLike(entry)) score *= 0.3
  return Number(score.toFixed(3))
}

function isPrimaryBucketCandidate(entry, hex) {
  if (!hex) return false
  if (classifyFamily(hex) === 'white' || classifyFamily(hex) === 'neutral' || classifyFamily(hex) === 'black') {
    return false
  }
  if (isActiveLike(entry)) return false
  if (isNavLike(entry)) return false
  if (hasPrimaryIntent(entry)) return true
  return Boolean(entry.tag === 'a' && entry.href && (entry.rect?.area || 0) >= 7000)
}

function isActiveBucketCandidate(entry) {
  return isActiveLike(entry)
}

function isNeutralSurfaceCandidate(entry, hex) {
  const family = classifyFamily(hex)
  if (family !== 'white' && family !== 'neutral') return false
  if (isActiveLike(entry) && classifyFamily(hex) !== 'white') return false
  return true
}

function upsertCandidate(map, bucket, hex, entry, field, score) {
  if (!hex || score <= 0) return
  const key = `${bucket}:${hex}`
  if (!map.has(key)) {
    map.set(key, {
      hex,
      family: classifyFamily(hex),
      score: 0,
      count: 0,
      examples: []
    })
  }

  const target = map.get(key)
  target.score = Number((target.score + score).toFixed(3))
  target.count += 1
  if (target.examples.length < 4) {
    target.examples.push({
      selector: entry.selector || '',
      text: normalizeText(entry.text),
      field,
      value: entry.styles?.[field] || '',
      role: entry.role || '',
      score
    })
  }
}

function buildCandidates(entries) {
  const candidates = new Map()

  for (const entry of entries) {
    const backgroundHex = rgbToHex(entry.styles?.backgroundColor)
    const textHex = rgbToHex(entry.styles?.color)
    const borderHex = rgbToHex(entry.styles?.borderTopColor)

    if (backgroundHex && !isTransparent(entry.styles?.backgroundColor)) {
      if (isPrimaryBucketCandidate(entry, backgroundHex)) {
        upsertCandidate(candidates, 'primaryActionFill', backgroundHex, entry, 'backgroundColor', scorePrimaryAction(entry, backgroundHex))
      }
      if (isActiveBucketCandidate(entry)) {
        upsertCandidate(candidates, 'activeStateFill', backgroundHex, entry, 'backgroundColor', scoreActiveState(entry, backgroundHex))
      }
      if (isNeutralSurfaceCandidate(entry, backgroundHex)) {
        upsertCandidate(candidates, 'neutralActionSurface', backgroundHex, entry, 'backgroundColor', scoreNeutralSurface(entry, backgroundHex))
      }
    }

    if (textHex && !isTransparent(entry.styles?.color)) {
      upsertCandidate(candidates, 'actionTextBorder', textHex, entry, 'color', scoreTextBorder(entry, textHex, 'color'))
    }

    if (borderHex && !isTransparent(entry.styles?.borderTopColor)) {
      upsertCandidate(candidates, 'actionTextBorder', borderHex, entry, 'borderTopColor', scoreTextBorder(entry, borderHex, 'borderTopColor'))
    }
  }

  return {
    primaryActionFill: collectBucket(candidates, 'primaryActionFill'),
    activeStateFill: collectBucket(candidates, 'activeStateFill'),
    neutralActionSurface: collectBucket(candidates, 'neutralActionSurface'),
    actionTextBorder: collectBucket(candidates, 'actionTextBorder')
  }
}

function collectBucket(map, bucket) {
  return [...map.entries()]
    .filter(([key]) => key.startsWith(`${bucket}:`))
    .map(([, value]) => value)
    .sort((a, b) => b.score - a.score)
}

function scoreFile(file) {
  const absolute = path.resolve(process.cwd(), file)
  const raw = readJson(absolute)
  const brand = absolute.split(path.sep).at(-2) || 'unknown'

  return {
    schema: 'brand-action-evidence-score/v1',
    brand,
    source: path.relative(process.cwd(), absolute),
    createdAt: new Date().toISOString(),
    candidates: buildCandidates(raw.entries || [])
  }
}

for (const file of files) {
  const absolute = path.resolve(process.cwd(), file)
  const scored = scoreFile(absolute)

  if (!write) {
    console.log(JSON.stringify(scored, null, 2))
    continue
  }

  const brandDir = path.dirname(absolute)
  writeJson(path.join(brandDir, 'action-evidence-score.json'), scored)
  writeJson(path.join(brandDir, 'action-evidence-score.skills.json'), scored)
  console.log(`scored action evidence: ${path.relative(process.cwd(), absolute)}`)
}
