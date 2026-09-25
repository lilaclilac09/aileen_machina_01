import { cfPutFile, isCloudflareComputerReady } from './computer/cfClient';
import { consoleNightReply, NIGHT_TTL_SECONDS, nightKey, readNight, touchNight, writeNight } from './nightDesk';
import { getVisitorRedis } from './visitorMemory';

export type SiteLane = 'night' | 'forge';

export function classifySiteLane(message: string): SiteLane | null {
  const m = message.toLowerCase();
  if (m.startsWith('run ') || m.startsWith('$') || m.includes('开电脑')) return null;
  if (m.includes('今晚') || m.includes('陪') || m.includes('night')) return 'night';
  if (
    m.includes('forge') ||
    m.includes('open a pr') ||
    m.includes('pull request') ||
    m.includes('改代码')
  ) {
    return 'forge';
  }
  return null;
}

export async function answerSiteLane(message: string, visitorId: string): Promise<string | null> {
  if (/girlfriend|boyfriend|be my (partner|therapist)|你是我(女朋友|对象|治疗师)|陪我谈恋爱/.test(message.toLowerCase())) {
    return 'Not a partner. Not a therapist. Not a girlfriend SKU. The desk is the room.';
  }
  const lane = classifySiteLane(message);
  if (lane === 'night') {
    const reply = consoleNightReply(message);
    if (reply.store) {
      const id = visitorId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32) || 'desk';
      const next = touchNight(readNight(id), message.trim().slice(0, 160), new Date().toISOString());
      writeNight(next);
      const redis = getVisitorRedis();
      if (redis) {
        await redis.set(nightKey(id), JSON.stringify(next), { ex: NIGHT_TTL_SECONDS });
      }
    }
    return reply.text;
  }
  if (lane === 'forge') return writeForgePatch(visitorId);
  return null;
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
