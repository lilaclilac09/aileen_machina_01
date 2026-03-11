import { Hono } from 'hono';
import dotenv from 'dotenv';
dotenv.config();

const route = new Hono();

const FINNHUB_KEY = process.env.FINNHUB_KEY!;
const ALPHA_KEY = process.env.ALPHA_VANTAGE_KEY!;

const FIN_BASE = 'https://finnhub.io/api/v1';
const AV_BASE = 'https://www.alphavantage.co/query';

async function fetchFinnhub(endpoint: string, params: any = {}) {
  const url = new URL(`${FIN_BASE}${endpoint}`);
  url.searchParams.set('token', FINNHUB_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v as string));
  const res = await fetch(url.toString());
  return res.ok ? res.json() : { error: await res.text() };
}

async function fetchAlpha(func: string, params: any = {}) {
  const url = new URL(AV_BASE);
  url.searchParams.set('function', func);
  url.searchParams.set('apikey', ALPHA_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v as string));
  const res = await fetch(url.toString());
  const data = await res.json();
  if (data.Note) throw new Error('Alpha Vantage 限额已用完');
  return data;
}

route.get('/data', async (c) => {
  const symbolsStr = c.req.query('symbols') || 'RCL,MU,LLY,MAR,HLT';
  const includeStr = c.req.query('include') || 'quote,profile,metrics';
  const symbols = symbolsStr.split(',');
  const include = includeStr.split(',');
  const results: any = {};

  for (const symbol of symbols) {
    const data: any = { symbol };
    // Finnhub
    if (include.includes('quote')) {
      const q = await fetchFinnhub('/quote', { symbol });
      data.quote = {
        current: q.c,
        changePercent: q.dp,
        previousClose: q.pc,
        high: q.h,
        low: q.l,
        timestamp: q.t ? new Date(q.t * 1000).toISOString() : undefined
      };
    }
    if (include.includes('profile')) {
      const p = await fetchFinnhub('/stock/profile2', { symbol });
      data.profile = { name: p.name, marketCap: p.marketCapitalization, industry: p.finnhubIndustry, description: p.description };
    }
    if (include.includes('metrics')) {
      const m = await fetchFinnhub('/stock/metric', { symbol, metric: 'all' });
      data.metrics = {
        peTTM: m.metric?.peTTM,
        pb: m.metric?.pbQuarterly,
        ps: m.metric?.psTTM,
        beta: m.metric?.beta,
        dividendYield: m.metric?.dividendYield,
        roe: m.metric?.roe
      };
    }
    // Alpha Vantage
    try {
      if (include.includes('income')) {
        const inc = await fetchAlpha('INCOME_STATEMENT', { symbol });
        const latest = inc.annualReports?.[0] || {};
        data.income = { revenue: latest.totalRevenue, netIncome: latest.netIncome, grossProfit: latest.grossProfit };
      }
      if (include.includes('balance')) {
        const bal = await fetchAlpha('BALANCE_SHEET', { symbol });
        const latest = bal.annualReports?.[0] || {};
        data.balance = { totalAssets: latest.totalAssets, totalEquity: latest.totalShareholderEquity };
      }
      if (include.includes('cashflow')) {
        const cf = await fetchAlpha('CASH_FLOW', { symbol });
        const latest = cf.annualReports?.[0] || {};
        const fcf = Number(latest.operatingCashflow || 0) - Number(latest.capitalExpenditures || 0);
        data.cashflow = { operatingCashflow: latest.operatingCashflow, freeCashFlow: fcf };
      }
      if (include.includes('earnings')) {
        const ear = await fetchAlpha('EARNINGS', { symbol });
        data.earnings = ear.annualEarnings?.[0] || {};
      }
    } catch (e) {
      data.alphaNote = 'Alpha Vantage 今天额度已用完（25次/天）';
    }
    // 估值模型字段
    if (data.cashflow?.freeCashFlow && data.income?.revenue) {
      data.valuationReady = {
        freeCashFlow: data.cashflow.freeCashFlow,
        netMargin: ((data.income.netIncome / data.income.revenue) * 100).toFixed(2) + '%',
      };
    }
    results[symbol] = data;
  }
  return c.json({
    success: true,
    timestamp: new Date().toISOString(),
    data: results
  });
});

route.post('/add-stock', async (c) => {
  const { symbol } = await c.req.json();
  return c.json({ success: true, message: `已添加 ${symbol}，下次用 ?symbols=... 即可拉取` });
});

route.get('/', (c) => c.text('Finance API ready - 随时添加股票 + 按需拉数据'));

export default route;
