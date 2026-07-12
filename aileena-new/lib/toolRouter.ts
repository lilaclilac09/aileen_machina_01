/**
 * ReAct R2 — question-type → allowed tools (rule router).
 *
 * Effect: the model only *sees* / can successfully call the right tools
 * for this turn, so music questions don't hit queryChip, hire skips tools,
 * Centaur forces articles/research, etc.
 */

import {
  chooseVisitorStance,
  inferVisitorIntents,
  type VisitorIntent,
  type VisitorSoftMemory,
} from './visitorMemory';

export const ALL_AGENT_TOOLS = [
  'searchMemories',
  'searchArticles',
  'queryChip',
  'listChips',
  'compareChips',
  'latestPrice',
  'priceHistory',
  'latestNews',
  'searchNews',
  'searchEarnings',
  'searchResearch',
  'searchDocs',
] as const;

export type AgentToolName = (typeof ALL_AGENT_TOOLS)[number];

export type ToolRoute = {
  route: string;
  allowed: AgentToolName[] | 'all' | 'none';
  preferred: AgentToolName[];
  reason: string;
  /** Extra system lines for this turn */
  hint: string;
};

const MEMORY_TOOLS: AgentToolName[] = ['searchMemories'];
const ARTICLE_TOOLS: AgentToolName[] = ['searchArticles'];
const DOC_TOOLS: AgentToolName[] = ['searchResearch', 'searchDocs', 'searchEarnings'];
const CHIP_TOOLS: AgentToolName[] = [
  'queryChip',
  'listChips',
  'compareChips',
  'latestPrice',
  'priceHistory',
];
const NEWS_TOOLS: AgentToolName[] = ['latestNews', 'searchNews'];
const TECH_TOOLS: AgentToolName[] = [...CHIP_TOOLS, ...NEWS_TOOLS, ...DOC_TOOLS, ...ARTICLE_TOOLS];

function uniq(names: AgentToolName[]): AgentToolName[] {
  return [...new Set(names)];
}

function emptySoft(): VisitorSoftMemory {
  return { questions: [], topics: [], updatedAt: '', hitCount: 0 };
}

/** Named-entity / topic hard routes (checked before soft intents). */
function hardRoute(q: string): ToolRoute | null {
  const t = q.toLowerCase();

  // Hire / CV / contact — answer from static prompt only.
  if (
    /\b(hire|hiring|available|availability|retain|freelance|rate|rates|contact|email|cv|resume|work with|work together)\b|合作|招人|档期|简历/.test(
      t,
    )
  ) {
    return {
      route: 'hire_cv',
      allowed: 'none',
      preferred: [],
      reason: 'hire/CV/contact — static prompt only',
      hint: 'No tools this turn. Answer from the static CV / contact context. Do not call searchMemories or chip tools.',
    };
  }

  // Centaur = Paradigm/Tempo agent runtime — never invent from training.
  if (/\bcentaur\b/.test(t)) {
    return {
      route: 'centaur',
      allowed: uniq([...ARTICLE_TOOLS, ...DOC_TOOLS]),
      preferred: ['searchResearch', 'searchArticles'],
      reason: 'Centaur → articles + research first',
      hint: 'Required: call searchResearch("Centaur") and searchArticles("Centaur") before answering. It is the Paradigm + Tempo agent runtime — not a Solana validator.',
    };
  }

  // Taste / music / shelf / painters — memories only (optional articles later via 'all' default).
  if (
    /\b(music|dj(\s|-)set|techno|setlist|daydream|hockney|didion|podcast|documentary|listening shelf|what does she like|her taste)\b|音乐|品味|曲库|纪录片|画家/.test(
      t,
    )
  ) {
    return {
      route: 'taste',
      allowed: uniq([...MEMORY_TOOLS, ...ARTICLE_TOOLS]),
      preferred: ['searchMemories'],
      reason: 'taste/culture → searchMemories first',
      hint: 'Prefer searchMemories for taste/music/culture. Do not call queryChip / pricing / news for this question.',
    };
  }

  // Faith / belief — memories (+ articles for essay backing).
  if (/\b(faith|belief|believe|trust|religion|spiritual)\b|信仰|信念|信什么/.test(t)) {
    return {
      route: 'faith',
      allowed: uniq([...MEMORY_TOOLS, ...ARTICLE_TOOLS]),
      preferred: ['searchMemories'],
      reason: 'faith → faith-from-essays via searchMemories',
      hint: 'Call searchMemories with query "faith" or "belief". Do not invent a religion. Optional: searchArticles for harassment / third-culture backing.',
    };
  }

  // False-belief pierce topics — essays.
  if (
    /\b(senior(ity)? (will |can )?protect|if i (just )?get senior|leap of faith)\b|资历.*(保护|没事)/.test(t)
  ) {
    return {
      route: 'false_belief',
      allowed: uniq([...MEMORY_TOOLS, ...ARTICLE_TOOLS]),
      preferred: ['searchMemories', 'searchArticles'],
      reason: 'comforting myth → essays / faith memory',
      hint: 'Soft pierce once using searchMemories("faith") and/or searchArticles("harassment" / seniority). Then help. No chip tools.',
    };
  }

  // Chip / price / vendor hardware.
  if (
    /\b(h100|h200|b200|mi300|gb200|rubin|hbm|gpu|chip|sku|nvidia|amd|broadcom|price|pricing|msrp|tflops)\b|芯片|算力|报价/.test(
      t,
    )
  ) {
    return {
      route: 'chips',
      allowed: uniq([...CHIP_TOOLS, ...NEWS_TOOLS, ...DOC_TOOLS]),
      preferred: ['queryChip', 'latestPrice'],
      reason: 'hardware/pricing → data tools',
      hint: 'Use queryChip / latestPrice / listChips. Do not use searchMemories for SKU specs.',
    };
  }

  // Blog article content questions.
  if (
    /\b(article|essay|wrote|writing|blog|dispatch|what does (her|she) say|pcb|mev|validator|harassment|#metoo)\b|文章|她写/.test(
      t,
    )
  ) {
    return {
      route: 'articles',
      allowed: uniq([...ARTICLE_TOOLS, ...DOC_TOOLS, ...MEMORY_TOOLS]),
      preferred: ['searchArticles'],
      reason: 'article content → searchArticles',
      hint: 'Prefer searchArticles for published writing. Use searchMemories only for taste/faith shelf facts.',
    };
  }

  return null;
}

/**
 * Pick allowed tools for this user question.
 * Hard lexical routes win; else soft intents; else all tools.
 */
export function routeToolsForQuestion(
  lastQuestion: string,
  soft: VisitorSoftMemory = emptySoft(),
  clientPriorTopics: string[] = [],
): ToolRoute {
  const hard = hardRoute(lastQuestion);
  if (hard) return hard;

  const intents = inferVisitorIntents(lastQuestion, soft, clientPriorTopics);
  const stance = chooseVisitorStance(lastQuestion, soft, clientPriorTopics);

  if (intents.includes('hire')) {
    return {
      route: 'hire_cv',
      allowed: 'none',
      preferred: [],
      reason: 'intent:hire',
      hint: 'No tools. Answer hire/availability from static context only.',
    };
  }

  if (intents.includes('taste') || intents.includes('faith')) {
    return {
      route: intents.includes('faith') ? 'faith' : 'taste',
      allowed: uniq([...MEMORY_TOOLS, ...ARTICLE_TOOLS]),
      preferred: ['searchMemories'],
      reason: `intent:${intents.filter((i) => i === 'taste' || i === 'faith').join('+')}`,
      hint: 'Prefer searchMemories. Chip/price/news tools are out of scope this turn.',
    };
  }

  if (intents.includes('tech')) {
    return {
      route: 'tech',
      allowed: uniq(TECH_TOOLS),
      preferred: ['queryChip', 'searchArticles', 'searchNews'],
      reason: 'intent:tech',
      hint: 'Use data + article tools. searchMemories only if they also ask taste.',
    };
  }

  if (stance.stance === 'pierce') {
    return {
      route: 'pierce',
      allowed: uniq([...MEMORY_TOOLS, ...ARTICLE_TOOLS]),
      preferred: ['searchMemories', 'searchArticles'],
      reason: 'stance:pierce',
      hint: 'Soft pierce with essay/memory evidence, then help. No chip tools.',
    };
  }

  return {
    route: 'default',
    allowed: 'all',
    preferred: [],
    reason: 'open — all tools',
    hint: 'Pick the narrowest tool. Taste → searchMemories; articles → searchArticles; chips → queryChip.',
  };
}

export function isToolAllowed(route: ToolRoute, toolName: string): boolean {
  if (route.allowed === 'all') return true;
  if (route.allowed === 'none') return false;
  return route.allowed.includes(toolName as AgentToolName);
}

export function formatToolRouteForPrompt(route: ToolRoute): string {
  const allowedLine =
    route.allowed === 'all'
      ? 'Allowed tools: all'
      : route.allowed === 'none'
        ? 'Allowed tools: none (answer from static context)'
        : `Allowed tools: ${route.allowed.join(', ')}`;
  const preferredLine =
    route.preferred.length > 0 ? `Preferred first: ${route.preferred.join(', ')}.` : '';

  return `

# Tool route (R2 — this turn)
Route: **${route.route}** — ${route.reason}
${allowedLine}. ${preferredLine}
${route.hint}
If a tool returns blocked:true with reason wrong_route — switch to an allowed tool; do not invent data.`;
}

type AnyTool = {
  execute?: (...args: never[]) => unknown;
  [key: string]: unknown;
};

/**
 * Drop disallowed tools (hire → empty), or wrap so wrong-route calls
 * return a blocked observation instead of running.
 */
export function applyToolRoute<T extends Record<string, AnyTool>>(
  tools: T,
  route: ToolRoute,
): T {
  if (route.allowed === 'all') return tools;

  if (route.allowed === 'none') {
    return {} as T;
  }

  const allowed = new Set(route.allowed);
  const out: Record<string, AnyTool> = {};

  for (const [name, t] of Object.entries(tools)) {
    if (!allowed.has(name as AgentToolName)) continue;
    out[name] = t;
  }

  // Also keep a stub for common wrong tools? Better: only expose allowed —
  // model can't call what it doesn't see. Strongest R2 effect.
  return out as T;
}

/** For tests / audit: list what would be stripped. */
export function toolsBlockedByRoute(route: ToolRoute): AgentToolName[] {
  if (route.allowed === 'all') return [];
  if (route.allowed === 'none') return [...ALL_AGENT_TOOLS];
  const allow = new Set(route.allowed);
  return ALL_AGENT_TOOLS.filter((t) => !allow.has(t));
}
