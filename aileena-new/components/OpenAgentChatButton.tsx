'use client';

export default function OpenAgentChatButton({
  label = 'open site agent',
  testId = 'open-site-agent',
}: {
  label?: string;
  testId?: string;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={() => window.dispatchEvent(new CustomEvent('open-agent-chat'))}
      className="inline-flex min-h-11 items-center font-mono text-[0.62rem] tracking-[0.3em] uppercase text-[#007d75] border border-[#00a89d]/45 bg-white px-4 py-2 hover:bg-[#e9fffc]"
    >
      {label}
    </button>
  );
}
