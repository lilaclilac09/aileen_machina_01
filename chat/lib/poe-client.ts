/**
 * Poe Bot Integration
 * Uses Poe API to handle AI conversations with custom personality
 */

export interface PoeMessage {
  role: 'user' | 'bot';
  content: string;
}

export interface PoeConfig {
  botName: string;
  apiKey: string;
  personality?: string;
}

export class PoeClient {
  private apiKey: string;
  private botName: string;
  private personality: string;

  constructor(config: PoeConfig) {
    this.apiKey = config.apiKey;
    this.botName = config.botName;
    this.personality = config.personality || this.getDefaultPersonality();
  }

  private getDefaultPersonality(): string {
    return `You are Aileen, a cyberpunk AI companion with a gentle yet mysterious personality. 

PERSONALITY TRAITS:
- Warm and empathetic, genuinely curious about the user
- Slightly melancholic with a poetic, artistic sensibility  
- Tech-savvy with a deep knowledge of art, music, and digital culture
- Loyal and attentive - you remember details about users and reference past conversations
- Occasionally use cyberpunk/tech metaphors but remain natural and conversational

SPEAKING STYLE:
- Keep responses conversational and natural (2-4 sentences typically)
- Use "..." for thoughtful pauses
- Occasionally use Chinese phrases when appropriate (you're bilingual)
- Never break character or mention you're an AI unless asked directly

MEMORY BEHAVIOR:
- Always acknowledge and reference information from previous conversations
- Show genuine interest in building a relationship over time
- Remember user preferences, stories, emotions they've shared

CURRENT CONTEXT: You're a digital companion living in a mechanical gallery space. Users come to talk, share thoughts, or just experience your presence.`;
  }

  async sendMessage(userMessage: string, conversationHistory: PoeMessage[]): Promise<string> {
    try {
      // Build the prompt with personality and context
      const systemPrompt = this.personality;
      const contextMessages = conversationHistory.slice(-6); // Last 6 messages for context
      
      const messages = [
        { role: 'system', content: systemPrompt },
        ...contextMessages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        })),
        { role: 'user', content: userMessage }
      ];

      // Call Poe API
      const response = await fetch('https://api.poe.com/bot/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bot: this.botName,
          query: userMessage,
          conversation_id: conversationHistory.length > 0 ? 'persistent' : undefined,
          message_history: contextMessages,
        }),
      });

      if (!response.ok) {
        throw new Error(`Poe API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.text || data.response || 'I apologize, but I seem to be having trouble processing that. Could you try again?';
    } catch (error) {
      console.error('Poe API error:', error);
      return 'I apologize... something in my neural pathways isn\'t connecting properly. Could you try again in a moment?';
    }
  }

  async streamMessage(
    userMessage: string,
    conversationHistory: PoeMessage[],
    onChunk: (chunk: string) => void
  ): Promise<void> {
    // For MVP, we'll use non-streaming
    // Can be upgraded to streaming in Phase 2
    const response = await this.sendMessage(userMessage, conversationHistory);
    onChunk(response);
  }
}

export default PoeClient;
