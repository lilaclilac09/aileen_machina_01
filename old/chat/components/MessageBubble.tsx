'use client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] p-4 rounded-lg ${
          isUser
            ? 'bg-gradient-to-br from-metal-accent to-metal-light border border-neon-red/30'
            : 'mech-panel border-l-2 border-neon-cyan'
        }`}
      >
        <div className="flex items-start gap-3">
          {!isUser && (
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center text-xs font-bold">
              A
            </div>
          )}
          <div className="flex-1">
            <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
            <div className="mt-2 text-xs text-gray-500">
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          </div>
          {isUser && (
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-neon-red to-metal-accent flex items-center justify-center text-xs font-bold">
              U
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
