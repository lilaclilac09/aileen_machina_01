import { Hono } from 'hono';
import { db } from '../db';
import { financeAnalyses } from '../db/schema';
import { calculateBottomSignal } from '../utils/analysis';
import { eq } from 'drizzle-orm';

const route = new Hono();

route.get('/', async (c) => {
  const data = await db.select().from(financeAnalyses);
  return c.json(data);
});

route.get('/:ticker', async (c) => {
  const ticker = c.req.param('ticker').toUpperCase();
  const data = await db.select().from(financeAnalyses).where(eq(financeAnalyses.ticker, ticker));
  return c.json(data[0] || { error: "no data" });
});

export default route;
