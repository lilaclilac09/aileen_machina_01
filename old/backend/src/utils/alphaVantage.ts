import dotenv from 'dotenv';
dotenv.config();

const AV_KEY = process.env.ALPHA_VANTAGE_KEY!;
const AV_BASE = 'https://www.alphavantage.co/query';

export async function fetchAlpha(functionName: string, params: Record<string, string> = {}) {
  const url = new URL(AV_BASE);
  url.searchParams.set('function', functionName);
  url.searchParams.set('apikey', AV_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Alpha Vantage ${res.status}: ${await res.text()}`);
  const data = await res.json();

  if (data.Note || data['Information']) {
    throw new Error(data.Note || data['Information']);
  }
  return data;
}
