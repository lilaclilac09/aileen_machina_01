import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { keyshiled } from './middleware/keyshiled';

import finance from './routes/finance';
import blog from './routes/blog';
import home from './routes/home';
import cron from './routes/cron';

import alpha from './routes/alpha';
import data from './routes/data';

const app = new Hono();

app.use('*', cors({ origin: ['https://aileen.xyz', 'https://finance.aileena.xyz'] }));
app.use('/api/*', keyshiled);

app.route('/api/finance', finance);
app.route('/api/blog', blog);
app.route('/api/home', home);
app.route('/api/cron', cron);

app.route('/api/alpha', alpha);
app.route('/api', data);

import apiData from './routes/api.data.js';
import apiStocks from './routes/api.stocks.js';
import apiStockDetail from './routes/api.stock-detail.js';
import apiStockIntraday from './routes/api.stock-intraday.js';

// ... 你的原有代码 ...

// 挂载万能路由
app.route('/api', apiData);
app.route('/api', apiStocks); // ← 新增这一行（挂载 /api/stocks/*）

app.route('/api/stock', apiStockDetail);   // ← 新增这一行
app.route('/api/stock', apiStockIntraday); // ← 新增 intraday 路由

export default app;
