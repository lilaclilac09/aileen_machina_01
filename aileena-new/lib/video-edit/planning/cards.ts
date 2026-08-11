import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ProjectManifest } from '../domain/types';

export function writeTitleCard(outPath: string, project: ProjectManifest): void {
  const { accent, bg, fg } = project.brand;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="100%" stop-color="#16302e"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#g)"/>
  <text x="960" y="470" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
        font-size="72" fill="${accent}" letter-spacing="8">${escapeXml(project.title.toUpperCase())}</text>
  <text x="960" y="560" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
        font-size="42" fill="${fg}">${escapeXml(formatDate(project.date))}</text>
  <text x="960" y="640" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
        font-size="28" fill="rgba(255,253,248,0.55)">${escapeXml(project.subtitle)}</text>
</svg>`;
  mkdirSync(join(outPath, '..'), { recursive: true });
  writeFileSync(outPath, svg);
}

export function writeOutroCard(outPath: string, project: ProjectManifest): void {
  const { accent, bg, fg } = project.brand;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <rect width="1920" height="1080" fill="${bg}"/>
  <text x="960" y="460" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
        font-size="48" fill="${fg}">Thanks — see you next time</text>
  <text x="960" y="550" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
        font-size="36" fill="${accent}">${escapeXml(project.hashtag)}</text>
  <text x="960" y="630" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
        font-size="26" fill="rgba(255,253,248,0.5)">${escapeXml(project.url)}</text>
</svg>`;
  mkdirSync(join(outPath, '..'), { recursive: true });
  writeFileSync(outPath, svg);
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDate(iso: string): string {
  // 2026-07-19 → 2026.07.19
  return iso.replace(/-/g, '.');
}
