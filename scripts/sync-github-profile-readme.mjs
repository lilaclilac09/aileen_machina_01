#!/usr/bin/env node
/**
 * Sync docs/github-profile-README.md "Recently Updated" / "Recently Added"
 * from latest merged PRs (aileen_machina_01 + polar-lab).
 *
 * Usage:
 *   node scripts/sync-github-profile-readme.mjs
 *   node scripts/sync-github-profile-readme.mjs --dry-run
 *
 * Optional env:
 *   PROFILE_README_TOKEN — PAT with contents:write on lilaclilac09/lilaclilac09
 *                          (also push the same file to the profile repo README.md)
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const README_PATH = path.join(ROOT, 'docs', 'github-profile-README.md')
const OWNER = 'lilaclilac09'
const REPOS = {
  site: `${OWNER}/aileen_machina_01`,
  polar: `${OWNER}/polar-lab`,
}
const DRY = process.argv.includes('--dry-run')
const WINDOW_DAYS = 14
const ADDED_WINDOW_DAYS = 90

const NOISE =
  /^(chore\(social\)|chore\(memory\)|chore\(cafe|chore:|docs: prepend AGENTS|docs\(profile|docs: GitHub profile|docs: Console voice|docs\(cafe|Merge pull request|merge\(main\)|Rule:|TODO:)/i

const HAS_CJK = /[\u3040-\u30ff\u3400-\u9fff]/

function isSignalTitle(title) {
  if (!title || NOISE.test(title) || HAS_CJK.test(title)) return false
  if (/redeploy|stamp|force o6o4|mail To|no cafe@|CONTACT_TO/i.test(title)) return false
  return true
}

function sh(cmd, args, opts = {}) {
  return execFileSync(cmd, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...opts,
  }).trim()
}

function ghJson(args) {
  const out = sh('gh', ['api', ...args, '--jq', '.'])
  return JSON.parse(out || 'null')
}

function sinceIso(days) {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString()
}

function cleanTitle(title) {
  return title
    .replace(/^(feat|fix|docs|chore|refactor|editorial|security|design|post)(\([^)]*\))?:\s*/i, '')
    .replace(/^(Rule|TODO):\s*/i, '')
    .replace(/\s*\(re-apply[^)]*\)/gi, '')
    .replace(/\s*#\d+/g, '')
    .replace(/\s*[—–-]\s*list,.*/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\.$/, '')
}

function listMerged(repo, days) {
  const since = sinceIso(days)
  // search is more reliable across pagination for merged window
  const q = `repo:${repo} is:pr is:merged merged:>=${since.slice(0, 10)}`
  const data = ghJson([
    'search/issues',
    '-X',
    'GET',
    '-f',
    `q=${q}`,
    '-f',
    'per_page=30',
    '-f',
    'sort=updated',
  ])
  const items = data?.items || []
  return items
    .map((it) => ({
      number: it.number,
      title: it.title,
      mergedAt: it.closed_at,
      url: it.html_url,
    }))
    .filter((it) => it.title && isSignalTitle(it.title))
    .sort((a, b) => {
      const af = /^(feat\b|feat\()/i.test(a.title) ? 0 : 1
      const bf = /^(feat\b|feat\()/i.test(b.title) ? 0 : 1
      if (af !== bf) return af - bf
      return String(b.mergedAt).localeCompare(String(a.mergedAt))
    })
}

function classifySite(title) {
  const t = title.toLowerCase()
  if (/cafe.?cursor|cursor-cafe|credits/.test(t)) return 'cafe'
  if (/voice|console|orb|summon|prophecy|stt|tts|whisper|elevenlabs|aileena|chat.?forward|durable agent/.test(t))
    return 'console'
  if (
    /machina memory|how the site remembers|dreaming|watchlist-only rss|rss ingest/.test(
      t,
    )
  )
    return 'memory'
  return 'site'
}

function joinProse(parts, max = 4) {
  const uniq = []
  for (const p of parts) {
    const c = cleanTitle(p)
    if (!c) continue
    if (uniq.some((u) => u.toLowerCase() === c.toLowerCase())) continue
    uniq.push(c)
    if (uniq.length >= max) break
  }
  if (uniq.length === 0) return null
  if (uniq.length === 1) return uniq[0]
  if (uniq.length === 2) return `${uniq[0]}, and ${uniq[1]}`
  return `${uniq.slice(0, -1).join(', ')}, and ${uniq[uniq.length - 1]}`
}

function buildRecentlyUpdated(sitePrs, polarPrs) {
  const lines = []
  const by = { console: [], cafe: [], memory: [], site: [] }
  for (const pr of sitePrs) by[classifySite(pr.title)].push(pr.title)

  const consoleProse = joinProse(by.console)
  if (consoleProse) {
    lines.push(
      `* **[aileena.xyz](https://aileena.xyz) Console**: ${consoleProse}.`,
    )
  }

  const polarProse = joinProse(polarPrs.map((p) => p.title))
  if (polarProse) {
    lines.push(
      `* **[polar-lab](https://github.com/lilaclilac09/polar-lab)**: ${polarProse}.`,
    )
  }

  // Cafe Cursor sticky product line (user-facing copy)
  lines.push(
    `* **Cafe Cursor**: Credits distribution and user support tooling at [cursor-cafe.aileena.xyz](https://cursor-cafe.aileena.xyz).`,
  )

  const memoryProse = joinProse(by.memory, 2)
  if (memoryProse && lines.length < 4) {
    lines.push(`* **Machina memory**: ${memoryProse}.`)
  }

  return lines.slice(0, 4).join('\n')
}

function listNewRepos(days) {
  try {
    const data = ghJson([
      `search/repositories?q=user:${OWNER}+created:>=${sinceIso(days).slice(0, 10)}&sort=created&order=desc&per_page=10`,
    ])
    return (data?.items || [])
      .filter((r) => r.name !== OWNER && !r.fork)
      .filter((r) => (r.description || '').trim().length > 0 || r.name === 'polar-lab')
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
  } catch {
    return []
  }
}

function buildRecentlyAdded(sitePrs, polarPrs) {
  const lines = []
  const seen = new Set()

  const push = (line) => {
    const k = line.toLowerCase()
    if (seen.has(k)) return
    seen.add(k)
    lines.push(line)
  }

  // polar-lab is the primary "recently added" repo this season
  const polarHit =
    polarPrs.length > 0 ||
    listNewRepos(ADDED_WINDOW_DAYS).some((r) => r.name === 'polar-lab')
  if (polarHit) {
    push(
      `* **[polar-lab](https://github.com/lilaclilac09/polar-lab)**: Owned-weight post-training playground — SFT (LoRA) → DPO → RL scaffold → holdout eval → chat on \`Qwen2.5-0.5B-Instruct\`.`,
    )
  }

  const featish = [...sitePrs, ...polarPrs].filter(
    (p) =>
      /^(feat\b|feat\()/i.test(p.title) ||
      /voice-code|prophecy|summon|console orb|machina memory|how the site remembers/i.test(
        p.title,
      ),
  )

  for (const pr of featish) {
    if (lines.length >= 3) break
    const t = pr.title.toLowerCase()
    if (/voice-code|propose-only|voice-to-code|orb voice/.test(t)) {
      push(
        `* **Console voice-code**: Orb voice to DeepSeek propose-only patches without Cursor API tokens, with visitor quota and live eval gates.`,
      )
    } else if (/machina memory|how the site remembers|dreaming/.test(t)) {
      push(
        `* **Machina memory**: Site memory loop and *[How the Site Remembers](https://aileena.xyz/blog/machina-memory)* dispatch — Dreaming reports plus watchlist-only RSS ingest.`,
      )
    } else if (/console orb|voice orb/.test(t)) {
      push(
        `* **Console orb**: Voice orb surface on [aileena.xyz](https://aileena.xyz) — *[Console Orb](https://aileena.xyz/blog/console-orb)* writeup.`,
      )
    } else if (/summon|prophecy/.test(t)) {
      push(
        `* **Aileena summon + Prophecy Hall**: Voice summon pack and soft-oracle surface on the Console.`,
      )
    }
  }

  // Stable fallbacks
  if (lines.length < 3) {
    push(
      `* **Console voice-code**: Orb voice to DeepSeek propose-only patches without Cursor API tokens, with visitor quota and live eval gates.`,
    )
  }
  if (lines.length < 3) {
    push(
      `* **Machina memory**: Site memory loop and *[How the Site Remembers](https://aileena.xyz/blog/machina-memory)* dispatch — Dreaming reports plus watchlist-only RSS ingest.`,
    )
  }

  return lines.slice(0, 3).join('\n')
}

function replaceMarked(src, key, body) {
  const start = `<!-- profile:${key}:start -->`
  const end = `<!-- profile:${key}:end -->`
  if (!src.includes(start) || !src.includes(end)) {
    throw new Error(`Missing markers for ${key} in ${README_PATH}`)
  }
  const re = new RegExp(
    `${start.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${end.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
  )
  return src.replace(re, `${start}\n${body}\n${end}`)
}

function ensureMarkers(src) {
  if (src.includes('<!-- profile:recently-updated:start -->')) return src
  // Bootstrap markers around existing sections (first run)
  return src
    .replace(
      /### Recently Updated\n([\s\S]*?)\n\n### Recently Added\n/,
      '### Recently Updated\n<!-- profile:recently-updated:start -->\n$1\n<!-- profile:recently-updated:end -->\n\n### Recently Added\n',
    )
    .replace(
      /### Recently Added\n([\s\S]*?)\n\n---/,
      '### Recently Added\n<!-- profile:recently-added:start -->\n$1\n<!-- profile:recently-added:end -->\n\n---',
    )
}

function maybePushProfile(readme) {
  const token = process.env.PROFILE_README_TOKEN
  if (!token) {
    console.log('PROFILE_README_TOKEN unset — skip push to lilaclilac09/lilaclilac09')
    return
  }
  const b64 = Buffer.from(readme, 'utf8').toString('base64')
  let sha = null
  try {
    const cur = JSON.parse(
      sh(
        'gh',
        [
          'api',
          `repos/${OWNER}/${OWNER}/contents/README.md`,
          '-H',
          `Authorization: Bearer ${token}`,
        ],
        { env: { ...process.env, GH_TOKEN: token } },
      ),
    )
    sha = cur.sha
  } catch (e) {
    console.warn('Could not read profile README sha:', e.message)
  }
  const args = [
    'api',
    '-X',
    'PUT',
    `repos/${OWNER}/${OWNER}/contents/README.md`,
    '-H',
    `Authorization: Bearer ${token}`,
    '-f',
    `message=docs(readme): daily sync Recently Updated / Added [${new Date().toISOString().slice(0, 10)}]`,
    '-f',
    `content=${b64}`,
  ]
  if (sha) {
    args.push('-f', `sha=${sha}`)
  }
  sh('gh', args, { env: { ...process.env, GH_TOKEN: token } })
  console.log('Pushed README.md → lilaclilac09/lilaclilac09')
}

function main() {
  let src = fs.readFileSync(README_PATH, 'utf8')
  src = ensureMarkers(src)

  const sitePrs = listMerged(REPOS.site, WINDOW_DAYS)
  const polarPrs = listMerged(REPOS.polar, WINDOW_DAYS)
  console.log(
    `Fetched ${sitePrs.length} site + ${polarPrs.length} polar merged PRs (last ${WINDOW_DAYS}d)`,
  )

  const updated = buildRecentlyUpdated(sitePrs, polarPrs)
  const added = buildRecentlyAdded(sitePrs, polarPrs)
  let next = replaceMarked(src, 'recently-updated', updated)
  next = replaceMarked(next, 'recently-added', added)

  // Stamp
  const stamp = `<!-- profile:synced-at ${new Date().toISOString()} -->`
  next = next.replace(/<!-- profile:synced-at [^>]+ -->\n?/, '')
  next = next.replace(
    '### Recently Updated\n',
    `### Recently Updated\n${stamp}\n`,
  )

  if (DRY) {
    console.log('--- dry-run Recently Updated ---\n' + updated)
    console.log('--- dry-run Recently Added ---\n' + added)
    return
  }

  if (next === fs.readFileSync(README_PATH, 'utf8')) {
    console.log('No README changes')
  } else {
    fs.writeFileSync(README_PATH, next)
    console.log(`Wrote ${path.relative(ROOT, README_PATH)}`)
  }

  maybePushProfile(next)
}

main()
