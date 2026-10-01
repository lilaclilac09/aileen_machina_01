/**
 * Intent Aggregator — thresholds, question ids, and the Jev request shape.
 * Does not call api.typesafe.ai.
 */
import { analyzeIntent, IntentError } from '../lib/intent/analyze';
import { questionsFor } from '../lib/intent/questions';
import { suggestedAction } from '../lib/intent/thresholds';

function assert(name: string, ok: boolean, detail = '') {
  if (!ok) throw new Error(`FAIL ${name}${detail ? ` ${detail}` : ''}`);
  console.log(`PASS ${name}`);
}

const customerIds = Object.keys(questionsFor('customer')).sort();
assert(
  'customer asks intent, urgency, needs_human, next_action',
  customerIds.join() === 'intent,needs_human,next_action,urgency',
);
assert(
  'meeting asks stance, resistance, wants_revision, next_action',
  Object.keys(questionsFor('meeting')).sort().join() === 'next_action,resistance,stance,wants_revision',
);
assert(
  'ticket asks department and is_urgent',
  Object.keys(questionsFor('ticket')).sort().join() === 'department,is_urgent',
);

const refundNow = {
  intent: { type: 'choice', choice: 'refund', confidence: 0.9 },
  urgency: { type: 'score', score: 2.4 },
  needs_human: { type: 'noul', noul: 0.4 },
  next_action: { type: 'choice', choice: 'auto_reply', confidence: 0.99 },
};
assert(
  'urgent refund escalates even if the model says auto_reply',
  suggestedAction('customer', refundNow) === 'escalate_human',
);

assert(
  'high needs_human escalates',
  suggestedAction('customer', {
    ...refundNow,
    needs_human: { type: 'noul', noul: 0.71 },
    urgency: { type: 'score', score: 0 },
    intent: { type: 'choice', choice: 'inquiry', confidence: 0.9 },
  }) === 'escalate_human',
);

assert(
  'calm inquiry auto-replies',
  suggestedAction('customer', {
    intent: { type: 'choice', choice: 'inquiry', confidence: 0.8 },
    urgency: { type: 'score', score: 0.2 },
    needs_human: { type: 'noul', noul: 0.1 },
  }) === 'auto_reply',
);

assert(
  'low confidence intent is follow_up',
  suggestedAction('customer', {
    intent: { type: 'choice', choice: 'inquiry', confidence: 0.4 },
    urgency: { type: 'score', score: 0 },
    needs_human: { type: 'noul', noul: 0.1 },
  }) === 'follow_up',
);

assert(
  'opposed high resistance escalates the meeting',
  suggestedAction('meeting', {
    stance: { type: 'choice', choice: 'oppose', confidence: 0.88 },
    resistance: { type: 'score', score: 2.2 },
    wants_revision: { type: 'noul', noul: 0.2 },
    next_action: { type: 'choice', choice: 'approve', confidence: 0.9 },
  }) === 'escalate',
);

assert(
  'supported quiet meeting approves',
  suggestedAction('meeting', {
    stance: { type: 'choice', choice: 'support', confidence: 0.9 },
    resistance: { type: 'score', score: 0.2 },
    wants_revision: { type: 'noul', noul: 0.1 },
  }) === 'approve',
);

assert(
  'urgent billing ticket is urgent_billing',
  suggestedAction('ticket', {
    department: { type: 'choice', choice: 'billing', confidence: 0.88 },
    is_urgent: { type: 'noul', noul: 0.95 },
  }) === 'urgent_billing',
);

assert(
  'unsure department holds',
  suggestedAction('ticket', {
    department: { type: 'choice', choice: 'billing', confidence: 0.2 },
    is_urgent: { type: 'noul', noul: 0.95 },
  }) === 'hold',
);

async function main() {
  let called = false;
  try {
    await analyzeIntent('', 'hello', async () => {
      called = true;
      return { answers: {} };
    });
    assert('empty scenario throws', false);
  } catch (error) {
    assert(
      'empty scenario is 400 and does not call Jev',
      error instanceof IntentError && error.status === 400 && !called,
    );
  }

  const seen = await analyzeIntent('customer', '  refund today  ', async (body) => {
    assert('state is trimmed text', body.state === 'refund today');
    assert('model is jev-latest', body.model === 'jev-latest');
    assert('one request contains every customer question', Object.keys(body.questions).length === 4);
    return {
      answers: {
        intent: { type: 'choice', choice: 'refund', confidence: 0.91, probabilities: { refund: 0.91 } },
        urgency: { type: 'score', score: 1, confidence: 0.8 },
        needs_human: { type: 'noul', noul: 0.2 },
        next_action: { type: 'choice', choice: 'auto_reply', confidence: 0.7 },
      },
    };
  });
  assert('analyze returns code action create_ticket', seen.suggested_action === 'create_ticket');
  assert('analyze keeps the upstream answer object', seen.answers.intent != null);

  console.log('verify-intent ok');
}

main();
