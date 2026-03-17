import React, { useEffect, useState } from 'react';

export default function StockDetailCard({ symbol }: { symbol: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stock/${symbol}`)
      .then(res => res.json())
      .then(res => {
        setData(res.data);
        setLoading(false);
      });
  }, [symbol]);

  if (loading) return <div>加载中...</div>;
  if (!data) return <div>未找到数据</div>;

  return (
    <div className="card">
      <h2>{data.name} ({data.symbol})</h2>
      <p>{data.mainBusiness}</p>
      <h3>财务亮点（{data.financialHighlights.period}）</h3>
      <ul>
        <li>营收: {data.financialHighlights.revenue}</li>
        <li>净利润: {data.financialHighlights.netProfit}</li>
        <li>自由现金流: {data.financialHighlights.freeCashFlow}</li>
      </ul>
      <h3>核心指标</h3>
      <ul>
        <li>ROIC: {data.keyIndicators.roic}</li>
        <li>ROE: {data.keyIndicators.roe}</li>
        <li>总负债: {data.keyIndicators.totalDebt}</li>
        <li>流动比率: {data.keyIndicators.currentRatio}</li>
        <li>风险: {data.keyIndicators.risk}</li>
      </ul>
      <h3>最新动态</h3>
      <ul>
        {data.latestOrders.map((item: string, i: number) => <li key={i}>{item}</li>)}
      </ul>
      <div>主要机构持仓: {data.majorBullHolders}</div>
      <div>现价: {data.currentPrice}</div>
      <div>{data.asOfDate}</div>
    </div>
  );
}
