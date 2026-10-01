# Agent prompt — `/daily` two lines as a shareable sheet + ship

Copy everything under **PASTE THIS** into another agent. Do not implement from this file unless that is the task.

Source thread: https://cursor.com/agents/bc-bea59ea9-6b4f-46e2-ba26-52b54cf1ff50  
Sister (computer pad, do not reuse as the daily product): https://cursor.com/agents/bc-44a2e5a6-ac25-4c07-8cc7-f22358157f4a · draft PR #519 — **do not merge #519**

---

## PASTE THIS

```txt
follow AGENTS.md, QA.md, and /docs/aileena-design-os.md. no screenshots = not done. no owner approval = no merge.
先不要写代码，先读相关文件并给我最小修改计划。

Repo: lilaclilac09/aileen_machina_01
App: aileena-new/ (pnpm). Route: https://www.aileena.xyz/daily  (title: two lines)

## Job

Make /daily (“two lines”) work like a shareable Google Sheet / Google Doc:

- I can type.
- I can share a link so other people can open the same page.
- Visitors can view what I shared. They cannot edit the main note until I grant that (view-only for now).
- I have one owner-only ship/publish button. Only I see it. Clicking it ships the current lines so visitors can see them.
- I can keep editing before I ship (draft = only me).
- Keep the existing one-pic snap: visitor opens it, then it burns / disappears.

References I named: https://telegra.ph · https://txt.fyi · “alike google doc”

## My original words (do not lose these)

1) /daily product (this is the two-lines ask):

for https://www.aileena.xyz/daily we need a pulish system hwere i am the owner alike google doc thet i can edit until i grant other which they can view only for now make this product exctely able to publish lu thought and any thime ansd add that publish button from myside only and other vuisotors can only see what i shre en able a pic one pic like snap shot and if you see it the pic will disappeer and burned

(also pasted https://telegra.ph and https://txt.fyi)

2) Button look (same thread, later):

这个需要 merge … 还有 弄的 好看带你这个按键 就是 一个 cta 就行 和上面风格相近 的 一个submit 和整体要搭配 还要固定字体

3) How I later recapped it (same meaning, different nouns):

find out what i said about two lines should be look like google sheet where i can share and typea nd aad the button of shipping

Interpretation: “google sheet” = shareable typed surface. “shipping button” = owner-only publish/ship. Original nouns were google doc + publish.

4) Computer sister ask (NOT this job — do not rebuild /proof pad):

其他人不可以用吗 你 做成像google doc 一样呢 大家都可以看 都可以 共享 请求 代码编程 再回来呢

That became draft PR #519. Do not merge #519. Do not move two lines onto /proof.

## What already exists (inspect first — do not invent a second daily)

- UI: aileena-new/components/DailyBoard.tsx
- Page: aileena-new/app/daily/page.tsx
- Store: aileena-new/lib/dailyBoard.ts · dailyBoardStore.ts
- APIs: aileena-new/app/api/daily/**  (notes, theme, comments, snap, snap/open)
- Verify: pnpm verify:daily-board · scripts/verify-daily-board.ts · e2e/daily-board.spec.ts
- Design OS: docs/aileena-design-os.md § /daily — two lines
- Shipped: PR #516 owner submit CTA (data-testid=daily-publish, visible label “submit”, publishes draft)
- Title on page: two lines / one or two lines a day.
- Owner textarea: write one or two lines. Draft badge: draft · only you. After ship: published.
- Visitors: published notes + anonymous bubbles. No owner editor. No submit.
- Snap: seal → see → burn already wired.
- Persistence: Redis when configured; otherwise memory (this instance).

## Gaps vs the ask (this is the work)

- It is a cream note board, not a shareable sheet/doc (no grid, no share URL, no “anyone with the link”).
- No share action that copies a link others can open to the same shipped lines.
- Visitors cannot type the main note (correct for now). They also cannot open a dedicated shared-view URL that feels like a Sheet/Doc.
- Ship control is labeled submit, not a clear ship/publish. Keep one CTA, same Nunito/submit look as send — do not bring back the outlined PUBLISH pill.
- Design OS still says Apple Notes + quiet iMessage. Preserve mood (cream/teal, thin type, no OWNER KEY, no admin chrome). Sheet/Doc is the share/type/ship behavior, not a Google embed and not Material Sheets chrome.

## Constraints

- One vertical slice. Do not redesign the site. Do not create a parallel /notes or /sheet app.
- Do not embed a live Google Sheet unless I give a sheet URL (I did not).
- Do not put OWNER KEY or “Visitors cannot…” in the public flow.
- Do not invent daily copy / living / film notes.
- Do not merge PR #519. Do not treat localhost as production proof.
- Multi-system or visual-direction change: inspect → plan, wait for confirmation, then patch.
- App is aileena-new/, pnpm.

## Done looks like

1. Owner can type today’s lines (already mostly true — keep it).
2. Owner has one ship CTA (keep submit look, or label it ship if it still matches send). Draft stays private until ship.
3. Owner can share a link. Opening that link as a visitor shows only shipped lines (view-only).
4. Visitor never sees the ship button or the draft.
5. Snap burn still works.
6. Screenshots + interaction on /daily (390 and desktop): type → ship → open share link as visitor.
7. pnpm verify:daily-board green. Scoped lint/tsc on files you touch.
8. Evidence closer filled. safe to merge: no until I approve.

Do not mark done from code inspection.
```

---

## Provenance (for humans, not required in the paste)

| Item | Where |
|------|--------|
| Daily google-doc + publish + snap | This cloud agent user message (two-lines thread) |
| Submit CTA restyle | Same thread → PR #516 merged |
| “google sheet / shipping” recap | Same thread, later recap of the same ask |
| Computer google-doc share pad | Agent `bc-44a2e5a6` → draft PR #519, not merged |
| Early /daily spec | Mixer agent: private-write / public-read, title two lines |

Do not treat cafe-cursor Google Sheet credit sync (PRs #218 / #224 / #239) as this product.
