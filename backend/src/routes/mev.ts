import { Hono } from 'hono';
import { db } from '../db';
import { mevAttacks } from '../db/schema';
import Papa from 'papaparse';
import { calculateMEVRisk } from '../utils/analysis';

const route = new Hono();

route.get('/', async (c) => {
  const data = await db.select().from(mevAttacks);
  return c.json(data);
});

route.post('/import-csv', async (c) => {
  const body = await c.req.text();
  const parsed = Papa.parse(body, { header: true });
  for (const row of parsed.data) {
    await db.insert(mevAttacks).values({
      id: Date.now().toString() + Math.random(),
      attackType: row.attackType,
      netProfitSol: parseFloat(row.netProfitSol),
      validator: row.validator,
      riskScore: calculateMEVRisk(row),
      rawData: row
    });
  }
  return c.json({ success: true, count: parsed.data.length });
});

export default route;
