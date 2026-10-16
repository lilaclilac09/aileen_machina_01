import { crisisReply } from './agentGuard/locale';

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

/**
 * A CV / work question about Aileen ("她现在的工作是什么？", "what does she do for work")
 * is for the site agent, not a life door, even though it contains 工作.
 */
export function isQuestionAboutAileen(raw: string): boolean {
  const aboutHer = /她|aileena?|\bher\b|\bshe\b|\bsie\b|\bihre?\b/i.test(raw);
  const cv = /工作|职位|職位|做什么|在做|公司|项目|項目|经历|經歷|简历|履历|job|role|work|career|employ|hire|arbeit|beruf|stelle/i.test(raw);
  return aboutHer && cv;
}

/** Psychoeducation desk. One book. Not a diagnosis. Null means this sentence is not a life door. */
export function collegeReply(message: string): string | null {
  const raw = message.trim();
  if (!raw) return null;
  // Crisis first, in the visitor's language (ZH / DE / EN lines, numbers in lib/agentGuard/locale.ts).
  const crisis = crisisReply(raw);
  if (crisis) return crisis;
  if (/更新了什么|hire|solana|techno|音乐|github|what's her|作品/.test(raw.toLowerCase())) return null;
  if (isQuestionAboutAileen(raw)) return null;
  const card = SHELF.find((item) => item.test.test(raw));
  if (!card) return null;
  const heard = raw.slice(0, 80);
  const practice = /怎么办|how do i|what do i do/.test(raw.toLowerCase()) ? card.practice : '';
  return [
    `${heard}。这两件事可以同时是真的。`,
    `${card.person}在《${card.book}》里把这叫做${card.called}。用在你这句话上，是你说的处境，不是你的故障。这不是诊断。`,
    practice,
    '要门、要书，还是只要坐着？',
  ]
    .filter(Boolean)
    .join('\n');
}
