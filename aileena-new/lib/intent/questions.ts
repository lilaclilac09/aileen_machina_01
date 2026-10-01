/** Question templates. One Jev request asks every question for the scenario. */

export type Scenario = 'customer' | 'meeting' | 'ticket';

export const SCENARIOS: readonly Scenario[] = ['customer', 'meeting', 'ticket'];

export function isScenario(value: string): value is Scenario {
  return (SCENARIOS as readonly string[]).includes(value);
}

type ChoiceQ = {
  type: 'choice';
  instructions: string;
  criteria: Record<string, string>;
};

type ScoreQ = {
  type: 'score';
  instructions: string;
  criteria: string[];
};

type NoulQ = {
  type: 'noul';
  instructions: string;
  criteria: { true: string; false: string };
};

export type Question = ChoiceQ | ScoreQ | NoulQ;

const customer: Record<string, Question> = {
  intent: {
    type: 'choice',
    instructions: 'What does this person want from us?',
    criteria: {
      purchase: 'They want to buy, subscribe, or are ready to pay.',
      inquiry: 'They are asking how something works, with no buy or complaint ask.',
      complaint: 'They are unhappy with a product or experience and want it fixed.',
      refund: 'They want money returned.',
      price_comparison: 'They are comparing a price or asking whether a price is fair.',
      chitchat: 'Greeting or small talk with no request.',
      undecided: 'The text does not support one of the other labels.',
    },
  },
  urgency: {
    type: 'score',
    instructions: 'How urgent is this message?',
    criteria: [
      '0 not urgent — no time pressure',
      '1 low — can wait',
      '2 urgent — wants a response soon',
      '3 very urgent — immediate harm, a deadline, or repeated escalation',
    ],
  },
  needs_human: {
    type: 'noul',
    instructions: 'Should a human take this, rather than an automatic reply?',
    criteria: {
      true: 'A person should take it: money, anger, policy, or ambiguity a template cannot close.',
      false: 'A stock reply or a ticket is enough.',
    },
  },
  next_action: {
    type: 'choice',
    instructions: 'Which single next step fits this message?',
    criteria: {
      auto_reply: 'A prepared reply answers it.',
      create_ticket: 'It should be tracked, and does not need a person right now.',
      escalate_human: 'A person should take it now.',
      follow_up: 'Someone should come back to it, but not as an emergency.',
      undecided: 'The text does not support one of the other steps.',
    },
  },
};

const meeting: Record<string, Question> = {
  stance: {
    type: 'choice',
    instructions: 'What stance does this text take on the proposal?',
    criteria: {
      support: 'They are for the proposal.',
      skeptical: 'They are not against it, but they are not convinced.',
      oppose: 'They are against the proposal.',
      undecided: 'The text does not support support, skeptical, or oppose.',
    },
  },
  resistance: {
    type: 'score',
    instructions: 'How strong is the resistance in this text?',
    criteria: [
      '0 no resistance',
      '1 mild questions or hesitation',
      '2 clear pushback',
      '3 strongly opposed',
    ],
  },
  wants_revision: {
    type: 'noul',
    instructions: 'Is a substantive revision being requested?',
    criteria: {
      true: 'They want the substance changed, not a wording tweak.',
      false: 'They are not asking for a substantive revision.',
    },
  },
  next_action: {
    type: 'choice',
    instructions: 'Which single next step fits this read of the room?',
    criteria: {
      approve: 'Proceed as proposed.',
      revise: 'Change the proposal and bring it back.',
      shelve: 'Do not proceed now.',
      escalate: 'Someone with more authority should decide.',
      undecided: 'The text does not support one of the other steps.',
    },
  },
};

const ticket: Record<string, Question> = {
  department: {
    type: 'choice',
    instructions: 'Which team should handle this ticket?',
    criteria: {
      billing: 'Payment, invoice, refund, or plan charges.',
      technical: 'A bug, outage, or how the product behaves.',
      sales: 'A new purchase, upgrade, or commercial question.',
      undecided: 'The text does not support billing, technical, or sales.',
    },
  },
  is_urgent: {
    type: 'noul',
    instructions: 'Is this ticket urgent?',
    criteria: {
      true: 'There is a deadline, an outage, or someone is blocked now.',
      false: 'It can wait for the normal queue.',
    },
  },
};

const BY_SCENARIO: Record<Scenario, Record<string, Question>> = {
  customer,
  meeting,
  ticket,
};

export function questionsFor(scenario: Scenario): Record<string, Question> {
  return BY_SCENARIO[scenario];
}
