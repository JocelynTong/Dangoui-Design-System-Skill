import fs from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
const write = args.includes('--write')
const files = args.filter((arg) => !arg.startsWith('--'))

if (!files.length) {
  console.error('usage: node scripts/derive-brand-semantic-roles.mjs migrations/<brand>/brand-mod.json [--write]')
  process.exit(1)
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function findDtcgPath(target, node, trail = []) {
  if (!isObject(node)) return null

  if ('$type' in node && '$value' in node) {
    return node?.$extensions?.['echo.brand.target'] === target ? trail.join('.') : null
  }

  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith('$')) continue
    const found = findDtcgPath(target, value, [...trail, key])
    if (found) return found
  }

  return null
}

function createTokenRole(mod, tokenKey, kind, usage) {
  const channel = tokenKey.startsWith('--style-') ? 'styleOnly' : 'mapped'
  const entry = mod.tokens?.[channel]?.[tokenKey]
  if (!entry) return null

  return {
    kind,
    value: entry.value,
    target: tokenKey,
    dtcgPath: findDtcgPath(tokenKey, mod.tokens?.dtcg) || '',
    status: entry.status || 'mapped',
    usage,
    sources: [`tokens.${channel}.${tokenKey}`],
    evidence: [entry.evidence || entry.source || entry.reason || `${tokenKey} mapped from brand token evidence.`].filter(Boolean)
  }
}

function createActionRole(actionEvidence, bucket, kind, usage) {
  const candidates = actionEvidence?.candidates?.[bucket]
  if (!Array.isArray(candidates) || !candidates.length) return null
  const winner = candidates[0]

  return {
    kind,
    value: winner.hex,
    status: 'protocol-derived',
    usage,
    sources: [bucket],
    evidence: [
      `Derived from action evidence bucket ${bucket}; highest-ranked candidate ${winner.hex} (${winner.family}, score ${winner.score}).`
    ],
    protocol: {
      schema: actionEvidence.schema || '',
      source: actionEvidence.source || '',
      bucket,
      topCandidates: candidates.slice(0, 3).map((candidate) => ({
        hex: candidate.hex,
        family: candidate.family,
        score: candidate.score,
        count: candidate.count
      }))
    }
  }
}

function createPrimaryFallbackRole(mod) {
  const mappedPrimary = mod.tokens?.mapped?.['--du-primary-color']
  if (!mappedPrimary) return null

  return {
    kind: 'mappedTokenFallback',
    value: mappedPrimary.value,
    target: '--du-primary-color',
    dtcgPath: findDtcgPath('--du-primary-color', mod.tokens?.dtcg) || '',
    status: mappedPrimary.status || 'mapped',
    usage: 'Fallback primary action fill when no action-evidence sample exists yet; replace with actionEvidence once computed CTA sampling is available.',
    sources: ['tokens.mapped.--du-primary-color'],
    evidence: [
      mappedPrimary.evidence || mappedPrimary.source || mappedPrimary.reason || 'Fallback to currently mapped primary action token because no action evidence bucket was available.'
    ].filter(Boolean),
    protocol: {
      source: 'fallback-from-mapped-primary',
      reason: 'action-evidence-missing'
    }
  }
}

function deriveSemanticRoles(mod, actionEvidence) {
  const roles = {}

  const tokenRoleSpecs = [
    ['surface.page', '--du-bg-2', 'mappedToken', 'App/page base surface.'],
    ['surface.card', '--du-bg-1', 'mappedToken', 'Readable content card surface.'],
    ['text.primary', '--du-text-1', 'mappedToken', 'Primary readable text.'],
    ['text.secondary', '--du-text-2', 'mappedToken', 'Secondary supporting copy.'],
    ['text.tertiary', '--du-text-3', 'mappedToken', 'Weak labels and tertiary metadata.'],
    ['border.subtle', '--du-border-1', 'mappedToken', 'Default divider and subtle frame.'],
    ['accent.secondary', '--du-secondary-color', 'mappedToken', 'Secondary brand accent, not the primary CTA fill.'],
    ['typography.body.family', '--style-font-body', 'styleOnlyToken', 'Body/system reading font family.'],
    ['typography.display.family', '--style-font-display', 'styleOnlyToken', 'Display or heading font family.'],
    ['shape.card.radius', '--style-card-radius', 'styleOnlyToken', 'Primary content-card radius.'],
    ['shape.control.radius', '--style-control-radius', 'styleOnlyToken', 'Action/control radius.'],
    ['elevation.card.shadow', '--style-card-shadow', 'styleOnlyToken', 'Card or lifted-surface shadow treatment.'],
    ['taxonomy.category.palette', '--style-category-palette', 'styleOnlyToken', 'Semantic category color map; do not collapse into one CTA color.']
  ]

  for (const [roleKey, tokenKey, kind, usage] of tokenRoleSpecs) {
    const role = createTokenRole(mod, tokenKey, kind, usage)
    if (role) roles[roleKey] = role
  }

  const actionRoleSpecs = [
    ['action.primary.fill', 'primaryActionFill', 'actionEvidence', 'Primary clickable action fill derived from real action nodes.'],
    ['action.active.fill', 'activeStateFill', 'actionEvidence', 'Selected/active state fill derived from interactive nodes.'],
    ['action.neutral.surface', 'neutralActionSurface', 'actionEvidence', 'Neutral white/off-white action surface for pills and ghost controls.'],
    ['action.text.border', 'actionTextBorder', 'actionEvidence', 'Action label and border color derived from computed action text/border evidence.']
  ]

  for (const [roleKey, bucket, kind, usage] of actionRoleSpecs) {
    const role = createActionRole(actionEvidence, bucket, kind, usage)
    if (role) roles[roleKey] = role
  }

  const mappedPrimary = mod.tokens?.mapped?.['--du-primary-color']
  if (!roles['action.primary.fill']) {
    const fallbackPrimaryRole = createPrimaryFallbackRole(mod)
    if (fallbackPrimaryRole) roles['action.primary.fill'] = fallbackPrimaryRole
  }

  if (mappedPrimary) {
    roles['action.primary.token'] = {
      kind: 'mappedToken',
      value: mappedPrimary.value,
      target: '--du-primary-color',
      dtcgPath: findDtcgPath('--du-primary-color', mod.tokens?.dtcg) || '',
      status: mappedPrimary.status || 'mapped',
      usage: 'Current demo-consumed CTA token; compare this with action.primary.fill to detect drift.',
      sources: ['tokens.mapped.--du-primary-color'],
      evidence: [mappedPrimary.evidence || mappedPrimary.source || mappedPrimary.reason || 'Current mapped primary action token.'].filter(Boolean)
    }
  }

  return roles
}

for (const file of files) {
  const absolute = path.resolve(process.cwd(), file)
  const mod = readJson(absolute)
  const brandDir = path.dirname(absolute)
  const actionEvidenceCandidates = [
    path.join(brandDir, 'action-evidence-score.skills.json'),
    path.join(brandDir, 'action-evidence-score.json')
  ]
  const actionEvidenceFile = actionEvidenceCandidates.find((candidate) => fs.existsSync(candidate))
  const actionEvidence = actionEvidenceFile ? readJson(actionEvidenceFile) : null

  mod.semanticRoles = deriveSemanticRoles(mod, actionEvidence)

  if (write) {
    fs.writeFileSync(absolute, `${JSON.stringify(mod, null, 2)}\n`)
    console.log(`updated semanticRoles: ${file}`)
  } else {
    console.log(JSON.stringify(mod.semanticRoles, null, 2))
  }
}
