import { isScenario, questionsFor, type Scenario } from './questions';
import { suggestedAction, type AnswerMap } from './thresholds';

const JEV_URL = 'https://api.typesafe.ai/v1/systemone';
const MAX_TEXT = 8000;
const RETRY_STATUSES = new Set([429, 529]);

export class IntentError extends Error {
  constructor(
    public code: string,
    public status: number,
  ) {
    super(code);
  }
}

export type AnalyzeResult = {
  answers: AnswerMap;
  suggested_action: string;
};

type JevPayload = {
  answers?: AnswerMap;
};

export type JevCaller = (body: {
  state: string;
  model: 'jev-latest';
  questions: ReturnType<typeof questionsFor>;
}) => Promise<JevPayload>;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function publicMessage(code: string): string {
  switch (code) {
    case 'bad_scenario':
      return 'scenario must be customer, meeting, or ticket';
    case 'empty_text':
      return 'text is empty';
    case 'text_too_long':
      return 'text is too long';
    case 'invalid_json':
      return 'body must be JSON';
    case 'missing_key':
      return 'TYPESAFE_API_KEY is not set';
    case 'bad_key':
      return 'Jev rejected the key';
    case 'bad_body':
      return 'Jev rejected the question body';
    case 'busy':
      return 'Jev is busy';
    case 'unreachable':
      return 'Jev is unreachable';
    default:
      return 'Jev returned an unexpected body';
  }
}

/** Server-side Jev call. The key never leaves this process. */
export async function callJev(body: {
  state: string;
  model: 'jev-latest';
  questions: ReturnType<typeof questionsFor>;
}): Promise<JevPayload> {
  const key = process.env.TYPESAFE_API_KEY;
  if (!key) throw new IntentError('missing_key', 503);

  let delay = 250;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    let res: Response;
    try {
      res = await fetch(JEV_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    } catch {
      throw new IntentError('unreachable', 502);
    }

    if (res.ok) {
      const parsed: unknown = await res.json().catch(() => null);
      if (!parsed || typeof parsed !== 'object') throw new IntentError('bad_upstream', 502);
      return parsed as JevPayload;
    }

    await res.text().catch(() => '');
    if (RETRY_STATUSES.has(res.status) && attempt < 3) {
      await sleep(delay);
      delay *= 2;
      continue;
    }
    if (res.status === 401) throw new IntentError('bad_key', 401);
    if (res.status === 422) throw new IntentError('bad_body', 422);
    if (res.status === 429 || res.status === 529) throw new IntentError('busy', 503);
    throw new IntentError('bad_upstream', 502);
  }

  throw new IntentError('busy', 503);
}

export async function analyzeIntent(
  scenarioRaw: string,
  text: string,
  call: JevCaller = callJev,
): Promise<AnalyzeResult> {
  if (!isScenario(scenarioRaw)) throw new IntentError('bad_scenario', 400);
  const scenario: Scenario = scenarioRaw;
  const trimmed = text.trim();
  if (!trimmed) throw new IntentError('empty_text', 400);
  if (trimmed.length > MAX_TEXT) throw new IntentError('text_too_long', 400);

  const jev = await call({
    state: trimmed,
    model: 'jev-latest',
    questions: questionsFor(scenario),
  });
  const answers = jev.answers;
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    throw new IntentError('bad_upstream', 502);
  }

  return {
    answers,
    suggested_action: suggestedAction(scenario, answers),
  };
}
