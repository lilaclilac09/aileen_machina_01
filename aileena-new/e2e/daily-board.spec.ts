import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from '@playwright/test';
import { createOwnerSession, SESSION_COOKIE } from '../lib/auth';

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
loadEnvLocal();

test.describe('daily board', () => {
  test('visitor can read, cannot write main note', async ({ page, request }) => {
    await page.goto('/daily', { waitUntil: 'networkidle' });
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('daily-title')).toHaveText('daily board');
    await expect(page.getByTestId('daily-theme-controls')).toHaveCount(0);

    const res = await request.post('/api/daily/notes', {
      data: { body: 'should 403' },
    });
    expect(res.status()).toBe(403);

    await expect(page.getByTestId('daily-owner-editor')).toHaveCount(0);
    await expect(page.getByTestId('daily-persistence')).toBeAttached();
    const latest = page.getByTestId('daily-latest-body');
    const empty = page.getByTestId('daily-empty');
    if ((await latest.count()) > 0) {
      await expect(latest).toBeVisible();
      await page.getByTestId('daily-bubble-input').click();
      await page.getByTestId('daily-bubble-input').fill('typing works');
      await expect(page.getByTestId('daily-bubble-input')).toHaveValue('typing works');
    } else {
      await expect(empty).toBeVisible();
      await expect(page.getByTestId('daily-bubble-form')).toHaveCount(0);
    }
  });

  test('owner can write a note; visitor can leave a bubble', async ({ page, context, request }) => {
    const token = await createOwnerSession();
    await context.addCookies([
      {
        name: SESSION_COOKIE,
        value: token,
        url: 'http://127.0.0.1:3000',
        httpOnly: true,
      },
    ]);

    const write = await request.post('/api/daily/notes', {
      headers: { Cookie: `${SESSION_COOKIE}=${token}` },
      data: {
        body: 'I love part of you and you only like the best part of me\nAnd so are we to the world so you hate me no more',
      },
    });
    expect(write.ok()).toBeTruthy();
    const { note } = (await write.json()) as { note: { id: string } };

    await page.goto('/daily', { waitUntil: 'networkidle' });
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('daily-owner-editor')).toBeVisible();
    await expect(page.getByTestId('daily-theme-controls')).toBeVisible();
    await page.getByTestId('daily-owner-textarea').click();
    await page.getByTestId('daily-owner-textarea').fill('typing works for owner');
    await expect(page.getByTestId('daily-owner-textarea')).toHaveValue('typing works for owner');

    await context.clearCookies();
    await page.goto('/daily', { waitUntil: 'networkidle' });
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('daily-latest-body')).toContainText('hate me no more');
    await expect(page.getByTestId('daily-owner-editor')).toHaveCount(0);

    await page.getByTestId('daily-bubble-input').click();
    await page.getByTestId('daily-bubble-input').fill('this hurt nicely');
    await expect(page.getByTestId('daily-bubble-input')).toHaveValue('this hurt nicely');
    await page.getByTestId('daily-bubble-send').click();
    await expect(page.getByTestId('daily-toast')).toContainText('Bubble sent.');
    await expect(page.getByTestId('daily-bubble').first()).toContainText('this hurt nicely');

    const again = await request.get('/api/daily');
    const board = (await again.json()) as { comments: Record<string, { body: string }[]> };
    expect(board.comments[note.id]?.some((c) => c.body === 'this hurt nicely')).toBeTruthy();
  });
});
