import { Hono } from 'hono';
import { db } from '../db';
import { financeAnalyses, mevAttacks } from '../db/schema';
import { calculateBottomSignal } from '../utils/analysis';

const route = new Hono();

route.get('/fetch', async (c) => {
  // Finance Polygon（你原来的python_generator逻辑）
  const res = await fetch(`https://api.polygon.io/v2/aggs/ticker/AAPL/range/1/day/2025-01-01/2026-03-11?adjusted=true&sort=asc&limit=500&apiKey=${process.env.POLYGON_KEY}`);
  const data = await res.json();
  const signal = calculateBottomSignal(data);

  await db.insert(financeAnalyses).values({
    id: Date.now().toString(),
    ticker: 'AAPL',
    bottomSignal: signal.signal,
    rsi: signal.rsi,
    ma50: signal.ma50,
    ma200: signal.ma200,
    volatility: signal.volatility,
    priceData: data
  });

  // MEV Helius（实时替换你CSV）
  // ... 可后续扩展

  return c.json({ success: true });
});

export default route;
