import { readFileSync, existsSync } from 'node:fs';
import { basename } from 'node:path';
import type { SkillPatch } from '../types';
import { serializeSkillMarkdown } from './parseSkill';

function heading(src: string, name: string): string {
  const re = new RegExp(`## ${name}\\n([\\s\\S]*?)(?=\\n## |$)`, 'i');
  return src.match(re)?.[1]?.trim() ?? '';
}

/** Lesson markdown → staging SKILL.md. Does not write AGENTS.md. */
export function lessonToSkill(src: string, filename = 'lesson.md'): SkillPatch {
  const trigger = heading(src, 'trigger');
  const root = heading(src, 'root cause');
  const future = heading(src, 'future instruction');
  const slug = basename(filename)
    .replace(/\.md$/, '')
    .replace(/^\d{4}-\d{2}-\d{2}-/, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .slice(0, 48) || 'lesson';
  const words = `${trigger} ${root}`
    .toLowerCase()
    .split(/[^a-z0-9\u4e00-\u9fff]+/)
    .filter((w) => w.length > 3)
    .slice(0, 10);
  return {
    id: `lesson-${slug}`,
    version: 1,
    kind: 'maintainer',
    parent: null,
    triggers: [...new Set(words)],
    mustInclude: [],
    mustNot: [],
    replyGuidance: future || 'Reproduce, then patch the confirmed root cause only.',
    rootCause: root || trigger || 'lesson',
    body: src,
  };
}

export function lessonFileToSkill(path: string): SkillPatch {
  if (!existsSync(path)) throw new Error(`lesson not found: ${path}`);
  return lessonToSkill(readFileSync(path, 'utf8'), path);
}

export function stagingMarkdownFromLesson(path: string): string {
  return serializeSkillMarkdown(lessonFileToSkill(path));
}
