'use client';

import { useCallback, useMemo, useState } from 'react';
import './proof-queue.css';
import { proofGateNotes, type ProofProposal, type ProofEvent, type ProofStatus } from '../lib/proofQueue';

type QueuePayload = {
  owner?: boolean;
  error?: string;
  proposals?: ProofProposal[];
  events?: ProofEvent[];
  persistence?: 'redis' | 'memory';
  merge?: boolean;
  prompt?: string;
};

const SECTIONS: { key: ProofStatus | 'ideas' | 'approved_tasks' | 'archive'; title: string; match: ProofStatus[] }[] = [
  { key: 'observed', title: 'observed issues', match: ['observed'] },
  { key: 'ideas', title: 'ideas', match: ['proposed'] },
  { key: 'approved_tasks', title: 'approved tasks', match: ['approved', 'in_progress'] },
  { key: 'ready_for_review', title: 'ready for review', match: ['ready_for_review'] },
  { key: 'archive', title: 'shipped archive', match: ['rejected', 'shipped'] },
];

async function postAction(body: Record<string, unknown>): Promise<QueuePayload> {
  const res = await fetch('/api/proof', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as QueuePayload & { ok?: boolean };
  if (!res.ok) {
    return { error: json.error || `⚡ ${res.status}` };
  }
  return json;
}

function Card({
  proposal,
  busy,
  onAct,
}: {
  proposal: ProofProposal;
  busy: boolean;
  onAct: (action: string, extra?: Record<string, unknown>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [scope, setScope] = useState(proposal.proposedChange);
  const [proofOpen, setProofOpen] = useState(false);
  const [shot, setShot] = useState('');
  const [summary, setSummary] = useState(proposal.implementationSummary);
  const [files, setFiles] = useState(proposal.filesChanged.join(', '));
  const [checks, setChecks] = useState(proposal.checksRun.join(', '));
  const gates = proofGateNotes(proposal);

  return (
    <article className="proof-card" data-proof-card data-status={proposal.status}>
      <div className="proof-card__top">
        <span className="proof-light" data-status={proposal.status} aria-hidden />
        <h3 className="proof-card__title">{proposal.title}</h3>
        <span className="proof-card__id">{proposal.id}</span>
      </div>
      <p className="proof-card__route">
        {proposal.route} · {proposal.risk} · {proposal.source}
      </p>
      <p>{proposal.problem}</p>
      {proposal.proposedChange ? <p>{proposal.proposedChange}</p> : null}
      {gates.length > 0 ? <div className="proof-card__gates">{gates.join(' ')}</div> : null}
      {proposal.screenshots.length > 0 ? (
        <p>
          {proposal.screenshots.length} screenshot{proposal.screenshots.length === 1 ? '' : 's'}
        </p>
      ) : null}

      <div className="proof-card__actions">
        {proposal.status === 'observed' ? (
          <button type="button" disabled={busy} onClick={() => onAct('promote')}>
            propose
          </button>
        ) : null}
        {proposal.status === 'proposed' ? (
          <button type="button" disabled={busy} onClick={() => onAct('approve')}>
            approve
          </button>
        ) : null}
        {proposal.status === 'approved' ? (
          <button type="button" disabled={busy} onClick={() => onAct('prepare_pr')}>
            prepare PR
          </button>
        ) : null}
        {proposal.status === 'in_progress' ? (
          <button type="button" disabled={busy} onClick={() => onAct('ready')}>
            mark ready
          </button>
        ) : null}
        {proposal.status === 'ready_for_review' ? (
          <button type="button" disabled={busy} onClick={() => onAct('ship')}>
            mark shipped
          </button>
        ) : null}
        {proposal.status !== 'shipped' && proposal.status !== 'rejected' ? (
          <>
            <button type="button" disabled={busy} onClick={() => setEditing((v) => !v)}>
              edit scope
            </button>
            <button type="button" disabled={busy} onClick={() => onAct('request_screenshots')}>
              request screenshots
            </button>
            <button type="button" disabled={busy} onClick={() => setProofOpen((v) => !v)}>
              attach proof
            </button>
            <button type="button" disabled={busy} onClick={() => onAct('reject')}>
              reject
            </button>
          </>
        ) : null}
      </div>

      {editing ? (
        <div className="proof-queue__edit">
          <textarea rows={3} value={scope} onChange={(e) => setScope(e.target.value)} aria-label="edit scope" />
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              onAct('edit', { proposedChange: scope });
              setEditing(false);
            }}
          >
            save scope
          </button>
        </div>
      ) : null}

      {proofOpen ? (
        <div className="proof-queue__edit">
          <input
            value={shot}
            onChange={(e) => setShot(e.target.value)}
            placeholder="screenshot url or /path"
            aria-label="screenshot url"
          />
          <textarea
            rows={2}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            aria-label="implementation summary"
            placeholder="implementation summary"
          />
          <input value={files} onChange={(e) => setFiles(e.target.value)} aria-label="files changed" placeholder="files changed" />
          <input value={checks} onChange={(e) => setChecks(e.target.value)} aria-label="checks run" placeholder="checks run" />
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              onAct('attach_proof', {
                screenshots: shot.trim() ? [{ label: 'proof', url: shot.trim() }] : [],
                implementationSummary: summary,
                filesChanged: files.split(',').map((s) => s.trim()).filter(Boolean),
                checksRun: checks.split(',').map((s) => s.trim()).filter(Boolean),
              });
              setProofOpen(false);
            }}
          >
            save proof
          </button>
        </div>
      ) : null}
    </article>
  );
}

export default function ProofQueuePanel({
  initialProposals,
  initialPersistence,
}: {
  initialProposals: ProofProposal[];
  initialPersistence: 'redis' | 'memory';
}) {
  const [proposals, setProposals] = useState<ProofProposal[]>(initialProposals);
  const [persistence, setPersistence] = useState<'redis' | 'memory'>(initialPersistence);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [prompt, setPrompt] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/proof', {
      credentials: 'same-origin',
      cache: 'no-store',
    });
    const body = (await res.json().catch(() => ({}))) as QueuePayload;
    if (!res.ok) {
      setError(body.error || '⚡ Owner only.');
      return;
    }
    setError(null);
    setProposals(body.proposals ?? []);
    setPersistence(body.persistence ?? initialPersistence);
  }, [initialPersistence]);

  const act = useCallback(
    async (id: string, action: string, extra?: Record<string, unknown>) => {
      setBusy(true);
      setPrompt(null);
      const result = await postAction({ id, action, ...extra });
      setBusy(false);
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(null);
      if (result.prompt) setPrompt(result.prompt);
      await load();
    },
    [load],
  );

  const grouped = useMemo(() => {
    return SECTIONS.map((section) => ({
      ...section,
      items: proposals.filter((p) => section.match.includes(p.status)),
    })).filter((section) => section.items.length > 0);
  }, [proposals]);

  return (
    <div className="proof-queue" data-proof-queue>
      <p className="proof-queue__meta">
        <span>{persistence === 'redis' ? 'stored' : 'memory (local)'}</span>
        <span>auto-merge off</span>
        <button type="button" disabled={busy} onClick={() => void postAction({ action: 'scan' }).then(() => load())}>
          scan
        </button>
        <button type="button" disabled={busy} onClick={() => void load()}>
          refresh
        </button>
      </p>
      {error ? <p className="proof-queue__flash">{error}</p> : null}

      {grouped.length === 0 ? (
        <p className="text-[0.88rem] text-[#1b1713]/55">Queue is quiet. Log an issue from the site agent.</p>
      ) : null}

      {grouped.map((section) => (
        <section className="proof-queue__section" key={section.key} data-section={section.key}>
          <h2>{section.title}</h2>
          {section.items.map((proposal) => (
            <Card
              key={proposal.id}
              proposal={proposal}
              busy={busy}
              onAct={(action, extra) => void act(proposal.id, action, extra)}
            />
          ))}
        </section>
      ))}

      {prompt ? <pre className="proof-queue__prompt">{prompt}</pre> : null}
    </div>
  );
}
