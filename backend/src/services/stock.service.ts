import { fetchFinnhub, fetchAlpha } from '../utils/fetcher.js';
import env from '../config/env.js';

export class StockService {
  // 核心：按需拉取单个股票所有数据
  static async getStockData(symbol: string, include: string[]) {
    const data: any = { symbol };

    // Finnhub 模块（实时 + 指标）
    if (include.includes('quote')) {
      const q = await fetchFinnhub('/quote', { symbol });
      data.quote = {
        current: q.c,
        changePercent: q.dp,
        previousClose: q.pc,
        high: q.h,
        low: q.l,
        timestamp: new Date(q.t * 1000).toISOString(),
      };
    }
    if (include.includes('profile')) {
      const p = await fetchFinnhub('/stock/profile2', { symbol });
      data.profile = { name: p.name, marketCap: p.marketCapitalization, industry: p.finnhubIndustry };
    }
    if (include.includes('metrics')) {
      const m = await fetchFinnhub('/stock/metric', { symbol, metric: 'all' });
      data.metrics = {
        peTTM: m.metric?.peTTM,
        beta: m.metric?.beta,
        dividendYield: m.metric?.dividendYield,
        roe: m.metric?.roe,
      };
    }

    // Alpha Vantage 模块（财报）
    try {
      if (include.includes('income')) {
        const inc = await fetchAlpha('INCOME_STATEMENT', { symbol });
        const latest = inc.annualReports?.[0] || {};
        data.income = { revenue: latest.totalRevenue, netIncome: latest.netIncome };
      }
      if (include.includes('cashflow')) {
        const cf = await fetchAlpha('CASH_FLOW', { symbol });
        const latest = cf.annualReports?.[0] || {};
        const fcf = Number(latest.operatingCashflow || 0) - Number(latest.capitalExpenditures || 0);
        data.cashflow = { freeCashFlow: fcf };
      }
    } catch (e: any) {
      data.alphaNote = 'Alpha Vantage 今日额度已用完（25次/天）';
    }

    // 估值模型预备字段（未来 DCF 直接用）
    if (data.cashflow?.freeCashFlow && data.income?.revenue) {
      data.valuationReady = {
        freeCashFlow: data.cashflow.freeCashFlow,
        netMargin: ((data.income.netIncome / data.income.revenue) * 100).toFixed(2) + '%',
      };
    }

    return data;
  }

  // 批量拉取（手机常用）
  static async getBatchStocks(symbols: string[], include: string[]) {
    const results: Record<string, any> = {};
    for (const symbol of symbols) {
      results[symbol] = await this.getStockData(symbol, include);
    }
    return results;
  }
}
