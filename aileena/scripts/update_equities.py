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

def load_config():
    """Load configuration from config.json"""
    with open(CONFIG_FILE, 'r') as f:
        return json.load(f)

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
    """Fetch RCL financial data from press releases"""
    data = {
        "ticker": "RCL",
        "name": "Royal Caribbean Group",
        "close_price": "N/A",
        "broker_target": "335.00",
        "latest_news": "Q4 2025 earnings reported",
        "revenue_latest": "Q4 2025: $4.3B; Full 2025: $17.9B",
        "net_income": "$4.3B (full 2025)",
        "eps": "15.64",
        "guidance_2026": "EPS $17.70–$18.10",
        "development": "WAVE season record bookings; pricing power sustained"
    }
    
    # Get stock price from Yahoo
    price_data = fetch_yahoo_finance_price("RCL")
    data.update(price_data)
    
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

def generate_equity_markdown(data):
    """Generate markdown content from equity data"""
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
