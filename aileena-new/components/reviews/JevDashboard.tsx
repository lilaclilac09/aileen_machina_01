'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ScrollUnlock from '../../app/blog/ScrollUnlock';
import { isLayoutSampleId, LAYOUT_REPORTS } from '../../lib/reviews/layout-sample';
import type { ReviewReport } from '../../lib/reviews/report';
import type { ReviewSummary, StoredReview } from '../../lib/reviews/store';
import ReviewFlow from './ReviewFlow';
import './jev-review.css';

const THRESHOLD = 0.7;
const SEVERITY_MAX = 3;
const DEFAULT_DIMENSIONS: Array<[string, string, string]> = [
  ['correctness', 'Correctness', 'Corr'],
  ['security', 'Security', 'Sec'],
  ['reliability', 'Reliability', 'Rel'],
  ['compatibility', 'Compatibility', 'Compat'],
  ['testGap', 'Test gap', 'Tests'],
];

type OkState = { status: 'ok'; savedAt: string; writable: boolean; report: ReviewReport };
type ViewState = OkState | { status: 'empty' } | { status: 'error'; message: string } | { status: 'offline' };

function isNum(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function fixed(value: unknown, digits = 2): string {
  return isNum(value) ? value.toFixed(digits) : '–';
}

function ago(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const units: Array<[number, string]> = [
    [86400, 'd'],
    [3600, 'h'],
    [60, 'm'],
  ];
  for (const [size, unit] of units) {
    if (seconds >= size) return `${Math.floor(seconds / size)}${unit} ago`;
  }
  return 'just now';
}

function splitPath(path: unknown): [string, string] {
  const text = String(path ?? '');
  const cut = text.lastIndexOf('/') + 1;
  return [text.slice(0, cut), text.slice(cut)];
}

function fill(p: number): string {
  const x = Math.min(1, Math.max(0, p));
  return x <= 0.5
    ? `color-mix(in oklab, var(--seq-mid) ${(x * 200).toFixed(1)}%, var(--seq-lo))`
    : `color-mix(in oklab, var(--seq-hi) ${((x - 0.5) * 200).toFixed(1)}%, var(--seq-mid))`;
}

function dimensionsFor(report: ReviewReport): Array<[string, string, string]> {
  return Array.isArray(report.dimensions)
    ? report.dimensions.map(({ key, label, short }) => [key, label, short])
    : DEFAULT_DIMENSIONS;
}

function scopeName(scope: string): string {
  return scope.split('/').filter(Boolean).pop() ?? scope;
}

function SeverityMeter({ severity }: { severity: unknown }) {
  const segments = Array.from({ length: SEVERITY_MAX }, (_, i) => {
    const amount = isNum(severity) ? Math.min(1, Math.max(0, severity - i)) : 0;
    return <i key={i} style={{ ['--amount' as string]: `${(amount * 100).toFixed(0)}%` }} />;
  });
  return (
    <span className="severity">
      <span className="meter" aria-hidden="true">
        {segments}
      </span>
      <span className="num">{fixed(severity, 1)}</span>
    </span>
  );
}

function PathCode({ path, line }: { path: unknown; line?: unknown }) {
  const [dir, base] = splitPath(path);
  return (
    <code title={line == null ? String(path ?? '') : `${path}:${line}`}>
      <span className="dir">{dir}</span>
      <span className="base">{base}</span>
      {line != null ? <span className="line">:{String(line ?? '?')}</span> : null}
    </code>
  );
}

function ReportBody({
  report,
  showValues,
  onToggle,
}: {
  report: ReviewReport;
  showValues: boolean;
  onToggle: () => void;
}) {
  const findings = report.findings.filter((row) => row && typeof row === 'object');
  const blocking = findings.filter((row) => row.action === 'request_changes').length;
  const tests = report.contextFiles ?? report.changedTestFiles ?? [];
  const testLabel = report.mode === 'codebase' ? 'test files' : 'changed tests';
  const dimensions = dimensionsFor(report);
  const stats = [
    { value: report.screenedFiles, label: 'files' },
    { value: tests.length, label: testLabel, title: tests.join('\n') || undefined },
    {
      value: report.followedSignals,
      label: 'investigated',
      title: `potential concerns at or above ${THRESHOLD.toFixed(2)} reviewed for evidence`,
    },
    { value: findings.length, label: 'findings', cls: 'lead' },
    { value: blocking, label: 'request changes', cls: blocking > 0 ? 'alert' : '' },
  ];
  const flow = report.workflow;
  const fileKind = report.mode === 'codebase' ? 'complete source files' : 'changed source files';
  const steps = flow
    ? [
        {
          value: flow.screenedCells,
          label: 'risk checks',
          detail: 'file × category',
          title: 'One screening probability for every file and concern category',
        },
        {
          value: flow.thresholdSignals,
          label: 'flagged',
          detail: `at least ${THRESHOLD.toFixed(2)}`,
          title: 'Screening probabilities at or above the follow-up threshold',
        },
        {
          value: flow.followedSignals,
          label: 'investigated',
          detail: 'evidence review',
          title: 'Highest-risk potential concerns selected for deeper evidence review',
        },
        {
          value: flow.locatedFindings,
          label: 'supported',
          detail: 'evidence found',
          title: 'Concerns supported by a concrete source region and mechanism',
        },
        {
          value: flow.routedFindings,
          label: 'assigned',
          detail: 'owner suggested',
          title: 'Higher-severity findings assigned to a reviewer specialty',
        },
      ]
    : [];
  const profiles = Array.isArray(report.profiles) ? report.profiles : [];
  const categoryHeading = report.mode === 'codebase' ? 'Role' : 'Change';
  const rows = [...report.matrix].sort((a, b) => maxP(b, dimensions) - maxP(a, dimensions));
  const labels = Object.fromEntries(dimensions.map(([key, label]) => [key, label]));
  const followed = report.followedSignals;
  const emptyDetail =
    followed > 0
      ? `${followed} potential ${followed === 1 ? 'concern was' : 'concerns were'} investigated; none had enough evidence to become a finding`
      : `No screening probability reached the ${THRESHOLD.toFixed(2)} follow-up threshold`;

  return (
    <>
      <dl className="stats">
        {stats.map((stat) => (
          <div key={stat.label} className={`stat ${stat.cls ?? ''}`} title={stat.title}>
            <dt>{stat.label}</dt>
            <dd>{isNum(stat.value) ? stat.value : '–'}</dd>
          </div>
        ))}
      </dl>

      {flow ? (
        <details className="block" open>
          <summary className="block-head">
            <h2>Review funnel</h2>
          </summary>
          <p className="section-note">
            {report.screenedFiles} {fileKind} were checked across {dimensions.length} concern categories.
            Screening is broad; only higher probabilities continue to evidence review.
          </p>
          <ol className="flow">
            {steps.map((step, index) => (
              <li key={step.label} title={step.title}>
                {index > 0 ? (
                  <span className="flow-arrow" aria-hidden="true">
                    →
                  </span>
                ) : null}
                <span className="flow-step">
                  <strong>{isNum(step.value) ? step.value : '–'}</strong>
                  <span>{step.label}</span>
                  <small>{step.detail}</small>
                </span>
              </li>
            ))}
          </ol>
        </details>
      ) : null}

      {profiles.length > 0 ? (
        <details className="block">
          <summary className="block-head">
            <h2>Files selected for closer review</h2>
            <span className="block-aside">
              <span className="count">{profiles.length}</span>
            </span>
          </summary>
          <p className="section-note">
            These files had the highest screening scores. The category summarizes the file or change; review
            priority runs from 0 (routine) to 3 (specialist attention).
          </p>
          <div className="profiles-wrap">
            <table className="profiles">
              <thead>
                <tr>
                  {['File', categoryHeading, 'Priority'].map((label) => (
                    <th key={label} scope="col">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile, index) => {
                  const category = profile.category ?? profile.changeType ?? '–';
                  const categoryConfidence = profile.categoryConfidence ?? profile.changeTypeConfidence;
                  return (
                    <tr
                      key={`${String(profile.file)}-${index}`}
                      title={`category confidence ${fixed(categoryConfidence)} · priority confidence ${fixed(profile.reviewPriorityConfidence)}`}
                    >
                      <td className="profile-file">
                        <PathCode path={profile.file} />
                      </td>
                      <td className="profile-type">{String(category)}</td>
                      <td className="profile-priority">
                        <SeverityMeter severity={profile.reviewPriority} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}

      <details className="block" open>
        <summary className="block-head">
          <h2>Risk screening by file</h2>
          <span className="block-aside">
            <span className="legend">
              <span className="legend-end">0</span>
              <span
                className="legend-ramp"
                role="img"
                aria-label={`Probability scale, threshold ${THRESHOLD}`}
              >
                <i className="legend-tick" style={{ left: `${THRESHOLD * 100}%` }} />
              </span>
              <span className="legend-end">1</span>
              <button
                className="toggle"
                type="button"
                aria-pressed={showValues}
                title="Show the exact probability in every cell"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onToggle();
                }}
              >
                0.00
              </button>
            </span>
          </span>
        </summary>
        <p className="section-note">
          Each cell is the estimated probability, from 0 to 1, that a file has that kind of concern. Darker
          cells mean higher probability; cells at or above {THRESHOLD.toFixed(2)} are flagged for deeper
          review. Screening is triage, not a confirmed finding.
        </p>
        {rows.length === 0 ? (
          <div className="quiet">
            <p className="quiet-title">No source files screened</p>
          </div>
        ) : (
          <div className="matrix-wrap">
            <table className={`matrix${showValues ? ' show-values' : ''}`}>
              <thead>
                <tr>
                  <th scope="col" className="file-col">
                    <span className="sr">File</span>
                  </th>
                  {dimensions.map(([key, label, short]) => (
                    <th key={key} scope="col" title={label}>
                      <span className="long">{label}</span>
                      <abbr className="short" title={label}>
                        {short}
                      </abbr>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const file = String(row.file ?? '');
                  const [dir, base] = splitPath(file);
                  return (
                    <tr key={`${file}-${index}`}>
                      <th scope="row" className="file" title={file}>
                        <span className="path">
                          <span className="dir">{dir}</span>
                          <span className="base">{base}</span>
                        </span>
                      </th>
                      {dimensions.map(([key, label]) => {
                        const p = row[key];
                        if (!isNum(p)) {
                          return (
                            <td key={key} className="cell missing">
                              <span className="v">–</span>
                            </td>
                          );
                        }
                        const hot = p >= THRESHOLD;
                        return (
                          <td
                            key={key}
                            className={`cell${hot ? ' hot' : ''}${p >= 0.55 ? ' deep' : ''}`}
                            style={{ ['--fill' as string]: fill(p) }}
                            title={`${file}\n${label} ${fixed(p)}`}
                          >
                            <span className="v">{fixed(p)}</span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </details>

      <details className="block" open>
        <summary className="block-head">
          <h2>Findings</h2>
          <span className="block-aside">
            <span className="count">{findings.length}</span>
          </span>
        </summary>
        <p className="section-note">
          These concerns passed screening and were tied to a concrete source region and mechanism. Severity
          runs from 0 (no meaningful impact) to 3 (critical). Findings are review leads, not proof of a
          defect.
        </p>
        {findings.length === 0 ? (
          <div className="quiet">
            <p className="quiet-title">No supported findings</p>
            <p className="quiet-detail">{emptyDetail}</p>
          </div>
        ) : (
          <table className="findings">
            <thead>
              <tr>
                {['Location', 'Concern', 'Severity', 'Owner', 'Action'].map((label) => (
                  <th key={label} scope="col">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {findings.map((finding, index) => {
                const blockingRow = finding.action === 'request_changes';
                return (
                  <tr
                    key={`${String(finding.file)}-${index}`}
                    title={`location confidence ${fixed(finding.locationConfidence)} · severity confidence ${fixed(finding.severityConfidence)}`}
                    data-testid="reviews-finding"
                  >
                    <td className="loc">
                      <PathCode path={finding.file} line={finding.line} />
                    </td>
                    <td className="dim">
                      <span>{labels[String(finding.dimension)] ?? String(finding.dimension)}</span>
                      {finding.mechanism ? <small>{String(finding.mechanism)}</small> : null}
                    </td>
                    <td className="sev">
                      <span className="sr">severity </span>
                      <SeverityMeter severity={finding.severity} />
                    </td>
                    <td className="owner">{finding.owner ? String(finding.owner) : '–'}</td>
                    <td className={`act ${blockingRow ? 'blocking' : 'comment'}`}>
                      <span className="glyph" aria-hidden="true" />
                      {blockingRow
                        ? 'Request changes'
                        : finding.action === 'comment'
                          ? 'Comment'
                          : String(finding.action)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </details>
    </>
  );
}

function maxP(row: Record<string, unknown>, dimensions: Array<[string, string, string]>): number {
  return Math.max(0, ...dimensions.map(([key]) => (isNum(row[key]) ? row[key] : 0)));
}

function layoutView(id: string): OkState {
  const found = LAYOUT_REPORTS.find((row) => row.summary.id === id) ?? LAYOUT_REPORTS[0];
  return {
    status: 'ok',
    savedAt: found.summary.savedAt,
    writable: false,
    report: found.report,
  };
}

export default function JevDashboard() {
  const [reviews, setReviews] = useState<ReviewSummary[]>(LAYOUT_REPORTS.map((row) => row.summary));
  const [selected, setSelected] = useState<string | null>(LAYOUT_REPORTS[0].summary.id);
  const [view, setView] = useState<ViewState>(layoutView(LAYOUT_REPORTS[0].summary.id));
  const [sample, setSample] = useState(true);
  const [pane, setPane] = useState<'report' | 'flow'>('report');
  const [showValues, setShowValues] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const selectedRef = useRef<string | null>(selected);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  const loadList = useCallback(async (prefer?: string) => {
    const res = await fetch('/api/owner/reviews', { cache: 'no-store', credentials: 'include' });
    if (!res.ok) {
      setNotice('Could not load saved reviews');
      return;
    }
    const data = (await res.json()) as { reviews?: ReviewSummary[] };
    const list = data.reviews ?? [];
    if (list.length === 0) {
      setSample(true);
      setReviews(LAYOUT_REPORTS.map((row) => row.summary));
      const keep = selectedRef.current;
      const next = isLayoutSampleId(keep ?? '') ? keep : LAYOUT_REPORTS[0].summary.id;
      setSelected(next);
      if (next) setView(layoutView(next));
      return;
    }
    setSample(false);
    setReviews(list);
    const keep = selectedRef.current;
    const next =
      prefer && list.some((row) => row.id === prefer)
        ? prefer
        : keep && list.some((row) => row.id === keep) && !isLayoutSampleId(keep)
          ? keep
          : list[0].id;
    setSelected(next);
  }, []);

  const loadOne = useCallback(async (id: string) => {
    const res = await fetch(`/api/owner/reviews/${id}`, { cache: 'no-store', credentials: 'include' });
    const data = (await res.json()) as StoredReview;
    if (!res.ok && data.status !== 'error' && data.status !== 'empty') {
      setView({ status: 'offline' });
      return;
    }
    if (data.status === 'ok') {
      setView({ status: 'ok', savedAt: data.savedAt, writable: data.writable, report: data.report });
      return;
    }
    setView(data.status === 'error' ? data : { status: 'empty' });
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (cancelled) return;
      await loadList();
    })();
    const onFocus = () => {
      void loadList();
    };
    window.addEventListener('focus', onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
    };
  }, [loadList]);

  useEffect(() => {
    if (!selected) return;
    if (isLayoutSampleId(selected)) {
      setView(layoutView(selected));
      return;
    }
    void loadOne(selected);
  }, [selected, loadOne]);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setNotice(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text()) as unknown;
    } catch {
      setNotice('Report is not review output');
      return;
    }
    const res = await fetch('/api/owner/reviews', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed),
    });
    if (!res.ok) {
      setNotice('Report is not review output');
      return;
    }
    const data = (await res.json()) as { review?: ReviewSummary };
    await loadList(data.review?.id);
  }

  async function removeSelected() {
    if (!selected || view.status !== 'ok' || !view.writable) return;
    const res = await fetch(`/api/owner/reviews/${selected}`, { method: 'DELETE', credentials: 'include' });
    if (!res.ok) {
      setNotice('This report stays with the deploy');
      return;
    }
    await loadList();
  }

  const current = reviews.find((row) => row.id === selected);
  const modeLabel =
    view.status === 'ok'
      ? view.report.mode === 'codebase'
        ? 'Codebase scan'
        : 'Change review'
      : current?.mode === 'codebase'
        ? 'Codebase scan'
        : current
          ? 'Change review'
          : '';

  return (
    <div className="jev-review" data-testid="reviews-dashboard">
      <ScrollUnlock />
      <div className="page">
        <header className="top">
          <h1 className="brand">
            <span className="mark" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            Jev review
          </h1>
          <p className="meta" id="meta">
            {view.status === 'ok' ? (
              <>
                <span className="mode" title={modeLabel}>
                  {modeLabel}
                </span>
                <span className="sep" aria-hidden="true">
                  ·
                </span>
                <span className="scope" title={view.report.scope}>
                  {scopeName(view.report.scope)}
                </span>
                <span className="sep" aria-hidden="true">
                  ·
                </span>
                <time dateTime={view.savedAt} title={new Date(view.savedAt).toLocaleString()}>
                  {ago(view.savedAt)}
                </time>
              </>
            ) : null}
          </p>
          <div className="mode-switch" role="tablist" aria-label="Review room">
            <button type="button" className="toggle" aria-pressed={pane === 'report'} onClick={() => setPane('report')}>
              Report
            </button>
            <button type="button" className="toggle" aria-pressed={pane === 'flow'} onClick={() => setPane('flow')}>
              Flow
            </button>
          </div>
          <label className="add-report">
            Add report
            <input
              type="file"
              accept="application/json,.json"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                void onFile(file);
              }}
            />
          </label>
        </header>

        {reviews.length > 0 ? (
          <ul className="review-index" data-testid="reviews-index" aria-label="All reviews">
            {reviews.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  aria-current={row.id === selected ? 'true' : undefined}
                  onClick={() => setSelected(row.id)}
                >
                  {scopeName(row.scope)} · {row.findings}
                </button>
              </li>
            ))}
            {view.status === 'ok' && view.writable ? (
              <li>
                <button type="button" onClick={() => void removeSelected()}>
                  Remove
                </button>
              </li>
            ) : null}
          </ul>
        ) : null}

        <main aria-live="polite">
          {sample && pane === 'report' ? (
            <p className="section-note">Layout sample, so this room is visible before a saved review. Add a JSON to replace it.</p>
          ) : null}
          {pane === 'flow' ? <ReviewFlow onOpenReport={() => setPane('report')} /> : null}
          {pane === 'report' && view.status === 'ok' ? (
            <ReportBody report={view.report} showValues={showValues} onToggle={() => setShowValues((v) => !v)} />
          ) : null}
          {view.status === 'empty' ? (
            <div className="quiet">
              <p className="quiet-title">No review yet</p>
              <code className="quiet-command">npm run review:changes:save -- &lt;path&gt;</code>
              <p className="quiet-detail">Add the saved JSON. Only this owner session can read the list.</p>
            </div>
          ) : null}
          {view.status === 'error' ? (
            <div className="quiet">
              <p className="quiet-title">Unreadable report</p>
              <p className="quiet-detail">{view.message}</p>
            </div>
          ) : null}
          {view.status === 'offline' ? (
            <div className="quiet">
              <p className="quiet-title">Server unavailable</p>
            </div>
          ) : null}
          {notice ? <p className="quiet-detail">{notice}</p> : null}
        </main>
      </div>
    </div>
  );
}
