#!/usr/bin/env tsx
/**
 * Daily board: store sanitizers + live HTTP owner/public gates.
 *
 *   pnpm verify:daily-board
 *   VERIFY_BASE_URL=http://localhost:3000 pnpm verify:daily-board
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { commentLooksSpammy, sanitizeNickname, sanitizeTheme } from '../lib/dailyBoard';
import {
  addDailyComment,
  hideDailyComment,
  openAndBurnDailySnap,
  readDailyBoard,
  readPublicDailyBoard,
  upsertDailyNote,
  writeDailySnap,
  writeDailyTheme,
} from '../lib/dailyBoardStore';
import { createOwnerSession, SESSION_COOKIE } from '../lib/auth';

type Check = { name: string; ok: boolean; detail?: string };
const checks: Check[] = [];

function assert(name: string, ok: boolean, detail?: string) {
  checks.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

function loadEnvLocal() {
  const p = join(process.cwd(), '.env.local');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

function read(rel: string): string {
  return readFileSync(join(process.cwd(), rel), 'utf8');
}

async function liveHttp() {
  const base = (process.env.VERIFY_BASE_URL || '').replace(/\/$/, '');
  if (!base) {
    assert('live HTTP', true, 'skipped (set VERIFY_BASE_URL)');
    return;
  }

  const page = await fetch(`${base}/daily`);
  assert('GET /daily', page.ok, String(page.status));

  const visitorGet = await fetch(`${base}/api/daily`);
  const visitorJson = visitorGet.ok
    ? ((await visitorGet.json()) as { owner?: boolean; persistence?: string; notes?: unknown[] })
    : {};
  assert('GET /api/daily', visitorGet.ok, String(visitorGet.status));
  assert('visitor GET owner=false', visitorJson.owner === false, JSON.stringify({ owner: visitorJson.owner }));
  assert(
    'GET reports persistence',
    visitorJson.persistence === 'memory' || visitorJson.persistence === 'redis',
    String(visitorJson.persistence),
  );

  const pageHtml = page.ok ? await page.text() : '';
  assert('visitor /daily has no owner writer', !pageHtml.includes('daily-owner-textarea'));
  assert('visitor /daily has no publish pill', !pageHtml.includes('daily-publish'));
  assert(
    'visitor /daily shows latest or empty',
    pageHtml.includes('daily-latest') || pageHtml.includes('daily-empty'),
  );
  assert('visitor /daily names persistence', pageHtml.includes('daily-persistence'));

  const forbidden = await fetch(`${base}/api/daily/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body: 'visitor should not write' }),
  });
  assert('visitor POST notes → 403', forbidden.status === 403, String(forbidden.status));

  const themeForbidden = await fetch(`${base}/api/daily/theme`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ background: '#ffffff', text: '#000000', accent: '#00a89d', bubble: '#eeeeee' }),
  });
  assert('visitor POST theme → 403', themeForbidden.status === 403, String(themeForbidden.status));

  const token = await createOwnerSession();
  const cookie = `${SESSION_COOKIE}=${token}`;
  const secret = `draft-only-${Date.now()}`;
  const noteBody =
    'I love part of you and you only like the best part of me\nAnd so are we to the world so you hate me no more';
  const ownerDraft = await fetch(`${base}/api/daily/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ body: secret }),
  });
  const draftNote = ownerDraft.ok ? ((await ownerDraft.json()) as { note?: { id: string; published?: boolean } }) : {};
  assert('owner POST draft', ownerDraft.ok, `${ownerDraft.status} ${draftNote.note?.id ?? ''}`);
  assert('draft is unpublished', draftNote.note?.published === false, JSON.stringify(draftNote.note));

  const visitorDraftGet = await fetch(`${base}/api/daily`);
  const visitorDraftJson = visitorDraftGet.ok
    ? ((await visitorDraftGet.json()) as { notes?: { body?: string }[]; owner?: boolean })
    : {};
  assert(
    'visitor GET hides unpublished draft',
    !visitorDraftJson.notes?.some((n) => n.body?.includes(secret)),
    `notes=${visitorDraftJson.notes?.length ?? 0}`,
  );

  const ownerPost = await fetch(`${base}/api/daily/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ body: noteBody, published: true }),
  });
  const ownerNote = ownerPost.ok ? ((await ownerPost.json()) as { note?: { id: string; body: string } }) : {};
  assert('owner POST notes', ownerPost.ok, `${ownerPost.status} ${ownerNote.note?.id ?? ''}`);

  const ownerTheme = await fetch(`${base}/api/daily/theme`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      background: '#f4efe6',
      text: '#2a241c',
      accent: '#c45c4a',
      bubble: '#ece6dc',
    }),
  });
  assert('owner POST theme', ownerTheme.ok, String(ownerTheme.status));

  if (ownerNote.note?.id) {
    const noteId = ownerNote.note.id;
    const bubble = await fetch(`${base}/api/daily/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId, body: 'this hurt nicely' }),
    });
    assert('visitor POST bubble', bubble.ok, String(bubble.status));

    const again = await fetch(`${base}/api/daily`);
    const board = again.ok
      ? ((await again.json()) as {
          notes?: { body?: string }[];
          comments?: Record<string, { body: string }[]>;
          theme?: { accent?: string };
        })
      : {};
    const comments = board.comments?.[noteId] ?? [];
    assert(
      'GET persists note + bubble + theme',
      Boolean(board.notes?.some((n) => n.body?.includes('hate me no more'))) &&
        comments.some((c) => c.body === 'this hurt nicely') &&
        board.theme?.accent === '#c45c4a',
      `notes=${board.notes?.length ?? 0} comments=${comments.length} accent=${board.theme?.accent}`,
    );

    const hideForbidden = await fetch(`${base}/api/daily/comments?id=x`, { method: 'DELETE' });
    assert('visitor DELETE bubble → 403', hideForbidden.status === 403, String(hideForbidden.status));

    const snapForbidden = await fetch(`${base}/api/daily/snap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        noteId,
        mime: 'image/png',
        data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      }),
    });
    assert('visitor POST snap → 403', snapForbidden.status === 403, String(snapForbidden.status));

    const snapPreviewForbidden = await fetch(`${base}/api/daily/snap?noteId=${encodeURIComponent(noteId)}`);
    assert('visitor GET snap preview → 403', snapPreviewForbidden.status === 403, String(snapPreviewForbidden.status));

    const ownerSnap = await fetch(`${base}/api/daily/snap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        noteId,
        mime: 'image/png',
        data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      }),
    });
    assert('owner POST snap', ownerSnap.ok, String(ownerSnap.status));

    const visitorSnapBoard = await fetch(`${base}/api/daily`);
    const snapBoard = visitorSnapBoard.ok
      ? ((await visitorSnapBoard.json()) as { notes?: { id?: string; snap?: string }[] })
      : {};
    const listed = snapBoard.notes?.find((n) => n.id === noteId);
    assert('visitor sees snap ready, not bytes', listed?.snap === 'ready', JSON.stringify(listed));
    const visitorSnapBody = visitorSnapBoard.ok ? JSON.stringify(snapBoard) : '';
    assert(
      'visitor board omits snap bytes',
      !visitorSnapBody.includes('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ'),
    );

    const opened = await fetch(`${base}/api/daily/snap/open`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteId }),
    });
    const openedJson = opened.ok ? ((await opened.json()) as { status?: string; data?: string }) : {};
    assert('visitor open snap once', opened.ok && openedJson.status === 'ready' && Boolean(openedJson.data), String(opened.status));

    const burned = await fetch(`${base}/api/daily/snap/open`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteId }),
    });
    assert('second open is burned', burned.status === 410, String(burned.status));
  }
}

async function storeUnit() {
  const nick = sanitizeNickname('Aileena');
  assert('blocked owner impersonation nick', nick === 'anon', nick);

  const theme = sanitizeTheme({ background: 'red', text: '#2a241c', accent: '#00a89d', bubble: '#ece6dc' });
  assert('invalid background falls back', theme.background === '#f4efe6', theme.background);

  assert('spam urls rejected', commentLooksSpammy('http://a.com http://b.com'));
  assert('plain bubble ok', !commentLooksSpammy('this hurt nicely'));

  const draft = await upsertDailyNote({ date: '2099-01-01', body: 'secret draft', title: '' });
  assert('new note defaults unpublished', draft.published === false, String(draft.published));
  const denied = await addDailyComment({ noteId: draft.id, body: 'nope' });
  assert('bubble on draft is missing_note', 'error' in denied && denied.error === 'missing_note');
  const visitorHidden = await readPublicDailyBoard(false);
  assert(
    'public board hides draft',
    !visitorHidden.notes.some((n) => n.id === draft.id),
    String(visitorHidden.notes.length),
  );
  const ownerSees = await readPublicDailyBoard(true);
  assert('owner board includes draft', ownerSees.notes.some((n) => n.id === draft.id));

  const note = await upsertDailyNote({ body: 'store line', title: '', published: true });
  assert('store upsert note', Boolean(note.id && note.body === 'store line' && note.published), note.id);

  const comment = await addDailyComment({ noteId: note.id, body: 'saved this line' });
  assert('store add comment', !('error' in comment), 'error' in comment ? comment.error : comment.id);

  if (!('error' in comment)) {
    const hidden = await hideDailyComment(comment.id);
    assert('store hide comment', hidden);
  }

  const snapNote = await upsertDailyNote({ date: '2099-12-31', body: 'with snap', title: '', published: true });
  const png =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const written = await writeDailySnap({ noteId: snapNote.id, mime: 'image/png', data: png });
  assert('store write snap', !('error' in written) && written.snap === 'ready');
  const publicSnap = await readPublicDailyBoard(false);
  assert(
    'public snap has state not bytes',
    publicSnap.notes.some((n) => n.id === snapNote.id && n.snap === 'ready') &&
      !JSON.stringify(publicSnap).includes(png),
  );
  const opened = await openAndBurnDailySnap(snapNote.id);
  assert('open returns blob then burns', opened.status === 'ready');
  const again = await openAndBurnDailySnap(snapNote.id);
  assert('second open burned', again.status === 'burned');

  const themed = await writeDailyTheme({
    background: '#e7f0ee',
    text: '#1f3d3a',
    accent: '#00a89d',
    bubble: '#e4efe9',
  });
  const board = await readDailyBoard({ owner: true });
  assert('store theme roundtrip', board.theme.background === themed.background, board.theme.background);
}

function sourceChecks() {
  const notes = read('app/api/daily/notes/route.ts');
  const theme = read('app/api/daily/theme/route.ts');
  const comments = read('app/api/daily/comments/route.ts');
  const snap = read('app/api/daily/snap/route.ts');
  const snapOpen = read('app/api/daily/snap/open/route.ts');
  const doors = read('lib/doorsNav.ts');
  const ui = read('components/DailyBoard.tsx');
  assert('notes route requires owner', /requireOwnerFromRequest/.test(notes) && /status: 403/.test(notes));
  assert('notes publish is explicit true', /published === true/.test(notes));
  assert('theme route requires owner', /requireOwnerFromRequest/.test(theme) && /status: 403/.test(theme));
  assert('snap upload requires owner', /requireOwnerFromRequest/.test(snap) && /status: 403/.test(snap));
  assert('snap preview requires owner', /export async function GET/.test(snap) && /forbidden/.test(snap));
  assert('snap open burns', /openAndBurnDailySnap/.test(snapOpen));
  assert('comment hide requires owner', /method: 'DELETE'/.test(comments) || /export async function DELETE/.test(comments));
  assert('doors hub includes /daily', doors.includes("'/daily'"));
  assert('page copy daily board', ui.includes('daily board') && ui.includes('one or two lines a day.'));
  assert('owner placeholder', ui.includes('write one or two lines'));
  assert('bubble placeholder', ui.includes('leave a small bubble'));
  assert('empty copy', ui.includes('nothing today yet.'));
  assert('real textarea for empty paper', ui.includes('daily-owner-textarea') && ui.includes('showWriter'));
  assert('writer is owner-only', /const showWriter = owner;/.test(ui) && !/on this phone until you enter/.test(ui));
  assert('owner publish pill', ui.includes('daily-publish') && ui.includes('draft · only you'));
  assert('autosave does not publish', ui.includes('...(opts?.published ? { published: true } : {})'));
  assert('visitor snap burns', ui.includes('daily-snap-seal') && ui.includes('tap to see · then it burns'));
  assert('no owner door on daily', !ui.includes('OwnerUnlockForm') && !ui.includes('daily-owner-enter'));
  assert('public persistence is named', ui.includes('daily-persistence') && ui.includes('this instance'));
  assert('503 toast is a bolt', ui.includes("flash('Nope.'"));
  assert('no OWNER_KEY in client', !ui.includes('OWNER_KEY'));
  assert('redis env uses runtime bracket access', read('lib/visitorMemory.ts').includes("process.env['UPSTASH_REDIS_REST_URL']"));
  assert('vercel memory writes blocked', read('lib/dailyBoardStore.ts').includes('dailyBoardWritesOk'));
}

async function main() {
  loadEnvLocal();
  sourceChecks();
  await storeUnit();
  await liveHttp();

  const failed = checks.filter((c) => !c.ok);
  console.log(`\nResult: ${checks.length - failed.length}/${checks.length} passed`);
  if (failed.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
