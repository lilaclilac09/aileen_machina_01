import { Redis } from '@upstash/redis';

let redisClient: Redis | null = null;

function getRedisClient(): Redis {
  if (redisClient) {
    return redisClient;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error('Missing Upstash Redis environment variables. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.');
  }

  redisClient = new Redis({ url, token });
  return redisClient;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export class MemoryManager {
  private userId: string;
  private maxMessages: number;

  constructor(userId: string, maxMessages: number = 20) {
    this.userId = userId;
    this.maxMessages = maxMessages;
  }

  private getKey(): string {
    return `chat:${this.userId}`;
  }

  async addMessage(message: ChatMessage): Promise<void> {
    const redis = getRedisClient();
    const key = this.getKey();
    await redis.zadd(key, {
      score: message.timestamp,
      member: JSON.stringify(message),
    });
    
    // Keep only the most recent messages
    const count = await redis.zcard(key);
    if (count > this.maxMessages) {
      await redis.zpopmin(key, count - this.maxMessages);
    }
  }

  async getRecentMessages(limit?: number): Promise<ChatMessage[]> {
    const redis = getRedisClient();
    const key = this.getKey();
    const messages = await redis.zrange(key, 0, -1);
    
    const parsed = messages.map(msg => 
      typeof msg === 'string' ? JSON.parse(msg) : msg
    ) as ChatMessage[];
    
    return limit ? parsed.slice(-limit) : parsed;
  }

  async clearHistory(): Promise<void> {
    const redis = getRedisClient();
    await redis.del(this.getKey());
  }

  async getContext(): Promise<string> {
    const messages = await this.getRecentMessages(10);
    return messages
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');
  }
}

export { getRedisClient };
