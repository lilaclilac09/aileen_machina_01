import { Hono } from 'hono';
import { StockService } from '../services/stock.service.js';
import env from '../config/env.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

const apiStocks = new Hono();

// ==================== 手机自选股票管理 ====================
// GET /api/stocks/my → 返回我的自选列表 + 实时数据
apiStocks.get('/my', async (c) => {
  const { data: userStocks } = await supabase
    .from('user_stocks')
    .select('symbol')
    .eq('user_id', 'default_user'); // 以后换真实用户ID

  const symbols = userStocks?.map(s => s.symbol) || ['RCL', 'MU', 'LLY', 'MAR', 'HLT'];

  const include = (c.req.query('include') || 'quote,profile,metrics').split(',');
  const stockData = await StockService.getBatchStocks(symbols, include);

  return c.json({ success: true, symbols, data: stockData });
});

// POST /api/stocks/add → 手机添加新股票
apiStocks.post('/add', async (c) => {
  const { symbol } = await c.req.json();

  await supabase
    .from('user_stocks')
    .upsert({ user_id: 'default_user', symbol: symbol.toUpperCase() }, { onConflict: 'user_id,symbol' });

  return c.json({ success: true, message: `已添加 ${symbol} 到自选` });
});

// DELETE /api/stocks/remove/:symbol → 删除
apiStocks.delete('/remove/:symbol', async (c) => {
  const symbol = c.req.param('symbol');
  await supabase
    .from('user_stocks')
    .delete()
    .eq('user_id', 'default_user')
    .eq('symbol', symbol);

  return c.json({ success: true, message: `已删除 ${symbol}` });
});

export default apiStocks;
