import { NextRequest, NextResponse } from 'next/server';
import { MemoryManager } from '@/lib/redis';
import PoeClient from '@/lib/poe-client';
import type { PoeMessage } from '@/lib/poe-client';

export async function POST(request: NextRequest) {
  try {
    const { message, userId } = await request.json();

    if (!message || !userId) {
      return NextResponse.json(
        { error: 'Message and userId are required' },
        { status: 400 }
      );
    }

    // Initialize memory manager
    const memory = new MemoryManager(userId);

    // Get conversation history
    const history = await memory.getRecentMessages();
    const poeHistory: PoeMessage[] = history.map(msg => ({
      role: msg.role === 'assistant' ? 'bot' : 'user',
      content: msg.content,
    }));

    // Initialize Poe client
    const poeClient = new PoeClient({
      botName: process.env.POE_BOT_NAME || 'Assistant',
      apiKey: process.env.POE_API_KEY!,
    });

    // Get AI response
    const response = await poeClient.sendMessage(message, poeHistory);

    // Save both user message and bot response to memory
    const timestamp = Date.now();
    await memory.addMessage({
      role: 'user',
      content: message,
      timestamp,
    });
    await memory.addMessage({
      role: 'assistant',
      content: response,
      timestamp: timestamp + 1,
    });

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Bot API error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
