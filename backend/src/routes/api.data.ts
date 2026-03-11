import { Hono } from 'hono';
import { StockService } from '../services/stock.service.js';

const apiData = new Hono();

apiData.get('/data', async (c) => {
  const symbols = (c.req.query('symbols') || 'RCL,MU,LLY,MAR,HLT').split(',');
  const include = (c.req.query('include') || 'quote,profile,metrics').split(',');

  const data = await StockService.getBatchStocks(symbols, include);

  return c.json({
    success: true,
    timestamp: new Date().toISOString(),
    data,
  });
});

export default apiData;
