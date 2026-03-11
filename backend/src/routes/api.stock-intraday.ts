import { Hono } from 'hono';
import { fetchFinnhub } from '../utils/fetcher.js';

const apiStockIntraday = new Hono();

// intraday: 返回当天每5分钟价格（用于首页迷你走势）
apiStockIntraday.get('/:symbol/intraday', async (c) => {
  const symbol = c.req.param('symbol').toUpperCase();
  // 拉取当天分时数据（Finnhub 支持 1min/5min）
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000;
  const to = Math.floor(now.getTime() / 1000);
  const res = await fetchFinnhub('/stock/candle', {
    symbol,
    resolution: '5',
    from,
    to
  });
  // Finnhub 返回 { t:[], c:[] }
  const prices = (res.t || []).map((t, i) => ({
    time: new Date(t * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    price: res.c[i]
  }));
  return c.json({ success: true, prices });
});

export default apiStockIntraday;
