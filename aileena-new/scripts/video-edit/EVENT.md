# Cafe Cursor Shanghai — Soft Yaps 合集

> Event: **Cafe Cursor Shanghai 20260719**  
> Product: https://cursor-cafe.aileena.xyz/  
> Brand resolve inbox: **cafe@aileena.xyz**（客人只见品牌，不见私人邮箱）  
> 原则：**对外 soft / 对内硬**；不公开「换 credits / swap / re-issue」话术。

本文档汇总现场与会后反复用到的 soft copy、对内 SOP、账本口径、以及给 Ben 的叙事要点。  
代码来源以 `lib/translations.ts`、Admin dashboard、PR #287 / #290 / #308 / #309 为准。

---

## 0. 硬边界（先背这几条）

| 场景 | 对外（客人） | 对内（志愿者 / Admin） |
|------|--------------|------------------------|
| 签到邮箱 ≠ 领取邮箱 | 只说「请联系志愿者」 | Protocol A：优先用签到邮箱领取；否则 Admin Assign → 当面交链接 |
| credits 没到账 | 先自查（点白键 / 邮箱一致 / 完成登录）→ 找志愿者 → 活动后 `cafe@aileena.xyz` | Admin 按签到邮箱核对；必要时 Assign / Revoke |
| 公开页 | **禁止**「换 credits / 互换 / 重新发放」 | 私聊 / Admin SOP 可以说操作步骤 |
| Have / Need | 客人看不见面值明细 | Admin 用配置面值 `$N`（默认 $50）；**无法**从未兑换 referral 自动识别 $30 vs $50 |
| Used | — | = 系统内已 Assign（`isUsed`），**不是** Cursor.com 已兑换的证明 |
| Revoke | — | 系统内回到 Available 可再发；若客人已在 Cursor.com 兑换，Cursor 侧可能已消耗 |
| 隐私 | Reply-To / From 品牌邮箱 | 私人联系方式仅 env；勿写进公开页 |

---

## 1. Protocol A — 邮箱不一致（对外 soft）

**Chosen protocol：** 公开页只引导联系志愿者；不提 swap。

### 中文（公开）

- 如果签到的邮箱和实际领取的邮箱不同，请联系志愿者。
- （领取失败 / not eligible）请联系志愿者协助。

### English（public）

- If your Luma check-in email differs from the email you’re redeeming with, please contact a volunteer.
- (Claim denied / not eligible) Please contact a volunteer for help.

### 对内 Volunteer SOP（私聊 / Admin 面板可复制）

1. Confirm Luma check-in.  
2. Admin search **check-in email** — not claimed?  
3. Prefer: guest redeems with **check-in email**.  
4. Else: Admin **Assign** to check-in email → hand link **in person**.  
5. Already claimed → Admin only; never re-show link on public page.

PR: [#287](https://github.com/lilaclilac09/aileen_machina_01/pull/287)（#286 closed as superseded）

---

## 2. 成功页 — 必须点白色「使用 credits →」

> 仅复制链接不够。必须点白键打开，credits 才会进 Cursor 账户。

### 中文

**重要：一定要点击白色「使用 credits →」按键打开链接，否则 credits 不会充进你的 Cursor 账户。仅复制链接不够。**

点击白色按键打开链接后，请在 Cursor Balance 确认 credits 已到账；之后充值与使用时都可抵扣。

### English

**Important: you must tap the white “Use credits →” button to open the link, or credits will not be added to your Cursor account. Copying alone is not enough.**

After tapping the white button and opening the link, check Cursor Balance to confirm credits arrived — they apply to future top-ups and usage.

PR: [#309](https://github.com/lilaclilac09/aileen_machina_01/pull/309)（open — merge when ready）

---

## 3. 自查 Troubleshoot（页面提示，不会自动发送）

标题：**遇到问题？ / Having trouble?**  
副标：**先自查（页面提示，不会自动发送）**

### 中文

1. **常见原因：**  
   ① 没点白色「使用 credits →」；  
   ② Cursor 登录邮箱 ≠ Luma 报名/签到邮箱；  
   ③ 打开链接但没完成登录/确认。  
2. **一般到这里看有没有到账：** https://cursor.com/dashboard/usage  
3. **核对：** Cursor 当前登录邮箱必须 = Luma 当时注册/签到的邮箱。  
4. **自查仍不行 → 统一找现场志愿者处理**（不要自己反复换邮箱乱试）。志愿者会按签到邮箱帮你核对 / 必要时后台协助。  
5. **活动后可发邮件统一处理：** cafe@aileena.xyz

### English

1. **Common causes:** (1) didn’t tap white “Use credits →”; (2) Cursor login email ≠ Luma register/check-in email; (3) opened the link but didn’t finish login/confirm.  
2. **Usually check whether it landed here:** https://cursor.com/dashboard/usage  
3. **Verify:** your current Cursor login email must equal the Luma register/check-in email.  
4. **Still stuck → ask an on-site volunteer** (one unified path — don’t keep trying random emails). Volunteers verify against the check-in email / assist via Admin if needed.  
5. **After the event, email for unified follow-up:** cafe@aileena.xyz

**统一解决路径（对外一句话）：**  
现场 → 志愿者；活动后 → `cafe@aileena.xyz`。不要让客人自己乱试邮箱。

---

## 4. 领取页基础话术（现行）

| Key | 中文 | English |
|-----|------|---------|
| subtitle | 领取你的 Cursor credits。 | Get your Cursor credits. |
| footerNote | 仅限 Luma 报名名单中签到 / checked in 的邮箱领取 credits。 | Only checked-in emails on the Luma guest list can redeem credits. |
| notEligible | 请先找工作人员完成现场 Luma checked in，再来领取。 | Please ask the staff to check you in on Luma first, then redeem. |
| alreadyClaimedAskStaff | 链接不会再次显示。如需找回，请找现场工作人员或 Admin。 | Your link is not shown again here. Ask staff or Admin if you need it. |
| shareMessage | 🚀 刚在 Cafe Cursor Shanghai 领到 @cursor_ai credits！感谢社区。#CafeCursorShanghai #CursorAI | 🚀 Just got @cursor_ai credits at Cafe Cursor Shanghai! Thanks to the community. #CafeCursorShanghai #CursorAI |

---

## 5. Admin 账本口径（Have / Need / Used / Revoke）

### Have / Need（#290 merged）

- `have = availableCount × $N`  
- `need = unclaimedCount × $N`  
- `$N` = `CREDIT_DENOMINATION_USD`（默认 **50**）  
- **不能**从未兑换的 Cursor referral 链接自动识别面值（$30 vs $50）。  
- UI 永不出现空的 `have ,` / `need …`。

Soft 解释给同事：

> Unredeemed Cursor referral links don’t expose face value. We book Have/Need at the configured denomination so ops can see stock vs demand in one glance.

### Used / Revoke / Audit（#308 merged）

- **Used** = assigned in cafe-cursor（`isUsed=true`），不是 Cursor.com 已兑证明。  
- **Revoke** → 回到 Available（系统内可再发）；Cursor.com 若已兑则那边可能已消耗。  
- Filter **Revoked (not kept)** = `timesRevoked > 0 && !isUsed`。  
- Ops 计数：ADD / ASSIGN / REVOKE；历史 revoke **不回填**。  
- Deploy 后需：`prisma db push`（audit 字段）。

---

## 6. 邮件 / 品牌边界

- Guest From / Reply-To：**Cafe Cursor Shanghai \<cafe@aileena.xyz\>**  
- 私人 inbox 不进客人可见文案。  
- Admin 自测邮件可提示：客人只见 Reply-To `cafe@aileena.xyz`。

---

## 7. 给 Ben 的叙事骨架（English letter / Slack wrap-up）

> 聊天稿整理；按需裁剪。语气：结果导向 + 社区主导 + 诚实复盘 + 明确 Pilot ask。

### Outcomes / vibe

- Guest-led showcase（非预排脚本）；suitcase / pre-flight demos；international guests；rainstorm ops；KOL aftercare。  
- Feedback ~95–99% positive；strong demand for next event.  
- Ask: **China Pilot** continue / expand.

### Expense reconciliation（三桶）

- Budget vs actual（按你们账本数字填）。  
- Bucket 1 / 2 / 3（场地·物料·运营等，按实际表）。  
- Volunteer credits：例如 **7 × $300**（以最终账为准）。  
- Out-of-pocket：例如 **$278**（以最终账为准）。

### Operating compensation proposal（单独提案，可拆信）

- Soft ask：**¥60,000** operating compensation（markdown 草稿曾在聊天里；未默认入库为正式财务文件）。  
- 对外公开场合不提个人补偿数字；只在对 Ben / Cursor 私信渠道。

### Soft public vs private（写进信里的一句）

> Guests who hit email mismatch are guided to **contact a volunteer** only — we do **not** advertise public credit swaps.

---

## 8. 一句话速查卡（打印 / 志愿者微信）

**客人：**  
没到账？① 点白色「使用 credits →」② Cursor 登录邮箱 = Luma 签到邮箱 ③ usage 页确认 → 还不行找志愿者 / 活动后 cafe@aileena.xyz  

**志愿者：**  
核对签到 → 尽量用签到邮箱领取 → 不行就 Admin Assign 到签到邮箱 → 当面交链接 → 已领过只走 Admin  

**禁止公开说：** 换 credits / 互换 / 重新发一份  

---

## 9. 相关 PR 状态（文档写入时）

| PR | Topic | State |
|----|--------|-------|
| #287 | Protocol A — private volunteer SOP | OPEN |
| #290 | Have/Need ledger $50 configured | MERGED |
| #308 | Used flag + ADD/ASSIGN/REVOKE audit | MERGED（需 prisma db push） |
| #309 | Must tap Use credits + troubleshoot | OPEN |
| #286 | contact volunteer（superseded by #287） | CLOSED |

---

## 10. 维护约定

- 改客人可见文案 → 先改 `cafe-cursor/lib/translations.ts`，再同步本节。  
- 改对内 SOP → 同步 #287 Admin 面板 copy 与本节 §1。  
- 财务数字（$278 / 7×$300 / ¥60,000）以最新对账表为准，改数字时更新 §7，勿当死代码。
