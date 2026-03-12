import * as TI from 'technicalindicators';

export function calculateBottomSignal(priceData: any) {
  const closes = priceData.results?.map((c: any) => c.c) || [];
  const rsi = TI.RSI.calculate({ period: 14, values: closes });
  const ma50 = TI.SMA.calculate({ period: 50, values: closes })[0];
  const ma200 = TI.SMA.calculate({ period: 200, values: closes })[0];
  const lastRsi = rsi[rsi.length - 1];

  let signal = "WATCH";
  if (lastRsi < 30 && ma50 > ma200) signal = "STRONG_BOTTOM_BUY";
  else if (lastRsi < 40) signal = "OVERSOLD_WATCH";
  else if (ma50 > ma200) signal = "GOLDEN_CROSS";

  return { signal, rsi: lastRsi, ma50, ma200, volatility: TI.StandardDeviation.calculate({ period: 20, values: closes })[0] };
}

