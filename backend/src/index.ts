import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { keyshiled } from './middleware/keyshiled';
import mev from './routes/mev';
import finance from './routes/finance';
import blog from './routes/blog';
import home from './routes/home';
import cron from './routes/cron';

const app = new Hono();

app.use('*', cors({ origin: ['https://aileen.xyz', 'https://mev.aileena.xyz', 'https://finance.aileena.xyz'] }));
app.use('/api/*', keyshiled);

app.route('/api/mev', mev);
app.route('/api/finance', finance);
app.route('/api/blog', blog);
app.route('/api/home', home);
app.route('/api/cron', cron);

export default app;
