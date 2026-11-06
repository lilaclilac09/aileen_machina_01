import { expect, test, devices } from '@playwright/test';

function mockCamera() {
  return `
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    let frame = 0;
    const draw = () => {
      if (!ctx) return;
      frame += 1;
      ctx.fillStyle = 'rgb(' + (40 + (frame % 90)) + ', ' + (30 + (frame % 50)) + ', 28)';
      ctx.fillRect(0, 0, 640, 480);
      ctx.fillStyle = '#ded8ce';
      ctx.beginPath();
      ctx.arc(320, 190, 70, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1a1814';
      ctx.fillRect(250, 280, 140, 130);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 72px sans-serif';
      ctx.fillText(String(Math.floor(frame / 8) % 10), 292, 220);
      requestAnimationFrame(draw);
    };
    draw();
    const stream = canvas.captureStream(20);
    const fake = async () => stream;
    if (navigator.mediaDevices) {
      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { configurable: true, value: fake });
    }
    if (typeof MediaDevices !== 'undefined') {
      MediaDevices.prototype.getUserMedia = fake;
    }
  `;
}

function denyCamera() {
  return `
    const err = new Error('Permission denied');
    err.name = 'NotAllowedError';
    const fake = async () => { throw err; };
    if (navigator.mediaDevices) {
      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { configurable: true, value: fake });
    }
    if (typeof MediaDevices !== 'undefined') {
      MediaDevices.prototype.getUserMedia = fake;
    }
  `;
}

async function waitReady(page: import('@playwright/test').Page) {
  await expect(page.getByTestId('photo-automat-booth')).toHaveAttribute('data-ready', '1');
}

test.describe('Photo Automat', () => {
  test('Tools hub lists Photo Automat', async ({ page }) => {
    await page.goto('/tools', { waitUntil: 'domcontentloaded' });
    const card = page.getByTestId('tools-card-photo-automat');
    await expect(card).toBeVisible();
    await expect(card).toHaveAttribute('href', '/tools/photo-automat');
    await expect(card).toContainText('Photo Automat');
  });

  test('idle booth then swipe captures a 2x2 print', async ({ page }) => {
    await page.addInitScript(mockCamera());
    await page.goto('/tools/photo-automat?qa=1', { waitUntil: 'domcontentloaded' });
    await waitReady(page);
    await expect(page.getByTestId('photo-automat-booth')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Photo Automat' })).toBeVisible();
    await expect(page.getByTestId('photo-automat-card')).toBeVisible();
    for (let i = 0; i < 4; i += 1) {
      await expect(page.getByTestId(`photo-automat-frame-${i}`)).toHaveAttribute('data-filled', '0');
    }

    const card = page.getByTestId('photo-automat-card');
    const box = await card.boundingBox();
    expect(box).toBeTruthy();
    const startX = box!.x + box!.width / 2;
    const startY = box!.y + box!.height / 2;
    const hit = await page.evaluate(({ x, y }) => {
      const el = document.elementFromPoint(x, y);
      return {
        tag: el?.tagName,
        testid: el?.getAttribute('data-testid'),
        className: el instanceof HTMLElement ? el.className : '',
      };
    }, { x: startX, y: startY });
    expect(hit.testid, `hit ${JSON.stringify(hit)}`).toBe('photo-automat-card');
    await card.hover();
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX, startY + 180, { steps: 12 });
    await page.mouse.up();
    const phase = await page.getByTestId('photo-automat-booth').getAttribute('data-phase');
    expect(phase, `phase after swipe: ${phase}`).not.toBe('idle');

    await expect(page.getByTestId('photo-automat-print')).toBeVisible({ timeout: 15_000 });
    for (let i = 0; i < 4; i += 1) {
      await expect(page.getByTestId(`photo-automat-frame-${i}`)).toHaveAttribute('data-filled', '1');
    }
    const download = page.getByTestId('photo-automat-download');
    await expect(download).toHaveAttribute('download', 'photo-automat-berlin.png');
    await expect(download).toHaveAttribute('href', /blob:/);
    await expect(page.getByText('Nothing is uploaded')).toBeVisible();
  });

  test('Space starts a session with a mocked camera', async ({ page }) => {
    await page.addInitScript(mockCamera());
    await page.goto('/tools/photo-automat?qa=1', { waitUntil: 'domcontentloaded' });
    await waitReady(page);
    await page.getByTestId('photo-automat-card').focus();
    await page.keyboard.press('Space');
    await expect(page.getByTestId('photo-automat-print')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('photo-automat-retake')).toBeVisible();
  });

  test('denied camera shows an English error', async ({ page }) => {
    await page.addInitScript(denyCamera());
    await page.goto('/tools/photo-automat?qa=1', { waitUntil: 'domcontentloaded' });
    await waitReady(page);
    await page.getByTestId('photo-automat-card').focus();
    await page.keyboard.press('Enter');
    const error = page.getByTestId('photo-automat-error');
    await expect(error).toBeVisible({ timeout: 8_000 });
    await expect(error).toContainText(/denied/i);
    await expect(error).not.toContainText(/getUserMedia|NotAllowedError/);
  });
});

test.describe('Photo Automat mobile', () => {
  const pixel = devices['Pixel 7'];
  test.use({
    viewport: { width: 390, height: 844 },
    userAgent: pixel.userAgent,
    deviceScaleFactor: pixel.deviceScaleFactor,
    isMobile: true,
    hasTouch: true,
  });

  test('390px booth has no horizontal overflow', async ({ page }) => {
    await page.goto('/tools/photo-automat', { waitUntil: 'domcontentloaded' });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await expect(page.getByTestId('photo-automat-card')).toBeVisible();
    await expect(page.getByTestId('photo-automat-frame-3')).toBeVisible();
  });
});
