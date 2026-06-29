import { NextRequest, NextResponse } from 'next/server';
import { MemoryManager } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const memory = new MemoryManager(userId);
    const messages = await memory.getRecentMessages();

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Memory GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch memory' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const memory = new MemoryManager(userId);
    await memory.clearHistory();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Memory DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to clear memory' },
      { status: 500 }
    );
  }
}
