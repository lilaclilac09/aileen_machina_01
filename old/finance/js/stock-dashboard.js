// finance/js/stock-dashboard.js
// 支持首页卡片墙、搜索、当天价格走势（迷你K线/折线图）
// 依赖: Chart.js（或可选更轻量库）

const API_BASE = 'https://aileen-machina-01-ahoum08p8-rosazxc0915-8217s-projects.vercel.app';

// 股票列表（可扩展）
const STOCK_LIST = [
  'RCL', 'MU', 'LLY', 'MAR', 'HLT', 'LMT', 'RTX', 'BWXT', 'RKLB'
];

// 搜索功能
window.filterStocks = function() {
  const q = document.getElementById('stock-search').value.toUpperCase();
  document.querySelectorAll('.stock-card').forEach(card => {
    card.style.display = card.dataset.symbol.includes(q) ? '' : 'none';
  });
};

// 加载所有股票卡片
window.loadStockDashboard = async function() {
  const container = document.getElementById('stock-dashboard');
  container.innerHTML = '';
  for (const symbol of STOCK_LIST) {
    const card = document.createElement('div');
    card.className = 'stock-card';
    card.dataset.symbol = symbol;
    card.innerHTML = `
      <div class="stock-header">
        <span class="stock-symbol">${symbol}</span>
        <span class="stock-price" id="price-${symbol}">--</span>
      </div>
      <canvas id="chart-${symbol}" width="120" height="40"></canvas>
      <div class="stock-name" id="name-${symbol}"></div>
    `;
    container.appendChild(card);
    loadStockMini(symbol);
  }
};

// 拉取单只股票并渲染迷你图
async function loadStockMini(symbol) {
  try {
    // 拉取主数据
    const res = await fetch(`${API_BASE}/api/stock/${symbol}`);
    const { data } = await res.json();
    document.getElementById(`price-${symbol}`).textContent = data.currentPrice;
    document.getElementById(`name-${symbol}`).textContent = data.name;
    // 拉取当天价格走势（假设有 /api/stock/:symbol/intraday）
    const kRes = await fetch(`${API_BASE}/api/stock/${symbol}/intraday`);
    const { prices } = await kRes.json(); // prices: [{time, price}]
    renderMiniChart(`chart-${symbol}`, prices);
  } catch (e) {
    document.getElementById(`price-${symbol}`).textContent = '--';
  }
}

// 渲染迷你折线图
function renderMiniChart(canvasId, prices) {
  if (!window.Chart) return;
  const ctx = document.getElementById(canvasId).getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: prices.map(p => p.time),
      datasets: [{
        data: prices.map(p => p.price),
        borderColor: '#2e7dff',
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
        tension: 0.3
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { x: { display: false }, y: { display: false } },
      elements: { line: { borderJoinStyle: 'round' } },
      responsive: false,
      animation: false
    }
  });
}

// 自选列表（本地存储）
window.toggleWatchlist = function(symbol) {
  let list = JSON.parse(localStorage.getItem('watchlist') || '[]');
  if (list.includes(symbol)) {
    list = list.filter(s => s !== symbol);
  } else {
    list.push(symbol);
  }
  localStorage.setItem('watchlist', JSON.stringify(list));
  renderWatchlist();
};

window.renderWatchlist = function() {
  const list = JSON.parse(localStorage.getItem('watchlist') || '[]');
  const box = document.getElementById('watchlist-box');
  box.innerHTML = list.map(s => `<span>${s}</span>`).join(' ');
};
