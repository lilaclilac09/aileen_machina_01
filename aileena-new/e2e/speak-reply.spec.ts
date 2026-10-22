import { expect, test, devices, type Page } from '@playwright/test';

/**
 * Per-reply "listen" button in the visitor console. /api/chat is mocked (no
 * model, no network); speechSynthesis is wrapped so the test can see calls.
 * Checks: nothing speaks on load, tap speaks the reply, tap again stops,
 * a new message stops it. SHOT_DIR=<dir> saves screenshots.
 */

const REPLY =
  "She didn't get louder. She got precise — numbers, commits, essays that stay up. Start with Third Culture Kid Without Consciousness.";

function uiStream(text: string): string {
  const id = `t${Math.random().toString(36).slice(2, 8)}`;
  return [
    { type: 'start', messageId: `m-${id}` },
    { type: 'text-start', id },
    { type: 'text-delta', id, delta: text },
    { type: 'text-end', id },
    { type: 'finish' },
  ]
    .map((c) => `data: ${JSON.stringify(c)}\n\n`)
    .join('') + 'data: [DONE]\n\n';
}

async function setup(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __spoken: string[]; __cancels: number };
    w.__spoken = [];
    w.__cancels = 0;
    if (!('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    const realCancel = synth.cancel.bind(synth);
    synth.speak = (u: SpeechSynthesisUtterance) => {
      w.__spoken.push(u.text);
    };
    synth.cancel = () => {
      w.__cancels += 1;
      realCancel();
    };
  });
  await page.route('**/api/agent/engage', (route) => route.fulfill({ status: 200, body: '{"ok":true}' }));
  await page.route('**/api/chat', (route) =>
    route.fulfill({
      status: 200,
      headers: { 'content-type': 'text/event-stream', 'x-vercel-ai-ui-message-stream': 'v1' },
      body: uiStream(REPLY),
    }),
  );
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  // Let the intro screen finish so screenshots show the console.
  await page.waitForTimeout(5000);
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('open-agent-chat', { detail: {} })));
  const dialog = page.getByRole('dialog', { name: 'Aileena Console' });
  await expect(dialog.getByTestId('agent-input')).toBeVisible();
  return dialog;
}

async function ask(page: Page, q: string) {
  const dialog = page.getByRole('dialog', { name: 'Aileena Console' });
  await dialog.getByTestId('agent-input').fill(q);
  await dialog.getByTestId('agent-input').press('Enter');
}

for (const [label, device] of [
  ['desktop', devices['Desktop Chrome']],
  ['mobile', devices['iPhone 13']],
] as const) {
  test.describe(`speak reply (${label})`, () => {
    test.use({ viewport: device.viewport, userAgent: device.userAgent, deviceScaleFactor: device.deviceScaleFactor, isMobile: device.isMobile, hasTouch: device.hasTouch });

    test('listen button speaks only on tap and stops', async ({ page }) => {
      const dialog = await setup(page);
      await ask(page, 'how did she handle being misread?');
      const btn = dialog.getByTestId('agent-speak-reply').last();
      await expect(btn).toBeVisible();
      await expect(btn).toHaveText(/listen/);
      expect(await page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken.length)).toBe(0);
      if (process.env.SHOT_DIR) await page.screenshot({ path: `${process.env.SHOT_DIR}/speak-reply-${label}-idle.png` });

      await btn.click();
      await expect(btn).toHaveText(/stop/);
      await expect(btn).toHaveAttribute('aria-pressed', 'true');
      const spoken = await page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken.join(' '));
      expect(spoken).toContain("She didn't get louder");
      if (process.env.SHOT_DIR) await page.screenshot({ path: `${process.env.SHOT_DIR}/speak-reply-${label}-playing.png` });

      await btn.click();
      await expect(btn).toHaveText(/listen/);

      await btn.click();
      await expect(btn).toHaveText(/stop/);
      await ask(page, 'and the kiln?');
      await expect(dialog.getByTestId('agent-speak-reply').first()).toHaveText(/listen/);
    });
  });
}
