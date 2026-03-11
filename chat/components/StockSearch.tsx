"use client";
import { useState } from "react";
import { useWatchlist } from "@/lib/useWatchlist";

interface StockSearchProps {
  user?: { id: string } | null;
}

export function StockSearch({ user }: StockSearchProps) {
  const { symbols, addSymbol, removeSymbol, loading } = useWatchlist(user);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const handleAdd = async () => {
    const symbol = input.trim().toUpperCase();
    if (!symbol) return;
    if (symbols.includes(symbol)) {
      setError("已在自选");
      return;
    }
    setError("");
    await addSymbol(symbol);
    setInput("");
  };

  return (
    <div className="mech-panel p-4 mb-4">
      <div className="flex gap-2 mb-2">
        <input
          className="metal-input flex-1"
          placeholder="输入股票代码，如 AAPL"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <button className="metal-button" onClick={handleAdd} disabled={loading}>
          添加
        </button>
      </div>
      {error && <div className="text-red-500 text-xs mb-2">{error}</div>}
      <div className="flex flex-wrap gap-2">
        {symbols.map(symbol => (
          <span key={symbol} className="bg-gray-800 px-2 py-1 rounded flex items-center">
            {symbol}
            <button
              className="ml-1 text-red-400 hover:text-red-600"
              onClick={() => removeSymbol(symbol)}
              title="移除"
            >
              ×
            </button>
          </span>
        ))}
        {symbols.length === 0 && <span className="text-gray-400">暂无自选股票</span>}
      </div>
    </div>
  );
}
