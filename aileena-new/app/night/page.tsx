'use client';

import { useState } from 'react';
import Link from 'next/link';
import { NIGHT_PRICE_COPY } from '../../lib/nightDesk';

type Reply = { kind: string; text: string };

export default function NightPage() {
  const [ageOk, setAgeOk] = useState(false);
  const [paid] = useState(false);
  const [text, setText] = useState('');
  const [reply, setReply] = useState<Reply | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [userId] = useState('desk-local');

  async function post(action: 'turn' | 'delete' | 'export' | 'pin', line = text) {
    const res = await fetch('/api/night', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, text: line, paid, ageOk, mode: 'night', action }),
    });
    const data = (await res.json()) as {
      reply?: Reply;
      record?: { lines: string[] };
      export?: string;
      error?: string;
    };
    if (data.reply) setReply(data.reply);
    if (data.record) setLog(data.record.lines);
    if (action === 'export' && data.export) {
      const blob = new Blob([data.export], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'night-desk.json';
      a.click();
      URL.revokeObjectURL(url);
    }
    if (action === 'delete') {
      setLog([]);
      setReply({ kind: 'desk', text: 'This desk’s memory is cleared.' });
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f4efe6',
        color: '#1c2422',
        fontFamily: 'Georgia, "Iowan Old Style", serif',
        padding: '48px 24px 80px',
      }}
    >
      <p style={{ letterSpacing: '0.18em', fontSize: 12, color: '#3d6b66' }}>NIGHT DESK</p>
      <h1 style={{ fontWeight: 400, fontSize: 40, margin: '8px 0 12px' }}>Late desk.</h1>
      <p style={{ maxWidth: 520, lineHeight: 1.5 }}>
        Essays, sets, kiln, the work. Presence and continuity. Not a partner.
      </p>
      <p
        data-testid="night-price"
        style={{
          maxWidth: 520,
          borderLeft: '2px solid #3d6b66',
          paddingLeft: 12,
          marginTop: 24,
        }}
      >
        {NIGHT_PRICE_COPY}
      </p>
      <p style={{ fontSize: 14, marginTop: 16 }}>
        <Link href="/">Back to the rooms</Link>
      </p>
      <label style={{ display: 'block', marginTop: 28, fontSize: 15 }}>
        <input
          type="checkbox"
          checked={ageOk}
          onChange={(e) => setAgeOk(e.target.checked)}
          style={{ marginRight: 8 }}
        />
        I am 18 or older.
      </label>
      <p style={{ fontSize: 13, color: '#5c6562', maxWidth: 480 }}>
        Night logs are not used for EU training. Export or delete is yours.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (ageOk) void post('turn');
        }}
        style={{ marginTop: 20, maxWidth: 520 }}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={!ageOk}
          rows={4}
          placeholder={ageOk ? 'What is on the desk.' : 'Age gate first.'}
          style={{ width: '100%', background: '#fffdf8', border: '1px solid #cfc6b8', padding: 12 }}
        />
        <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
          <button type="submit" disabled={!ageOk}>
            Leave it
          </button>
          <button type="button" disabled={!ageOk || !text.trim()} onClick={() => void post('pin')}>
            Pin
          </button>
          <button type="button" onClick={() => void post('export', '')}>
            Export memory
          </button>
          <button type="button" onClick={() => void post('delete', '')}>
            Delete memory
          </button>
        </div>
      </form>
      {reply ? (
        <p data-testid="night-reply" style={{ maxWidth: 520, marginTop: 28 }}>
          {reply.text}
        </p>
      ) : null}
      {log.length ? (
        <ul style={{ maxWidth: 520, fontSize: 14 }}>
          {log.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}
