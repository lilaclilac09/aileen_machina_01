// finance/js/stock-search-wall.js
const STOCK_LIST = [
  'RCL', 'MU', 'LLY', 'MAR', 'HLT', // 酒店/邮轮
  'LMT', 'RTX', 'BWXT', 'RKLB'    // 太空股
];

const API_BASE = 'https://aileen-machina-01-ahoum08p8-rosazxc0915-8217s-projects.vercel.app';

async function fetchStockData(symbol) {
  try {
    const res = await fetch(`${API_BASE}/api/stock/${symbol}`);
    const { data } = await res.json();
    return data;
  } catch (err) {
    return null;
  }
}

async function renderStockWall(containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '<div>加载中...</div>';
  const cards = await Promise.all(STOCK_LIST.map(fetchStockData));
  container.innerHTML = cards.map(data => data ? `
    <div class="stock-card">
      <div class="stock-symbol">${data.symbol}</div>
      <div class="stock-name">${data.name}</div>
      <div class="stock-price">${data.currentPrice}</div>
      <div class="stock-main">${data.mainBusiness}</div>
      <div class="stock-roe">ROE: ${data.keyIndicators.roe}</div>
      <div class="stock-revenue">收入: ${data.financialHighlights.revenue}</div>
      <div class="stock-date">${data.asOfDate}</div>
    </div>
  ` : '').join('');
}

function setupStockSearch(inputId, resultId) {
  const input = document.getElementById(inputId);
  const result = document.getElementById(resultId);
  input.addEventListener('input', async () => {
    const keyword = input.value.trim().toUpperCase();
    if (!keyword) {
      result.innerHTML = '';
      return;
    }
    result.innerHTML = '搜索中...';
    const data = await fetchStockData(keyword);
    if (data) {
      result.innerHTML = `
        <div class="stock-card">
          <div class="stock-symbol">${data.symbol}</div>
          <div class="stock-name">${data.name}</div>
          <div class="stock-price">${data.currentPrice}</div>
          <div class="stock-main">${data.mainBusiness}</div>
          <div class="stock-roe">ROE: ${data.keyIndicators.roe}</div>
          <div class="stock-revenue">收入: ${data.financialHighlights.revenue}</div>
          <div class="stock-date">${data.asOfDate}</div>
        </div>
      `;
    } else {
      result.innerHTML = '<div style="color:red;">未找到该股票</div>';
    }
  });
}

window.renderStockWall = renderStockWall;
window.setupStockSearch = setupStockSearch;
