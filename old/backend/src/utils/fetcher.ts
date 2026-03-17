import env from '../config/env.js';

const FINNHUB_BASE = 'https://finnhub.io/api/v1';
const ALPHA_BASE = 'https://www.alphavantage.co/query';

export async function fetchFinnhub(path: string, params: Record<string, any> = {}) {
  const url = new URL(FINNHUB_BASE + path);
  url.searchParams.set('token', env.FINNHUB_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Finnhub API error');
  return await res.json();
}

export async function fetchAlpha(functionName: string, params: Record<string, any> = {}) {
  const url = new URL(ALPHA_BASE);
  url.searchParams.set('function', functionName);
  url.searchParams.set('apikey', env.ALPHA_VANTAGE_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Alpha Vantage API error');
  return await res.json();
}
