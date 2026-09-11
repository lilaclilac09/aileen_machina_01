import type { SkillKind, SkillPatch } from '../types';
import { SKILL_KINDS } from '../types';

function parseList(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '[]' || trimmed === 'null') return [];
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed
      .slice(1, -1)
      .split(',')
      .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean);
  }
  return trimmed
    .split('\n')
    .map((line) => line.replace(/^\s*-\s*/, '').trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
}

function parseScalar(raw: string): string {
  return raw
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .replace(/\\"/g, '"');
}

/**
 * Restricted SKILL.md frontmatter. Not a general YAML parser.
 * Required keys: id, version, kind, triggers, reply_guidance
 */
export function parseSkillMarkdown(src: string): SkillPatch {
  const match = src.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error('SKILL.md must start with YAML frontmatter');
  const fm = match[1];
  const body = match[2].trim();
  const fields: Record<string, string> = {};
  let current: string | null = null;
  let buf: string[] = [];
  const flush = () => {
    if (current) fields[current] = buf.join('\n').trim();
    current = null;
    buf = [];
  };
  for (const line of fm.split('\n')) {
    const kv = line.match(/^([a-z_]+):\s*(.*)$/);
    if (kv && !line.startsWith(' ')) {
      flush();
      current = kv[1];
      buf = [kv[2]];
    } else if (current) {
      buf.push(line);
    }
  }
  flush();

  const id = parseScalar(fields.id ?? '');
  const version = Number(parseScalar(fields.version ?? ''));
  const kind = parseScalar(fields.kind ?? 'site-agent') as SkillKind;
  if (!id) throw new Error('SKILL.md missing id');
  if (!Number.isInteger(version) || version < 1) throw new Error(`SKILL.md bad version: ${fields.version}`);
  if (!SKILL_KINDS.includes(kind)) throw new Error(`SKILL.md bad kind: ${kind}`);

  const parentRaw = parseScalar(fields.parent ?? 'null');
  const parent = parentRaw === 'null' || parentRaw === '' ? null : Number(parentRaw);

  return {
    id,
    version,
    kind,
    parent: Number.isFinite(parent) ? parent : null,
    triggers: parseList(fields.triggers ?? ''),
    mustInclude: parseList(fields.must_include ?? ''),
    mustNot: parseList(fields.must_not ?? ''),
    replyGuidance: parseScalar(fields.reply_guidance ?? ''),
    body,
    rootCause: parseScalar(fields.root_cause ?? ''),
  };
}

export function serializeSkillMarkdown(skill: SkillPatch): string {
  const list = (xs: string[]) =>
    xs.length === 0 ? '[]' : `\n${xs.map((x) => `  - ${JSON.stringify(x)}`).join('\n')}`;
  return `---
id: ${skill.id}
version: ${skill.version}
kind: ${skill.kind}
parent: ${skill.parent === null ? 'null' : skill.parent}
triggers:${list(skill.triggers)}
must_include:${list(skill.mustInclude)}
must_not:${list(skill.mustNot)}
reply_guidance: ${JSON.stringify(skill.replyGuidance)}
root_cause: ${JSON.stringify(skill.rootCause)}
---

${skill.body.trim()}
`;
}
