import { createClient } from '@supabase/supabase-js';
import env from '../config/env.js';
import { StockService } from './stock.service.js';

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
const CACHE_TTL_MINUTES = 5;   // 可改成 1~10 分钟

export class CacheService {
  // 获取缓存或实时刷新
  static async getLatest(symbol: string, include: string[] = ['quote', 'profile', 'metrics']) {
    const { data: cached } = await supabase
      .from('stock_cache')
      .select('data, updated_at')
      .eq('symbol', symbol.toUpperCase())
      .single();

    const now = new Date();
    const cacheAge = cached ? (now.getTime() - new Date(cached.updated_at).getTime()) / 60000 : 999;

    // 缓存有效期内直接返回
    if (cached && cacheAge < CACHE_TTL_MINUTES) {
      return cached.data;
    }

    // 过期或无缓存 → 实时拉取并存入数据库
    const freshData = await StockService.getStockData(symbol, include);

    await supabase
      .from('stock_cache')
      .upsert({ symbol: symbol.toUpperCase(), data: freshData });

    return freshData;
  }

  // 批量缓存（首页用）
  static async getBatchLatest(symbols: string[], include: string[]) {
    const results: Record<string, any> = {};
    for (const symbol of symbols) {
      results[symbol] = await this.getLatest(symbol, include);
    }
    return results;
  }
}
