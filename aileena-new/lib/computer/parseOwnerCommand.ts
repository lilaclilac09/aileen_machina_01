import type { ComputerTaskType } from './types';

export type OwnerComputerCommand =
  | { kind: 'show_queue' }
  | { kind: 'log_issue'; title: string }
  | { kind: 'propose_fix'; route: string; instructions: string }
  | { kind: 'approve'; id: string }
  | { kind: 'reject'; id: string }
  | { kind: 'prepare_pr'; id: string }
  | { kind: 'clarify'; question: string }
  | { kind: 'blocked'; message: string }
  | { kind: 'learn'; alias: string; expands: string }
  | {
      kind: 'queue_task';
      taskType: ComputerTaskType;
      route: string;
      instructions: string;
    };

/**
 * Owner-only site-agent commands. Visitors never match this into a computer
 * task — the chat route still requires an owner session.
 * Deliberately narrow so ordinary questions do not start the computer.
 */
export function parseOwnerComputerCommand(text: string): OwnerComputerCommand | null {
  const raw = text.trim();
  if (!raw || raw.length > 2000) return null;

  if (/^show proof queue\s*$/i.test(raw)) return { kind: 'show_queue' };

  const learn = /^learn:\s*(.+?)\s*=\s*(.+)$/i.exec(raw);
  if (learn) {
    return { kind: 'learn', alias: learn[1].trim().slice(0, 40), expands: learn[2].trim().slice(0, 200) };
  }

  const log = /^log issue:\s*(.+)$/i.exec(raw);
  if (log) return { kind: 'log_issue', title: log[1].trim().slice(0, 200) };

  const propose = /^propose fix for\s+(\/\S+):\s*(.+)$/i.exec(raw);
  if (propose) {
    return {
      kind: 'propose_fix',
      route: normalizeRoute(propose[1]),
      instructions: propose[2].trim().slice(0, 4000),
    };
  }

  const approve = /^approve proposal\s+(\S+)\s*$/i.exec(raw);
  if (approve) return { kind: 'approve', id: approve[1] };

  const reject = /^reject proposal\s+(\S+)\s*$/i.exec(raw);
  if (reject) return { kind: 'reject', id: reject[1] };

  const prepPr = /^prepare pr for\s+(\S+)\s*$/i.exec(raw);
  if (prepPr) return { kind: 'prepare_pr', id: prepPr[1] };

  if (
    /find(?: me)?(?: the)? commit/i.test(raw) ||
    /where I merged/i.test(raw) ||
    /merged Sound Lab/i.test(raw)
  ) {
    return {
      kind: 'queue_task',
      taskType: 'git_find_commit',
      route: '/sound',
      instructions: raw.slice(0, 400),
    };
  }

  if (/recent sound commits/i.test(raw)) {
    return {
      kind: 'queue_task',
      taskType: 'git_log',
      route: '/sound',
      instructions: 'path:aileena-new/components/DJStation.tsx grep:sound',
    };
  }

  if (/^git status\s*$/i.test(raw)) {
    return { kind: 'queue_task', taskType: 'git_status', route: '/proof', instructions: 'git status --short' };
  }

  const openFile = /open(?: the)?\s+(\/\S+|\S+)\s+file/i.exec(raw);
  if (openFile) {
    const token = openFile[1].replace(/^\/+/, '');
    const path = token === 'sound' || token === '/sound'
      ? 'aileena-new/app/sound/page.tsx'
      : token.startsWith('aileena-new/')
        ? token
        : `aileena-new/${token}`;
    return {
      kind: 'queue_task',
      taskType: 'files_open',
      route: token.startsWith('/') ? token : '/sound',
      instructions: path,
    };
  }

  if (/draft (?:an )?email/i.test(raw)) {
    return {
      kind: 'queue_task',
      taskType: 'email_draft',
      route: '/proof',
      instructions: raw.slice(0, 400),
    };
  }

  if (/^send(?: this)?(?: the)? email\s*$/i.test(raw) || /^send it\s*$/i.test(raw)) {
    return {
      kind: 'blocked',
      message: '⚡ needs approval. Email send is not connected. Draft only. No send without owner confirm.',
    };
  }

  if (/screenshot|take pictures of/i.test(raw) && /(\/daily|\/sound|\/ |landing|mobile)/i.test(raw)) {
    return {
      kind: 'blocked',
      message: '⚡ blocked. Browser automation is not wired. No fake screenshots.',
    };
  }

  if (/draft a patch/i.test(raw)) {
    return {
      kind: 'queue_task',
      taskType: 'draft_patch',
      route: '/proof',
      instructions: raw.slice(0, 4000),
    };
  }

  if (/mark proposal\s+\S+\s+ready/i.test(raw)) {
    return {
      kind: 'clarify',
      question: '⚡ Screenshots and checks first. I will not mark ready without proof.',
    };
  }

  if (/^list$/i.test(raw) || /^ls$/i.test(raw)) {
    return {
      kind: 'queue_task',
      taskType: 'files_tree',
      route: '/proof',
      instructions: '/workspace',
    };
  }

  if (/^write scratch(?: file)?\s*$/i.test(raw) || /^scratch hello\s*$/i.test(raw)) {
    return {
      kind: 'queue_task',
      taskType: 'write_scratch_file',
      route: '/proof',
      instructions: 'write /scratch/hello.txt and read it back',
    };
  }

  const note = /^note:\s*(.+)$/i.exec(raw);
  if (note) {
    return {
      kind: 'queue_task',
      taskType: 'write_scratch_file',
      route: '/proof',
      instructions: note[1].trim().slice(0, 4000),
    };
  }

  const find = /^find(?: in workspace)?:\s*(.+)$/i.exec(raw) || /^find\s+(.+)$/i.exec(raw);
  if (find && !/commit/i.test(raw)) {
    return {
      kind: 'queue_task',
      taskType: 'files_search',
      route: '/proof',
      instructions: `/workspace ${find[1].trim().slice(0, 80)}`,
    };
  }

  const prepareFix = /^prepare fix for\s+(\/\S+)(?:\s+(.+))?$/i.exec(raw);
  if (prepareFix) {
    const route = normalizeRoute(prepareFix[1]);
    const instructions = (prepareFix[2] || 'prepare a patch plan').trim().slice(0, 4000);
    return {
      kind: 'queue_task',
      taskType: route === '/daily' ? 'draft_daily_fix_plan' : 'inspect_route_files',
      route,
      instructions,
    };
  }

  return null;
}

function normalizeRoute(route: string): string {
  const t = route.trim();
  if (!t.startsWith('/') || t.startsWith('//')) return '/daily';
  return t.replace(/\/+$/, '') || '/';
}

export type VisitorComputerCommand =
  | {
      kind: 'queue_task';
      taskType: 'write_scratch_file' | 'files_tree' | 'files_search' | 'scratch_peek' | 'scratch_clock';
      route: string;
      instructions: string;
    }
  | { kind: 'blocked'; message: string };

/**
 * Visitor scratch-pad commands. Never git, learn, proof, email, or merge.
 */
export function parseVisitorComputerCommand(text: string): VisitorComputerCommand | null {
  const raw = text.trim();
  if (!raw || raw.length > 2000) return null;

  if (
    /^learn:/i.test(raw) ||
    /^git\b/i.test(raw) ||
    /^show proof queue/i.test(raw) ||
    /find(?: me)?(?: the)? commit/i.test(raw)
  ) {
    return {
      kind: 'blocked',
      message: '⚡ scratch pad only. No site git, no merge, no owner computer.',
    };
  }

  if (/^list$/i.test(raw) || /^ls$/i.test(raw) || /^files$/i.test(raw)) {
    return {
      kind: 'queue_task',
      taskType: 'files_tree',
      route: '/proof',
      instructions: '/workspace',
    };
  }

  if (/^(peek|open last|read)$/i.test(raw)) {
    return {
      kind: 'queue_task',
      taskType: 'scratch_peek',
      route: '/proof',
      instructions: 'last',
    };
  }

  if (/^(clock|time|now)$/i.test(raw)) {
    return {
      kind: 'queue_task',
      taskType: 'scratch_clock',
      route: '/proof',
      instructions: 'now',
    };
  }

  const note = /^note:\s*(.+)$/i.exec(raw);
  if (note) {
    return {
      kind: 'queue_task',
      taskType: 'write_scratch_file',
      route: '/proof',
      instructions: note[1].trim().slice(0, 4000),
    };
  }

  const find = /^find(?: in workspace)?:\s*(.+)$/i.exec(raw) || /^find\s+(.+)$/i.exec(raw);
  if (find && !/commit/i.test(raw)) {
    return {
      kind: 'queue_task',
      taskType: 'files_search',
      route: '/proof',
      instructions: `/workspace ${find[1].trim().slice(0, 80)}`,
    };
  }

  return null;
}
