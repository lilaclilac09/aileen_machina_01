import { fetchAlpha } from '../utils/alphaVantage';
import { Hono } from 'hono';

const route = new Hono();

// 批量拉取 Alpha Vantage fundamentals
route.get('/batch-alpha-fundamentals', async (c) => {
  const symbols = c.req.query('symbols')?.split(',') || ['RCL', 'MU', 'LLY', 'MAR', 'HLT'];
  const results: Record<string, any> = {};

  for (const symbol of symbols) {
    try {
      const income = await fetchAlpha('INCOME_STATEMENT', { symbol });
      const latestIncome = income.annualReports?.[0] || income.quarterlyReports?.[0] || {};

      const balance = await fetchAlpha('BALANCE_SHEET', { symbol });
      const latestBalance = balance.annualReports?.[0] || balance.quarterlyReports?.[0] || {};

      const cashflow = await fetchAlpha('CASH_FLOW', { symbol });
      const latestCashflow = cashflow.annualReports?.[0] || cashflow.quarterlyReports?.[0] || {};

      const earnings = await fetchAlpha('EARNINGS', { symbol });
      const latestEarnings = earnings.annualEarnings?.[0] || earnings.quarterlyEarnings?.[0] || {};

      results[symbol] = {
        income: {
          fiscalDateEnding: latestIncome.fiscalDateEnding,
          totalRevenue: latestIncome.totalRevenue,
          grossProfit: latestIncome.grossProfit,
          operatingIncome: latestIncome.operatingIncome,
          netIncome: latestIncome.netIncome,
          ebit: latestIncome.ebit,
        },
        balance: {
          totalAssets: latestBalance.totalAssets,
          totalLiabilities: latestBalance.totalLiabilities,
          totalShareholderEquity: latestBalance.totalShareholderEquity,
          commonStockSharesOutstanding: latestBalance.commonStockSharesOutstanding,
        },
        cashflow: {
          operatingCashflow: latestCashflow.operatingCashflow,
          capitalExpenditures: latestCashflow.capitalExpenditures,
          freeCashFlow: Number(latestCashflow.operatingCashflow) - Number(latestCashflow.capitalExpenditures || 0),
        },
        earnings: {
          reportedEPS: latestEarnings.reportedEPS,
          surprise: latestEarnings.surprise,
          surprisePercentage: latestEarnings.surprisePercentage,
        },
        note: 'Latest annual/quarterly data; full reports in annualReports/quartelyReports arrays',
      };
    } catch (err: any) {
      results[symbol] = { error: err.message };
    }
  }

  return c.json({ success: true, data: results, fetchedAt: new Date().toISOString() });
});

// 单只股票 quote 路由
route.get('/alpha-quote/:symbol', async (c) => {
  const symbol = c.req.param('symbol');
  try {
    const data = await fetchAlpha('GLOBAL_QUOTE', { symbol });
    const quote = data['Global Quote'] || {};
    return c.json({
      currentPrice: quote['05. price'],
      changePercent: quote['10. change percent'],
      previousClose: quote['08. previous close'],
      volume: quote['06. volume'],
      latestTradingDay: quote['07. latest trading day'],
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

export default route;
