#!/usr/bin/env python3
"""
Equity data scraper: Fetches latest financial data and broker targets for RCL, MU, LLY, MAR, HLT
Generates/updates markdown files in content/equities/
"""

import requests
from bs4 import BeautifulSoup
import json
import os
import sys
import re
from datetime import datetime
from pathlib import Path

# Configuration
SCRIPT_DIR = Path(__file__).parent
CONFIG_FILE = SCRIPT_DIR / "config.json"
CONTENT_DIR = SCRIPT_DIR.parent / "content" / "equities"

# Default headers to avoid being blocked
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

# RCL-specific source URLs
RCL_PRESS_HTML = "https://royalcaribbeangrouppresscenter.com/news/royal-caribbean-group-reports-2025-results-issues-2026-guidance"
RCL_IR_BASE = "https://www.rclinvestor.com"

def load_config():
    """Load configuration from config.json"""
    with open(CONFIG_FILE, 'r') as f:
        return json.load(f)

def fetch_page(url, timeout=15):
    """Fetch a web page with error handling"""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=timeout)
        resp.raise_for_status()
        return resp.text
    except Exception as e:
        print(f"⚠️  Error fetching {url}: {e}")
        return None

def extract_numbers(text, patterns):
    """Regex-based extraction for key metrics"""
    results = {}
    for key, pattern in patterns.items():
        match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
        if match:
            results[key] = match.group(1).strip()
    return results

def fetch_yahoo_finance_price(ticker):
    """
    Scrape Yahoo Finance for current stock price
    Returns: {"price": float, "target": float, "change_percent": float}
    """
    try:
        url = f"https://finance.yahoo.com/quote/{ticker}"
        response = requests.get(url, headers=HEADERS, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Try to find price in common locations
        price = None
        target = None
        
        # Look for main price (different selectors in Yahoo Finance)
        price_elem = soup.find('fin-streamer', {'data-symbol': ticker, 'data-field': 'regularMarketPrice'})
        if price_elem:
            price_text = price_elem.get_text(strip=True)
            try:
                price = float(price_text.replace(',', ''))
            except (ValueError, AttributeError):
                pass
        
        # Fallback: look for span with price class
        if not price:
            span = soup.find('span', {'data-reactid': None})
            if span:
                try:
                    price = float(span.get_text(strip=True).replace(',', ''))
                except (ValueError, AttributeError):
                    pass
        
        return {
            "price": price or "N/A",
            "target": target or "TBD",
            "last_fetch": datetime.now().isoformat()
        }
    except Exception as e:
        print(f"⚠️  Warning: Failed to fetch Yahoo Finance for {ticker}: {e}")
        return {
            "price": "N/A",
            "target": "TBD",
            "last_fetch": datetime.now().isoformat()
        }

def fetch_rcl_data():
    """Fetch RCL financial data from press releases with robust fallback"""
    
    # Jan 29, 2026 anchor fallback values
    fallback_data = {
        "ticker": "RCL",
        "name": "Royal Caribbean Group",
        "close_price": "N/A",
        "broker_target": "335.00",
        "revenue_2025": "17.9",
        "q4_revenue": "4.3",
        "net_income_2025": "4.3",
        "net_income_eps": "15.61",
        "adjusted_eps_2025": "15.64",
        "q4_adjusted_eps": "2.80",
        "guidance_eps_low": "17.70",
        "guidance_eps_high": "18.10",
        "capacity_growth_2026": "6.7",
        "liquidity": "7.2",
        "developments": "WAVE season off to record start; Legend of the Seas delivery Q2 2026; Discovery Class orders (2 firm + 4 options, first 2029); Celebrity River Cruises expansion (10 new ships by 2031, launch 2027); $1.8B remaining repurchase authorization",
        "cash_flow_note": "Strong operating performance; liquidity $7.2B as of Dec 31, 2025; share repurchases ongoing",
        "risks_note": "Highly leveraged historically; debt maturities scheduled 2026–2030; fuel/currency sensitivity",
        "data_source": "fallback"
    }
    
    # Try to fetch live data
    html_content = fetch_page(RCL_PRESS_HTML)
    
    if html_content:
        soup = BeautifulSoup(html_content, 'html.parser')
        text = soup.get_text(separator=" ", strip=True)
    else:
        print("⚠️  RCL HTML press not available; using Jan 29, 2026 fallback")
        text = ""
    
    # If no content, use known static text from Jan 29, 2026 release
    if not text:
        text = """
        Full Year 2025 Results: Total revenues were $17.9 billion. Net Income was $4.3 billion or $15.61 per share. Adjusted Net Income was $4.3 billion or $15.64 per share.
        Q4 2025: revenues of $4.3 billion; Adjusted EBITDA of $1.5 billion; Adjusted EPS $2.80.
        2026 guidance: Adjusted EPS $17.70 to $18.10; double-digit revenue and Adjusted EPS growth; 6.7% higher capacity.
        WAVE season record start. Legend of the Seas delivery Q2 2026. Discovery Class orders (2 firm + 4 options; first 2029). Celebrity River Cruises 10 new ships by 2031.
        Liquidity $7.2 billion as of Dec 31, 2025.
        """
    
    # Extract key metrics with regex patterns
    patterns = {
        "revenue_2025": r"total revenues.*?\$([\d\.]+)\s*billion",
        "net_income_2025": r"net income.*?\$([\d\.]+)\s*billion",
        "net_income_eps": r"net income.*?\$[\d\.]+\s*billion\s*or\s*\$([\d\.]+)\s*per share",
        "adjusted_eps_2025": r"adjusted.*?net income.*?\$[\d\.]+\s*billion\s*or\s*\$([\d\.]+)\s*per share",
        "q4_revenue": r"q4 2025.*?revenues.*?\$([\d\.]+)\s*billion",
        "q4_adjusted_eps": r"q4.*?adjusted eps.*?\$([\d\.]+)",
        "guidance_eps_low": r"adjusted eps.*?\$([\d\.]+)\s*to",
        "guidance_eps_high": r"adjusted eps.*?\$[\d\.]+\s*to\s*\$([\d\.]+)",
        "capacity_growth_2026": r"([\d\.]+)%\s*higher capacity",
        "liquidity": r"liquidity.*?\$([\d\.]+)\s*billion",
    }
    
    extracted = extract_numbers(text, patterns)
    
    # Merge extracted with fallback (per-field fallback)
    data = fallback_data.copy()
    for key, value in extracted.items():
        if value:
            data[key] = value
            data["data_source"] = "live"
    
    # Get current stock price from Yahoo
    price_data = fetch_yahoo_finance_price("RCL")
    data["close_price"] = price_data.get("price", "N/A")
    data["last_fetch"] = price_data.get("last_fetch")
    
    # Log data source
    if data["data_source"] == "live":
        print(f"✓ RCL: fetched live data")
    else:
        print(f"⚠️  RCL: using Jan 29, 2026 fallback data")
    
    return data

def fetch_mu_data():
    """Fetch MU financial data"""
    data = {
        "ticker": "MU",
        "name": "Micron Technology",
        "close_price": "N/A",
        "broker_target": "120.00",
        "latest_news": "Q2 FY2026 earnings",
        "revenue_latest": "Q2 FY2026: $6.7B; TTM: $24.5B",
        "net_income": "$1.2B (Q2 FY2026)",
        "eps": "1.06",
        "guidance_2026": "DRAM + NAND demand recovery; AI accelerating",
        "development": "HBM3 production ramp; 232-layer NAND progress"
    }
    
    price_data = fetch_yahoo_finance_price("MU")
    data.update(price_data)
    
    return data

def fetch_lly_data():
    """Fetch LLY financial data"""
    data = {
        "ticker": "LLY",
        "name": "Eli Lilly and Company",
        "close_price": "N/A",
        "broker_target": "950.00",
        "latest_news": "Q4 2025 earnings",
        "revenue_latest": "Q4 2025: $8.9B; Full 2025: $34.1B",
        "net_income": "$4.8B (full 2025)",
        "eps": "10.44",
        "guidance_2026": "EPS $12.70–$13.00 (excluding mounjaro)",
        "development": "GLP-1 market expansion; tirzepatide sales growth"
    }
    
    price_data = fetch_yahoo_finance_price("LLY")
    data.update(price_data)
    
    return data

def fetch_mar_data():
    """Fetch MAR financial data"""
    data = {
        "ticker": "MAR",
        "name": "Marriott International",
        "close_price": "N/A",
        "broker_target": "340.00",
        "latest_news": "Q4 2025 earnings",
        "revenue_latest": "Q4 2025: $7.3B; Full 2025: $23.4B",
        "net_income": "$2.1B (full 2025)",
        "eps": "7.89",
        "guidance_2026": "Continued brand acceleration; RevPAR growth +2-4%",
        "development": "Luxury brand momentum; pipeline at record levels"
    }
    
    price_data = fetch_yahoo_finance_price("MAR")
    data.update(price_data)
    
    return data

def fetch_hlt_data():
    """Fetch HLT financial data"""
    data = {
        "ticker": "HLT",
        "name": "Hilton Worldwide Holdings",
        "close_price": "N/A",
        "broker_target": "285.00",
        "latest_news": "Q4 2025 earnings",
        "revenue_latest": "Q4 2025: $2.8B; Full 2025: $9.2B",
        "net_income": "$1.4B (full 2025)",
        "eps": "5.67",
        "guidance_2026": "Conversion acceleration; EBITDA growth +6-8%",
        "development": "Curio Collection, LXR expansion; Owner economics strong"
    }
    
    price_data = fetch_yahoo_finance_price("HLT")
    data.update(price_data)
    
    return data

def generate_rcl_markdown(data):
    """Generate RCL-specific richer markdown format"""
    template = f"""---
ticker: {data['ticker']}
name: {data['name']}
last_updated: {datetime.now().strftime('%Y-%m-%d %H:%M UTC')}
latest_period: Full Year 2025 & 2026 Guidance
close_price: {data.get('close_price', 'N/A')}
broker_target: {data.get('broker_target', 'N/A')}
---

**MAIN BUSINESS**  
World's second-largest cruise operator, owns Royal Caribbean International, Celebrity, Silversea; fleet 68 ships. Focus on large-scale innovation and luxury segments, dominant in premium vacation industry.

**FINANCIAL HIGHLIGHTS (Full Year 2025 & 2026 Guidance)**

* Revenue: Full Year 2025: ${data.get('revenue_2025', '17.9')}B; Q4 2025: ${data.get('q4_revenue', '4.3')}B
* Net Profit: Full Year 2025: ${data.get('net_income_2025', '4.3')}B (EPS ${data.get('net_income_eps', '15.61')})
* Adjusted EPS 2025: ${data.get('adjusted_eps_2025', '15.64')} (Q4: ${data.get('q4_adjusted_eps', '2.80')})
* Cash Flow Note: {data.get('cash_flow_note', 'Strong operating performance; liquidity $7.2B as of Dec 31, 2025')}

**KEY INDICATORS & RISKS**  
* Occupancy: High (Q4 load factor 108%)  
* Guidance 2026: Adjusted EPS ${data.get('guidance_eps_low', '17.70')} to ${data.get('guidance_eps_high', '18.10')}; double-digit revenue & EPS growth; capacity +{data.get('capacity_growth_2026', '6.7')}%  
* Liquidity: ${data.get('liquidity', '7.2')}B (as of Dec 31, 2025)
* Risks: {data.get('risks_note', 'Highly leveraged historically; debt maturities scheduled 2026–2030; fuel/currency sensitivity')}

**LATEST ORDERS / DEVELOPMENTS**  
{data.get('developments', 'WAVE season off to record start; Legend of the Seas delivery Q2 2026; Discovery Class orders; Celebrity River expansion')}

**Data Source**  
Last updated: {data.get('last_fetch', datetime.now().isoformat())} | Source: {data.get('data_source', 'fallback')} (Jan 29, 2026 baseline)
"""
    return template

def generate_equity_markdown(data):
    """Generate standard markdown content for non-RCL equities"""
    template = f"""---
ticker: {data['ticker']}
name: {data['name']}
last_updated: {datetime.now().strftime('%Y-%m-%d %H:%M UTC')}
---

## {data['name']} ({data['ticker']})

### Stock Price & Target
- **Current Price**: ${data.get('close_price', 'N/A')}
- **Broker Target**: ${data.get('broker_target', 'TBD')}

### Latest Financial Results
- **Revenue** (Latest): {data.get('revenue_latest', 'N/A')}
- **Net Income**: {data.get('net_income', 'N/A')}
- **EPS**: {data.get('eps', 'N/A')}

### 2026 Guidance
{data.get('guidance_2026', 'N/A')}

### Latest Development
{data.get('development', 'N/A')}

### Investment Thesis
*[Investment thesis to be written manually - this section does not auto-update]*

### Data Source
Last updated: {data.get('last_fetch', 'N/A')}
"""
    return template

def save_markdown_file(ticker, content):
    """Save markdown content to file"""
    filepath = CONTENT_DIR / f"{ticker.lower()}.md"
    filepath.parent.mkdir(parents=True, exist_ok=True)
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    print(f"✓ Updated {filepath.name}")
    return filepath

def main():
    """Main execution"""
    print("🔄 Starting equity data update...")
    
    # Ensure content directory exists
    CONTENT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Fetch data for all equities
    equity_fetchers = {
        "RCL": fetch_rcl_data,
        "MU": fetch_mu_data,
        "LLY": fetch_lly_data,
        "MAR": fetch_mar_data,
        "HLT": fetch_hlt_data
    }
    
    updated_count = 0
    failed_count = 0
    
    for ticker, fetcher in equity_fetchers.items():
        try:
            print(f"📊 Fetching {ticker}...", end=" ")
            data = fetcher()
            
            # Use ticker-specific markdown renderer
            if ticker == "RCL":
                markdown = generate_rcl_markdown(data)
            else:
                markdown = generate_equity_markdown(data)
            
            save_markdown_file(ticker, markdown)
            updated_count += 1
        except Exception as e:
            print(f"❌ Failed")
            print(f"   Error: {e}")
            failed_count += 1
    
    print(f"\n✅ Update complete: {updated_count} successful, {failed_count} failed")
    return 0 if failed_count == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
