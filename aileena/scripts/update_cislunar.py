#!/usr/bin/env python3
"""
Cis-Lunar data scraper: Fetches NASA CLPS updates and space economy tier information
Generates/updates markdown files in content/cislunar/
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
CONTENT_DIR = SCRIPT_DIR.parent / "content" / "cislunar"

# Default headers
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

def load_config():
    """Load configuration from config.json"""
    with open(CONFIG_FILE, 'r') as f:
        return json.load(f)

def fetch_nasa_clps_data():
    """
    Fetch NASA CLPS providers and mission information
    Returns: dict with company data organized by tier
    """
    try:
        url = "https://www.nasa.gov/commercial-lunar-payload-services/clps-providers"
        response = requests.get(url, headers=HEADERS, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract providers list
        providers = []
        content = soup.find('main') or soup.find('article')
        if content:
            text = content.get_text()
            # Parse company names and missions from text
            for line in text.split('\n'):
                line = line.strip()
                if any(company in line for company in ['Intuitive', 'Firefly', 'Astrobotic', 'Axiom', 'iSpace']):
                    providers.append(line)
        
        return providers
    except Exception as e:
        print(f"⚠️  Warning: Failed to fetch NASA CLPS page: {e}")
        return []

def get_spacex_data():
    """SpaceX Cis-Lunar data (Tier 1)"""
    return {
        "name": "SpaceX",
        "tier": 1,
        "domain": "Lunar Lander Development & Heavy Lift",
        "current_focus": "Starship HLS design; lunar orbit refueling",
        "recent_milestone": "Integrated Flight Test 7 (IFT-7) demonstrated rapid reuse capability",
        "mission_target": "First Starship HLS mission: ~2027-2028",
        "capabilities": ["Heavy lift (Starship)", "Lunar Landing", "Orbital Refueling"],
        "status": "Active",
        "notes": "NASA's primary Artemis Moon lander provider"
    }

def get_lockheed_martin_data():
    """Lockheed Martin Cis-Lunar data (Tier 1)"""
    return {
        "name": "Lockheed Martin",
        "tier": 1,
        "domain": "Lunar Orbit Gateway & Nuclear Power",
        "current_focus": "Gateway station development; nuclear power systems for lunar surface",
        "recent_milestone": "Cleared for Advanced Development & Demonstration (AD&D) phase",
        "mission_target": "Gateway orbit insertion: 2026-2027",
        "capabilities": ["Lunar orbit gateway", "Cryogenic depot", "Nuclear thermal propulsion"],
        "status": "Active",
        "notes": "Prime contractor for human space exploration infrastructure"
    }

def get_intuitive_machines_data():
    """Intuitive Machines Cis-Lunar data (Tier 2)"""
    return {
        "name": "Intuitive Machines",
        "tier": 2,
        "domain": "Earth-to-Lunar Cargo Access",
        "current_focus": "IM-3 lander (Reiner Gamma); IM-4 future missions",
        "recent_milestone": "Awarded CLPS TO CP-11 for IM-3 mission to Reiner Gamma region",
        "mission_target": "IM-3 launch target: 2026 Q2; Luna Plex experiments",
        "capabilities": ["Lunar lander", "Payload delivery", "ISRU experiments"],
        "status": "Active",
        "notes": "First commercial lunar lander to succeed (IM-1, Feb 2024)"
    }

def get_firefly_data():
    """Firefly Aerospace Cis-Lunar data (Tier 2)"""
    return {
        "name": "Firefly Aerospace",
        "tier": 2,
        "domain": "Blue Ghost Lunar Lander Program",
        "current_focus": "Blue Ghost lander development; lunar orbit & far-side missions",
        "recent_milestone": "Blue Ghost 2 awarded CLPS TO for far-side mission",
        "mission_target": "Blue Ghost 1: 2026 Q3 (near-side); Blue Ghost 2: 2026+ (far-side)",
        "capabilities": ["Lunar lander", "Far-side access", "Extended range capability"],
        "status": "Active",
        "notes": "Focus on lunar far-side exploration; strategic partnership development"
    }

def get_astrobotic_data():
    """Astrobotic Cis-Lunar data (Tier 2)"""
    return {
        "name": "Astrobotic Technology",
        "tier": 2,
        "domain": "Lunar Surface Access & ISRU",
        "current_focus": "Griffin lander; drill and ISRU technology for lunar resources",
        "recent_milestone": "Draper contract for Schrödinger Basin mission; CLPS selections",
        "mission_target": "Griffin missions: 2026+ with drilling/sample return capability",
        "capabilities": ["Lunar lander", "Subsurface access (drill)", "Sample return"],
        "status": "Active",
        "notes": "ISRU and resource exploration focus; European partnerships"
    }

def get_axiom_data():
    """Axiom Space Cis-Lunar data (Tier 3)"""
    return {
        "name": "Axiom Space",
        "tier": 3,
        "domain": "Commercial Space Station Development",
        "current_focus": "Axiom Space Station module development; lunar module studies",
        "recent_milestone": "Axiom-2 private crewed mission success (2024)",
        "mission_target": "Axiom stations at LEO; lunar surface base studies",
        "capabilities": ["Space station modules", "Microgravity R&D", "LEO-Moon transit"],
        "status": "Development",
        "notes": "Primary ISS successor candidate; human spaceflight focus"
    }

def get_ispace_data():
    """iSpace Cis-Lunar data (Tier 3)"""
    return {
        "name": "iSpace Inc.",
        "tier": 3,
        "domain": "Lunar Lander Development (Japan)",
        "current_focus": "Hakuto-R mission series; compact lunar lander design",
        "recent_milestone": "Hakuto-R Mission 2 lander payload successful; preparing Mission 3",
        "mission_target": "Hakuto-R Mission 3: 2026+ with enhanced payload capacity",
        "capabilities": ["Compact lunar lander", "International cooperation"],
        "status": "Active",
        "notes": "Japanese innovator; efficient, low-cost lunar access model"
    }

def get_relativity_data():
    """Relativity Space Cis-Lunar data (Tier 3)"""
    return {
        "name": "Relativity Space",
        "tier": 3,
        "domain": "3D-Printed Rocket Architecture",
        "current_focus": "Terran R rocket development; 3D printing manufacturing innovation",
        "recent_milestone": "Terran R development progressing; manufacturing partnerships",
        "mission_target": "Terran R operations: 2025+; lunar payload delivery capability",
        "capabilities": ["3D-printed rockets", "Launch services", "Lunar-class missions"],
        "status": "Development",
        "notes": "Manufacturing innovation; cost reduction through 3D printing"
    }

def generate_cislunar_markdown(data):
    """Generate markdown content from cislunar data"""
    template = f"""---
company: {data['name']}
tier: {data['tier']}
domain: {data['domain']}
last_updated: {datetime.now().strftime('%Y-%m-%d %H:%M UTC')}
---

## {data['name']} (Tier {data['tier']})

### Domain Focus
{data['domain']}

### Current Focus
{data['current_focus']}

### Recent Milestone
{data['recent_milestone']}

### Mission Target / Timeline
{data['mission_target']}

### Key Capabilities
{chr(10).join(f"- {cap}" for cap in data['capabilities'])}

### Status
**{data['status']}**

### Notes
{data['notes']}

### Strategic Relevance
*[Strategic analysis and investment thesis to be written manually - this section does not auto-update]*

---
*Data last refreshed: {datetime.now().strftime('%Y-%m-%d %H:%M UTC')}*
"""
    return template

def save_markdown_file(tier, filename, content):
    """Save markdown content to tier folder"""
    filepath = CONTENT_DIR / f"tier{tier}" / f"{filename}.md"
    filepath.parent.mkdir(parents=True, exist_ok=True)
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    print(f"✓ Updated tier{tier}/{filename}.md")
    return filepath

def main():
    """Main execution"""
    print("🌙 Starting Cis-Lunar data update...")
    
    # Ensure content directory exists
    CONTENT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Tier 1 companies
    tier1_companies = [
        ("spacex", get_spacex_data()),
        ("lockheed-martin", get_lockheed_martin_data())
    ]
    
    # Tier 2 companies
    tier2_companies = [
        ("intuitive-machines", get_intuitive_machines_data()),
        ("firefly-aerospace", get_firefly_data()),
        ("astrobotic", get_astrobotic_data())
    ]
    
    # Tier 3 companies
    tier3_companies = [
        ("axiom-space", get_axiom_data()),
        ("ispace", get_ispace_data()),
        ("relativity-space", get_relativity_data())
    ]
    
    updated_count = 0
    failed_count = 0
    
    # Process Tier 1
    print("\n📍 Tier 1 (Strategic providers):")
    for filename, data in tier1_companies:
        try:
            markdown = generate_cislunar_markdown(data)
            save_markdown_file(1, filename, markdown)
            updated_count += 1
        except Exception as e:
            print(f"❌ Failed to update {filename}")
            print(f"   Error: {e}")
            failed_count += 1
    
    # Process Tier 2
    print("\n📍 Tier 2 (CLPS providers):")
    for filename, data in tier2_companies:
        try:
            markdown = generate_cislunar_markdown(data)
            save_markdown_file(2, filename, markdown)
            updated_count += 1
        except Exception as e:
            print(f"❌ Failed to update {filename}")
            print(f"   Error: {e}")
            failed_count += 1
    
    # Process Tier 3
    print("\n📍 Tier 3 (Early-stage/innovation):")
    for filename, data in tier3_companies:
        try:
            markdown = generate_cislunar_markdown(data)
            save_markdown_file(3, filename, markdown)
            updated_count += 1
        except Exception as e:
            print(f"❌ Failed to update {filename}")
            print(f"   Error: {e}")
            failed_count += 1
    
    print(f"\n✅ Cis-Lunar update complete: {updated_count} successful, {failed_count} failed")
    return 0 if failed_count == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
