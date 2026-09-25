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
  if (/suicid|kill myself|不想活|自杀|想死/.test(message.toLowerCase())) {
    return '这桌还在。你现在的怕和痛我听见了。若有危险，美国请打或发短信 988。IASP https://www.iasp.info/suicidalthoughts/ 。不给方法。Herman 的安全停在这里。';
  }
  const cited = citeOneBook(message);
  return cited;
}

type ShelfCard = {
  test: RegExp;
  person: string;
  book: string;
  called: string;
  practice: string;
};

const SHELF: ShelfCard[] = [
  {
    test: /焦虑|担心|睡不着|panic|anxious/,
    person: 'Steven C. Hayes',
    book: 'Get Out of Your Mind and Into Your Life',
    called: '焦虑当天气，不与天气搏斗',
    practice: '未决清单写三项，写完合上。',
  },
  {
    test: /外貌|镜子|胖|脸|body image/,
    person: 'Thomas Cash',
    book: '身体意象工作',
    called: '镜子可以改成描述性观看',
    practice: '镜子只描述颜色和形状，不判决。',
  },
  {
    test: /吵架|冲突|蔑视|冷暴力|fight/,
    person: 'John Gottman',
    book: '四骑士',
    called: '批评、蔑视、防御、石墙。用来看见，不预测离婚',
    practice: '先离开现场。安全优先。',
  },
  {
    test: /原生|父母|家里|过年/,
    person: 'Murray Bowen',
    book: '家庭分化',
    called: '在亲密里仍能想',
    practice: '分化句：我爱你们，周五四点走。',
  },
  {
    test: /钱|工作|加班|应该/,
    person: 'Judith Beck',
    book: 'Cognitive Behavior Therapy: Basics and Beyond',
    called: '念头不等于事实。「应该」可以单独拿出来看',
    practice: '三栏：发生了什么 / 我的自动念头 / 另一个解释。',
  },
  {
    test: /房间|句子|处境|耗/,
    person: 'Simone de Beauvoir',
    book: 'The Second Sex',
    called: '处境不是天性',
    practice: '要门、要书，还是只要坐着。',
  },
];

function citeOneBook(message: string): string | null {
  if (/更新了什么|hire|solana|techno|音乐|github|what's her|作品/.test(message.toLowerCase())) return null;
  const card = SHELF.find((item) => item.test.test(message));
  if (!card) return null;
  const heard = message.trim().slice(0, 80);
  const practice = /怎么办|how do i|what do i do/.test(message.toLowerCase()) ? card.practice : '';
  return [
    `${heard}。这两件事可以同时是真的。`,
    `${card.person}在《${card.book}》里把这叫做${card.called}。用在你这句话上，是你说的处境，不是你的故障。这不是诊断。`,
    practice,
    '要门、要书，还是只要坐着？',
  ]
    .filter(Boolean)
    .join('\n');
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
