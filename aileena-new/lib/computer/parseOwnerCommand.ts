import type { ComputerTaskType } from './types';

export type OwnerComputerCommand =
  | { kind: 'show_queue' }
  | { kind: 'log_issue'; title: string }
  | { kind: 'propose_fix'; route: string; instructions: string }
  | { kind: 'approve'; id: string }
  | { kind: 'reject'; id: string }
  | { kind: 'prepare_pr'; id: string }
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

  if (/^write scratch(?: file)?\s*$/i.test(raw) || /^scratch hello\s*$/i.test(raw)) {
    return {
      kind: 'queue_task',
      taskType: 'write_scratch_file',
      route: '/proof',
      instructions: 'write /scratch/hello.txt and read it back',
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
