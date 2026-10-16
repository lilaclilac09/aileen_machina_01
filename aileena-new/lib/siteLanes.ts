import { collegeReply } from './collegeCite';
import { cfPutFile, isCloudflareComputerReady } from './computer/cfClient';

export type SiteLane = 'forge';

export function classifySiteLane(message: string): SiteLane | null {
  const m = message.toLowerCase();
  if (m.startsWith('run ') || m.startsWith('$') || m.includes('开电脑')) return null;
  // Forge writes a file on the Cloudflare desk, so it fires only when the visitor
  // names it. Questions that merely mention a pull request are for the model.
  if (/\bforge\b/.test(m) || m.includes('改代码')) return 'forge';
  return null;
}

export async function answerSiteLane(message: string, visitorId: string): Promise<string | null> {
  if (/girlfriend|boyfriend|be my (partner|therapist)|你是我(女朋友|对象|治疗师)|陪我谈恋爱/.test(message.toLowerCase())) {
    return 'Not a partner. Not a therapist. Not a girlfriend SKU. The desk is the room.';
  }
  const lane = classifySiteLane(message);
  if (lane === 'forge') return writeForgePatch(visitorId);
  return collegeReply(message);
}

async function writeForgePatch(visitorId: string): Promise<string> {
  const branch = 'agent/turn';
  const body = [
    `# ${branch}`,
    '',
    'Human merges. Forge does not push main and does not deploy.',
    '',
  ].join('\n');
  if (!isCloudflareComputerReady()) {
    return 'Forge needs the Cloudflare desk. No host shell. No push to main. No deploy.';
  }
  try {
    await cfPutFile('/workspace/scratch/PATCH.md', body, visitorId);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'write failed';
    return `Forge stopped: ${message}. No push to main. No deploy.`;
  }
  return `Forge wrote /workspace/scratch/PATCH.md. Branch ${branch}. No push to main. No deploy.`;
}
