
import { useEffect, useState } from 'react';

const LOCAL_KEY = 'aileena_watchlist';


export function useWatchlist(user?: { id: string } | null) {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // 统一从后端 API 获取自选（含实时数据）
  useEffect(() => {
    setLoading(true);
    fetch('/api/stocks/my')
      .then(res => res.json())
      .then(res => {
        if (res && res.symbols) {
          setSymbols(res.symbols);
          localStorage.setItem(LOCAL_KEY, JSON.stringify(res.symbols));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // 增加股票

  const addSymbol = async (symbol: string) => {
    // 直接请求后端添加
    await fetch('/api/stocks/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol })
    });
    // 刷新自选
    fetch('/api/stocks/my')
      .then(res => res.json())
      .then(res => {
        if (res && res.symbols) {
          setSymbols(res.symbols);
          localStorage.setItem(LOCAL_KEY, JSON.stringify(res.symbols));
        }
      });
  };

  // 删除股票

  const removeSymbol = async (symbol: string) => {
    await fetch(`/api/stocks/remove/${symbol.toUpperCase()}`, {
      method: 'DELETE'
    });
    // 刷新自选
    fetch('/api/stocks/my')
      .then(res => res.json())
      .then(res => {
        if (res && res.symbols) {
          setSymbols(res.symbols);
          localStorage.setItem(LOCAL_KEY, JSON.stringify(res.symbols));
        }
      });
  };

  return { symbols, loading, addSymbol, removeSymbol };
}
