import { Resend } from "resend";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

function looksLikeRealResendKey(key: string): boolean {
  const value = key.trim().replace(/^["']|["']$/g, "");
  if (!value.startsWith("re_")) return false;
  if (/placeholder|your_api|xxx|changeme/i.test(value)) return false;
  return value.length >= 20;
}

// Load API key from environment or .env file
function getResendApiKey(): string | null {
  // First try from process.env (works in production)
  if (process.env.RESEND_API_KEY && looksLikeRealResendKey(process.env.RESEND_API_KEY)) {
    return process.env.RESEND_API_KEY.trim();
  }
  
  // Fallback: read directly from .env file (development)
  const envPath = join(process.cwd(), ".env");
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, "utf-8");
    const match = envContent.match(/RESEND_API_KEY=(.+)/);
    if (match && match[1] && looksLikeRealResendKey(match[1])) {
      return match[1].trim().replace(/^["']|["']$/g, "");
    }
  }
  
  return null;
}

// Función para obtener cliente Resend (lazy initialization)
function getResendClient(): Resend | null {
  const apiKey = getResendApiKey();
  console.log(`📧 [EMAIL] Verificando API key: ${apiKey ? "✅ Configurada (" + apiKey.substring(0, 10) + "...)" : "❌ No encontrada"}`);
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
}

function stripEnvQuotes(value: string): string {
  return value.trim().replace(/^["']|["']$/g, "").trim();
}

/**
 * Sender must be on a Resend-verified domain (e.g. cafe@aileena.xyz).
 * onboarding@resend.dev can ONLY email the Resend account owner.
 */
export function getFromEmail(): string {
  const raw = process.env.FROM_EMAIL;
  if (raw && raw.trim()) {
    return stripEnvQuotes(raw);
  }
  return "Cafe Cursor Shanghai <cafe@aileena.xyz>";
}

export function isTestingOnlyFromAddress(from = getFromEmail()): boolean {
  return /@resend\.dev\b/i.test(from);
}

export function getEmailSendConfig(): {
  from: string;
  replyTo: string;
  organizer: string;
  testingOnlyFrom: boolean;
  hasResendKey: boolean;
} {
  const from = getFromEmail();
  return {
    from,
    replyTo: getNotifyReplyTo(),
    organizer: getNotifyCcEmail(),
    testingOnlyFrom: isTestingOnlyFromAddress(from),
    hasResendKey: Boolean(getResendApiKey()),
  };
}

function assertCanBulkSend(): string | null {
  const from = getFromEmail();
  if (isTestingOnlyFromAddress(from)) {
    return (
      `FROM_EMAIL is still a Resend test address (${from}). ` +
      `Set Vercel o6o4 env FROM_EMAIL=Cafe Cursor Shanghai <cafe@aileena.xyz>, ` +
      `then Redeploy. Domain must be Verified in Resend.`
    );
  }
  return null;
}

/**
 * Organizer inbox for copies / Reply-To — set NOTIFY_CC_EMAIL on Vercel.
 * No personal address hardcoded in source (PII / account safety).
 */
function envEmail(name: string): string {
  return (process.env[name] || "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim()
    .toLowerCase();
}

export function getNotifyCcEmail(): string {
  return envEmail("NOTIFY_CC_EMAIL");
}

export function getNotifyReplyTo(): string {
  return envEmail("NOTIFY_REPLY_TO") || getNotifyCcEmail();
}

/** Resolve From at send-time (so Vercel env changes apply after redeploy). */
function fromAddress(): string {
  return getFromEmail();
}

interface SendCreditEmailParams {
  to: string;
  name: string;
  creditLink: string;
  creditCode: string;
  company?: string;
  isTest?: boolean;
  locale?: "zh" | "en";
}

/**
 * Envía el correo de confirmación con el crédito
 */
export async function sendCreditEmail({
  to,
  name,
  creditLink,
  creditCode,
  company,
  isTest = false,
  locale = "zh",
}: SendCreditEmailParams): Promise<{ success: boolean; error?: string }> {
  // Obtener cliente Resend (lazy)
  const resendClient = getResendClient();
  
  // Si no hay Resend configurado, solo logear (modo desarrollo)
  if (!resendClient) {
    console.log(`📧 [EMAIL] Modo desarrollo - Email simulado`);
    console.log(`   📬 Para: ${to}`);
    console.log(`   👤 Nombre: ${name}`);
    console.log(`   🎫 Crédito: ${creditCode}`);
    console.log(`   🔗 Link: ${creditLink}`);
    console.log(`   🏢 Empresa: ${company || "N/A"}`);
    console.log(`   🧪 Test: ${isTest}`);
    console.log(`   🌐 Locale: ${locale}`);
    console.log(`   ✅ Email simulado con éxito`);
    return { success: true };
  }

  try {
    const subject =
      locale === "zh"
        ? "🎉 你的 Cursor 学分已到 — Cafe Cursor Shanghai"
        : "🎉 Your Cursor credit is here! - Cafe Cursor Shanghai";

    const html = generateEmailHTML({
      name,
      creditLink,
      creditCode,
      company,
      isTest,
      locale,
    });

    console.log(`📧 [EMAIL] Enviando email real a: ${to}`);
    
    const { error } = await resendClient.emails.send({
      from: fromAddress(),
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error(`❌ [EMAIL] Error enviando a ${to}:`, error);
      return { success: false, error: error.message };
    }

    console.log(`✅ [EMAIL] Enviado exitosamente a: ${to}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ [EMAIL] Error inesperado:`, error);
    return { success: false, error: "Failed to send email" };
  }
}

interface SendUnclaimedReminderParams {
  to: string;
  name?: string;
}

/**
 * Reminder for checked-in guests who have not claimed yet.
 * Bilingual (zh+en) so one blast works for everyone. No personal name.
 */
export async function sendUnclaimedReminderEmail({
  to,
}: SendUnclaimedReminderParams): Promise<{ success: boolean; error?: string }> {
  const resendClient = getResendClient();
  const claimUrl =
    (process.env.NEXT_PUBLIC_SITE_URL || "https://cursor-cafe.aileena.xyz").replace(
      /\/$/,
      ""
    ) + "/";
  const subject = "Cafe Cursor Shanghai 20260719";
  const html = generateUnclaimedReminderHTML({ claimUrl });

  if (!resendClient) {
    console.log(`📧 [EMAIL] Dev mode — unclaimed reminder simulated for ${to}`);
    return { success: true };
  }

  try {
    console.log(`📧 [EMAIL] Sending unclaimed reminder to: ${to}`);
    const { error } = await resendClient.emails.send({
      from: fromAddress(),
      to: [to],
      replyTo: getNotifyReplyTo(),
      subject,
      html,
    });

    if (error) {
      console.error(`❌ [EMAIL] Reminder failed for ${to}:`, error);
      return { success: false, error: error.message };
    }

    console.log(`✅ [EMAIL] Reminder sent to: ${to}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ [EMAIL] Reminder unexpected error for ${to}:`, error);
    return { success: false, error: "Failed to send reminder email" };
  }
}

function generateUnclaimedReminderHTML({
  claimUrl,
}: {
  claimUrl: string;
}): string {
  const siteOrigin = claimUrl.replace(/\/$/, "");
  const qrImageUrl = `${siteOrigin}/redeem-qr.png`;

  return `
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cafe Cursor — Claim reminder</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0a0a0a;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:500px;">
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#ffffff;">Cafe Cursor</h1>
              <p style="margin:8px 0 0;font-size:14px;color:#a3a3a3;">Shanghai</p>
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#171717;border:1px solid #262626;border-radius:16px;">
                <tr>
                  <td style="padding:32px;">
                    <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#a3a3a3;">
                      请成功参加线下活动的用户，扫描二维码或者点击链接获取价值 $50 的 credits，成功打开链接后请在 Cursor Balance 查看 credits，之后充值与使用时都可抵扣。欢迎下次再来参与。
                    </p>
                    <p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:#a3a3a3;">
                      Please scan the QR-code or click through the link to redeem your $50 credits. After opening the link, check credits in Cursor Balance — they apply to future top-ups and usage. Looking forward to seeing you next time.
                    </p>

                    <!-- QR code -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:24px;">
                      <tr>
                        <td align="center">
                          <img src="${qrImageUrl}" width="220" height="220" alt="Cafe Cursor redeem QR" style="display:block;width:220px;height:220px;border:0;border-radius:12px;background:#ffffff;" />
                        </td>
                      </tr>
                    </table>

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center" style="padding-bottom:16px;">
                          <a href="${claimUrl}" target="_blank" style="display:inline-block;background-color:#ffffff;color:#0a0a0a;font-size:14px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:12px;">
                            Get your $50 credits →
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#737373;">
                      请用已 checked-in 的 Luma 报名邮箱提交。<br/>
                      Use the same checked-in Luma email on the page.
                    </p>
                    <p style="margin:0;font-size:12px;color:#525252;word-break:break-all;">
                      ${claimUrl}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#737373;">
                如果已经领取过，可以忽略这封邮件。 If you already claimed, ignore this note.
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:#525252;">Cafe Cursor Shanghai 20260719</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

export function getReminderSubject(): string {
  return "Cafe Cursor Shanghai 20260719";
}

function getClaimUrl(): string {
  return (
    (process.env.NEXT_PUBLIC_SITE_URL || "https://cursor-cafe.aileena.xyz").replace(
      /\/$/,
      ""
    ) + "/"
  );
}

/**
 * Send ONE test reminder only to the organizer (no guest BCC).
 */
export async function sendUnclaimedReminderTestToOrganizer(): Promise<{
  success: boolean;
  to: string;
  simulated: boolean;
  error?: string;
}> {
  const to = getNotifyCcEmail();
  if (!to) {
    return {
      success: false,
      to: "",
      simulated: false,
      error: "NOTIFY_CC_EMAIL is not set on this deployment",
    };
  }
  const subject = getReminderSubject();
  const html = generateUnclaimedReminderHTML({ claimUrl: getClaimUrl() });
  const resendClient = getResendClient();

  if (!resendClient) {
    console.log(`📧 [EMAIL] Dev mode — test reminder simulated to ${to}`);
    return { success: true, to, simulated: true };
  }

  try {
    console.log(`📧 [EMAIL] Sending TEST reminder to organizer only: ${to}`);
    const { error } = await resendClient.emails.send({
      from: fromAddress(),
      to: [to],
      replyTo: getNotifyReplyTo(),
      subject: `[TEST] ${subject}`,
      html,
    });
    if (error) {
      console.error(`❌ [EMAIL] Test reminder failed:`, error);
      return { success: false, to, simulated: false, error: error.message };
    }
    console.log(`✅ [EMAIL] Test reminder sent to: ${to}`);
    return { success: true, to, simulated: false };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error(`❌ [EMAIL] Test reminder exception:`, err);
    return { success: false, to, simulated: false, error: message };
  }
}

/**
 * Notify all unclaimed guests with one private email each (not BCC).
 * Recipients cannot see each other. Organizer also gets one copy.
 */
export async function sendUnclaimedReminderBccBlast(
  recipientEmails: string[]
): Promise<{
  sent: number;
  failed: number;
  batches: number;
  failures: { email: string; error: string }[];
  sentEmails: string[];
  simulated: boolean;
  cc: string;
  from: string;
}> {
  const claimUrl = getClaimUrl();
  const subject = getReminderSubject();
  const html = generateUnclaimedReminderHTML({ claimUrl });
  const cc = getNotifyCcEmail();
  const from = fromAddress();

  if (!cc) {
    return {
      sent: 0,
      failed: recipientEmails.length,
      batches: 0,
      failures: [
        {
          email: "(config)",
          error: "NOTIFY_CC_EMAIL is not set on this deployment",
        },
      ],
      sentEmails: [],
      simulated: false,
      cc: "",
      from,
    };
  }

  const blocked = assertCanBulkSend();
  if (blocked) {
    return {
      sent: 0,
      failed: recipientEmails.length,
      batches: 0,
      failures: [{ email: "(config)", error: blocked }],
      sentEmails: [],
      simulated: false,
      cc,
      from,
    };
  }

  const seen = new Set<string>();
  const guests: string[] = [];
  for (const raw of recipientEmails) {
    const email = raw.trim().toLowerCase();
    if (!email.includes("@") || seen.has(email)) continue;
    if (email === cc) continue;
    seen.add(email);
    guests.push(email);
  }

  const resendClient = getResendClient();
  if (!resendClient) {
    console.log(
      `📧 [EMAIL] Dev mode — simulating individual notify to ${guests.length} (+ organizer ${cc}) from=${from}`
    );
    return {
      sent: guests.length,
      failed: 0,
      batches: 0,
      failures: [],
      sentEmails: guests,
      simulated: true,
      cc,
      from,
    };
  }

  console.log(`📧 [EMAIL] Bulk notify from=${from} guests=${guests.length}`);

  let sent = 0;
  let failed = 0;
  let batches = 0;
  const failures: { email: string; error: string }[] = [];
  const sentEmails: string[] = [];

  // Organizer copy first
  try {
    batches += 1;
    const { error } = await resendClient.emails.send({
      from,
      to: [cc],
      replyTo: getNotifyReplyTo(),
      subject: `[COPY] ${subject}`,
      html,
    });
    if (error) {
      failures.push({ email: cc, error: `${error.message} (From: ${from})` });
    }
  } catch (err) {
    failures.push({
      email: cc,
      error: `${err instanceof Error ? err.message : "unknown"} (From: ${from})`,
    });
  }

  const CHUNK = 40;
  let abortRemaining: string | null = null;

  for (let i = 0; i < guests.length; i += CHUNK) {
    if (abortRemaining) break;
    const chunk = guests.slice(i, i + CHUNK);
    batches += 1;

    for (const email of chunk) {
      try {
        const one = await resendClient.emails.send({
          from,
          to: [email],
          replyTo: getNotifyReplyTo(),
          subject,
          html,
        });
        if (one.error) {
          failed += 1;
          const msg = `${one.error.message} (From: ${from})`;
          failures.push({ email, error: msg });
          if (/only send testing emails|verify a domain/i.test(one.error.message)) {
            abortRemaining =
              `From is still testing-only (${from}). ` +
              `On Vercel o6o4 set FROM_EMAIL=Cafe Cursor Shanghai <cafe@aileena.xyz> ` +
              `(must match Resend verified domain), Redeploy, then retry. ` +
              `Test-to-yourself can succeed even when guest send is blocked.`;
            break;
          }
          if (/daily_quota_exceeded|monthly_quota_exceeded|quota/i.test(one.error.message)) {
            abortRemaining =
              `Resend quota exceeded (${one.error.message}). ` +
              `Successfully marked ${sent} sends; remaining guests were not emailed. ` +
              `Retry tomorrow or upgrade Resend plan.`;
            break;
          }
        } else {
          sent += 1;
          sentEmails.push(email);
        }
      } catch (err) {
        failed += 1;
        failures.push({
          email,
          error: `${err instanceof Error ? err.message : "unknown"} (From: ${from})`,
        });
      }
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  if (abortRemaining) {
    const already = new Set([
      ...failures.map((f) => f.email),
      ...sentEmails,
    ]);
    for (const email of guests) {
      if (already.has(email)) continue;
      failed += 1;
      failures.push({ email, error: abortRemaining });
    }
  }

  return { sent, failed, batches, failures, sentEmails, simulated: false, cc, from };
}

/** @deprecated Prefer sendUnclaimedReminderBccBlast for privacy (BCC). */
export async function sendUnclaimedReminderBatch(
  recipients: { to: string; name?: string }[]
): Promise<{
  sent: number;
  failed: number;
  failures: { email: string; error: string }[];
  simulated: boolean;
}> {
  const result = await sendUnclaimedReminderBccBlast(
    recipients.map((r) => r.to)
  );
  return {
    sent: result.sent,
    failed: result.failed,
    failures: result.failures,
    simulated: result.simulated,
  };
}

/**
 * Genera el HTML del correo manteniendo la estética de la landing
 */
function generateEmailHTML({
  name,
  creditLink,
  creditCode,
  company,
  isTest,
  locale,
}: Omit<SendCreditEmailParams, "to">): string {
  const isZh = locale === "zh";

  const texts = {
    greeting: isZh ? `你好，${name}！` : `Hello, ${name}!`,
    thanks: isZh
      ? "感谢参加 Cafe Cursor Shanghai！"
      : "Thank you for checking in at Cafe Cursor Shanghai!",
    intro: isZh
      ? "这是你的专属 Cursor credits 链接："
      : "Here's your exclusive Cursor credits link:",
    yourCredit: isZh ? "你的 Cursor credits" : "Your Cursor credits",
    code: isZh ? "代码" : "Code",
    useCredit: isZh ? "使用我的 credits" : "Use my Cursor credits",
    testWarning: isZh
      ? "⚠️ 这是测试 credits（不可用于正式使用）"
      : "⚠️ This is a TEST credit (not valid for real use)",
    howToUse: isZh ? "使用方法：" : "How to use:",
    step1: isZh
      ? "点击上方按钮或复制链接"
      : "Click the button above or copy the link",
    step2: isZh
      ? "打开链接后请在 Cursor Balance 查看 credits，之后充值与使用时都可抵扣"
      : "After opening the link, check credits in Cursor Balance — they apply to future top-ups and usage",
    step3: isZh
      ? "请保存此链接，每人唯一"
      : "Save this link — it's unique to you",
    questions: isZh
      ? "遇到问题？请找现场工作人员帮忙。"
      : "Having trouble? Please ask the staff for help.",
    footer: isZh
      ? "☕ Cafe Cursor Shanghai · Aileen"
      : "Made with ☕ by Aileen - Cafe Cursor Shanghai",
    companyLabel: isZh ? "公司" : "Company",
  };

  return `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cafe Cursor - ${texts.yourCredit}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 500px;">
          
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <svg width="48" height="55" viewBox="0 0 466.73 532.09" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M457.43,125.94L244.42,2.96c-6.84-3.95-15.28-3.95-22.12,0L9.3,125.94c-5.75,3.32-9.3,9.46-9.3,16.11v247.99c0,6.65,3.55,12.79,9.3,16.11l213.01,122.98c6.84,3.95,15.28,3.95,22.12,0l213.01-122.98c5.75-3.32,9.3-9.46,9.3-16.11v-247.99c0-6.65-3.55-12.79-9.3-16.11ZM444.05,151.99l-205.63,356.16c-1.39,2.4-5.06,1.42-5.06-1.36v-233.21c0-4.66-2.49-8.97-6.53-11.31L24.87,145.67c-2.4-1.39-1.42-5.06,1.36-5.06h411.26c5.84,0,9.49,6.33,6.57,11.39Z" fill="#ffffff"/>
              </svg>
            </td>
          </tr>

          <!-- Título -->
          <tr>
            <td align="center" style="padding-bottom: 8px;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                Cafe Cursor
              </h1>
            </td>
          </tr>

          <!-- Subtítulo -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <p style="margin: 0; font-size: 14px; color: #a3a3a3;">
                Shanghai
              </p>
            </td>
          </tr>

          <!-- Card principal -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #171717; border: 1px solid #262626; border-radius: 16px;">
                <tr>
                  <td style="padding: 32px;">
                    
                    <!-- Saludo -->
                    <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #ffffff;">
                      ${texts.greeting}
                    </h2>
                    <p style="margin: 0 0 24px 0; font-size: 14px; color: #10b981; font-weight: 500;">
                      ${texts.thanks}
                    </p>
                    
                    <!-- Intro -->
                    <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #a3a3a3;">
                      ${texts.intro}
                    </p>

                    <!-- Info del usuario -->
                    ${company ? `
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a0a; border-radius: 12px; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 16px;">
                          <p style="margin: 0 0 4px 0; font-size: 12px; color: #737373; text-transform: uppercase; letter-spacing: 0.5px;">
                            ${texts.companyLabel}
                          </p>
                          <p style="margin: 0; font-size: 14px; color: #ffffff;">
                            ${company}
                          </p>
                        </td>
                      </tr>
                    </table>
                    ` : ""}

                    <!-- Warning de test -->
                    ${isTest ? `
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #78350f; border: 1px solid #92400e; border-radius: 12px; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 12px 16px;">
                          <p style="margin: 0; font-size: 12px; color: #fbbf24; text-align: center;">
                            ${texts.testWarning}
                          </p>
                        </td>
                      </tr>
                    </table>
                    ` : ""}

                    <!-- Box del crédito -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a0a; border: 1px solid #262626; border-radius: 12px; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 20px;">
                          <p style="margin: 0 0 8px 0; font-size: 10px; color: #737373; text-transform: uppercase; letter-spacing: 1px; font-weight: 500;">
                            ${texts.yourCredit}
                          </p>
                          <p style="margin: 0 0 4px 0; font-size: 12px; color: #a3a3a3;">
                            ${texts.code}: <span style="font-family: monospace; color: #ffffff;">${creditCode}</span>
                          </p>
                          <p style="margin: 0; font-size: 11px; color: #737373; word-break: break-all; font-family: monospace;">
                            ${creditLink}
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Botón CTA -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center">
                          <a href="${creditLink}" target="_blank" style="display: inline-block; background-color: #ffffff; color: #0a0a0a; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 12px;">
                            ${texts.useCredit} →
                          </a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Instrucciones -->
          <tr>
            <td style="padding: 32px 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #171717; border: 1px solid #262626; border-radius: 12px;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #ffffff;">
                      ${texts.howToUse}
                    </p>
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding-bottom: 8px;">
                          <span style="display: inline-block; width: 20px; height: 20px; background-color: #262626; border-radius: 50%; text-align: center; line-height: 20px; font-size: 11px; color: #ffffff; margin-right: 12px;">1</span>
                          <span style="font-size: 13px; color: #a3a3a3;">${texts.step1}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 8px;">
                          <span style="display: inline-block; width: 20px; height: 20px; background-color: #262626; border-radius: 50%; text-align: center; line-height: 20px; font-size: 11px; color: #ffffff; margin-right: 12px;">2</span>
                          <span style="font-size: 13px; color: #a3a3a3;">${texts.step2}</span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <span style="display: inline-block; width: 20px; height: 20px; background-color: #262626; border-radius: 50%; text-align: center; line-height: 20px; font-size: 11px; color: #ffffff; margin-right: 12px;">3</span>
                          <span style="font-size: 13px; color: #a3a3a3;">${texts.step3}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 16px; border-top: 1px solid #262626;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #737373;">
                ${texts.questions}
              </p>
              <p style="margin: 0; font-size: 11px; color: #525252;">
                ${texts.footer}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}
