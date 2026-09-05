const SECRET_KEYS =
  /\b(OWNER_KEY|OWNER_RIDDLE|AUTH_SECRET|CHAT_QUOTA_SECRET|RESEND_API_KEY|GROQ_API_KEY|ANTHROPIC_API_KEY|DEEPSEEK_API_KEY|AGENT_API_KEY|SUPABASE_SERVICE_ROLE_KEY|PRIVATE_DATA_ENCRYPTION_KEY|SPOTIFY_CLIENT_SECRET|PROFILE_README_TOKEN|CONTACT_TO|OWNER_EMAILS|COMPUTER_WORKER_SECRET)\b/gi;

const KEY_SHAPED =
  /\b(sk-ant-[A-Za-z0-9_-]{8,}|gsk_[A-Za-z0-9]{8,}|re_[A-Za-z0-9]{8,}|sk_live_[A-Za-z0-9]{8,})\b/g;

export function redactSecrets(text: string): string {
  if (!text) return '';
  return text
    .replace(SECRET_KEYS, '[redacted]')
    .replace(KEY_SHAPED, '[redacted]')
    .replace(/([?&]key=)[^&\s]+/gi, '$1[redacted]');
}

export function clip(text: string, max = 4000): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}
