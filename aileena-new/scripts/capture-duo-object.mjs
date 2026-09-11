import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const out = "/opt/cursor/artifacts";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });

async function capture(name, { w, h, after }) {
  const context = await browser.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3000/sound/duo", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector("[data-duo-mode]");
  await page.waitForTimeout(700);
  if (after) await after(page);
  await page.waitForTimeout(500);
  const path = `${out}/${name}`;
  await page.screenshot({ path, fullPage: false });
  const meta = await page.evaluate(() => {
    const root = document.querySelector("[data-duo-mode]");
    return {
      mode: root?.getAttribute("data-duo-mode"),
      skin: root?.getAttribute("data-duo-skin"),
      light: root?.getAttribute("data-duo-light"),
      overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
    };
  });
  await context.close();
  return { path, meta };
}

const clickK = (page, label) =>
  page.locator(".duo-k", { hasText: new RegExp(`^${label}$`, "i") }).first().click();

const shots = [];
shots.push(await capture("duo_object_v2_heat_tent.png", { w: 1280, h: 800 }));
shots.push(
  await capture("duo_object_v2_heat_hold.png", {
    w: 1280,
    h: 800,
    after: async (page) => {
      await clickK(page, "hold");
    },
  }),
);
shots.push(
  await capture("duo_object_v2_ember_rest.png", {
    w: 1280,
    h: 800,
    after: async (page) => {
      await clickK(page, "ember");
      await clickK(page, "clock");
      await clickK(page, "rest");
    },
  }),
);
shots.push(
  await capture("duo_object_v2_kiln_tent.png", {
    w: 1280,
    h: 800,
    after: async (page) => {
      await clickK(page, "kiln");
    },
  }),
);
shots.push(
  await capture("duo_object_v2_aurora_tent.png", {
    w: 1280,
    h: 800,
    after: async (page) => {
      await clickK(page, "aurora");
    },
  }),
);
shots.push(
  await capture("duo_object_v2_signal_notify.png", {
    w: 1280,
    h: 800,
    after: async (page) => {
      await clickK(page, "signal");
      await clickK(page, "notify");
    },
  }),
);
shots.push(
  await capture("duo_object_v2_heat_tent_390.png", { w: 390, h: 844 }),
);

const videoCtx = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 2,
  recordVideo: { dir: out, size: { width: 1280, height: 800 } },
});
const videoPage = await videoCtx.newPage();
await videoPage.goto("http://127.0.0.1:3000/sound/duo", { waitUntil: "networkidle", timeout: 60000 });
await videoPage.waitForTimeout(800);
await clickK(videoPage, "hold");
await videoPage.waitForTimeout(900);
await clickK(videoPage, "tent");
await videoPage.waitForTimeout(700);
await clickK(videoPage, "ember");
await clickK(videoPage, "clock");
await clickK(videoPage, "rest");
await videoPage.waitForTimeout(900);
await clickK(videoPage, "kiln");
await clickK(videoPage, "tent");
await videoPage.waitForTimeout(700);
await clickK(videoPage, "aurora");
await videoPage.waitForTimeout(500);
await clickK(videoPage, "signal");
await clickK(videoPage, "notify");
await videoPage.waitForTimeout(900);
const rawVideo = await videoPage.video().path();
await videoCtx.close();
const { rename } = await import("node:fs/promises");
const videoPath = `${out}/duo_object_v2_tent_hold_rest_skins.webm`;
await rename(rawVideo, videoPath);

await browser.close();
console.log(JSON.stringify({ shots, videoPath }, null, 2));
