'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

const hangarRefs = {
  cailian: 'https://www.cls.cn/detail/2410558',
  xinhuaBayin: 'http://www.nmg.xinhuanet.com/20250718/70f1cc85c9c84743a203a8eb13d984eb/c.html',
} as const;

export default function ChinaNeocloudTeaserArticle() {
  return (
    <SubstackShell
      category="Teaser · 概念扫盲"
      date="2026.08.15"
      tags="Teaser · 概念扫盲 · Neocloud · China · SemiAnalysis · Ulanqab · CoreWeave · Nebius"
      title="Is a Terrestrial Neocloud Possible in China?"
      dek="The megawatts are there. The company is not."
    >
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>

        <p style={bodyStyle}>
          This is the <strong style={strong}>teaser</strong> —{' '}
          <strong style={strong}>概念扫盲</strong>. Same title as the{' '}
          <Link href="/blog/china-neocloud" style={linkStyle}>14 August analysis</Link>.
          That piece is the hangar tour and the Singapore appendix. This one is the method:
          what a neocloud is, how a number is verified, and whose order bought the megawatts.
        </p>

        <p style={bodyStyle}>
          This piece follows one structure. What a neocloud is, how big it is, and what sits
          inside it. Which data centers are comparable, and where. How a number is verified,
          what unit it is in, and which GPU it assumes. Then the two numbers that decide the
          economics: the power price and the compute that is actually usable. Then whose order
          bought the megawatts.
        </p>
        <p style={bodyStyle}>
          Liquid cooling versus air cooling is a later note, not the opening. Air-cooled halls
          show rooftop or side-wall fan rows. Liquid-cooled halls are the ones where a cooling
          tower is the tell. In many Chinese halls the generators sit underground. The absence
          of a US-style tower is not proof of an empty shell.
        </p>

        <SectionLabel>1. What a neocloud is, how big, and what is inside</SectionLabel>
        <p style={bodyStyle}>
          A neocloud is a company, not a building. It sells GPU-hours to someone else:
          on-demand or reserved, for training and inference.{' '}
          <strong style={strong}>CoreWeave</strong>,{' '}
          <strong style={strong}>Nebius</strong> (NASDAQ: NBIS),{' '}
          <strong style={strong}>Lambda</strong>, and{' '}
          <strong style={strong}>Crusoe</strong> are this category. AWS, Azure, Google Cloud,
          and Alibaba Cloud are hyperscalers.{' '}
          <strong style={strong}>GDS</strong>, <strong style={strong}>VNET</strong>, and{' '}
          <strong style={strong}>Runze</strong> are landlords. They sell cabinets and megawatts.
          The landlord owns the airframe. The neocloud is the airline.
        </p>
        <p style={bodyStyle}>
          What sits inside a Western neocloud is three businesses stacked under one word.
        </p>
        <p style={bodyStyle}>
          The first is a <strong style={strong}>developer cloud</strong>: a few cards to a few
          hundred, paid by the hour, a credit card can open it. Lambda and RunPod live here.
          The revenue is real. It is not CoreWeave&rsquo;s backlog.
        </p>
        <p style={bodyStyle}>
          The second is <strong style={strong}>reserved training fabric</strong>: InfiniBand or
          NVLink, thousands to tens of thousands of GPUs, take-or-pay for about three years.
          This is the meat. The customers are Microsoft, Meta, OpenAI, Anthropic. NVIDIA is a
          shareholder, an allocator of cards, and sometimes the residual-value story behind the
          debt. The loan is longer than the contract. The gap is a bet that the used cards
          still rent.
        </p>
        <p style={bodyStyle}>
          The third is a <strong style={strong}>dedicated factory</strong>: Crusoe&rsquo;s
          Abilene campus for Oracle / OpenAI, Fluidstack for Anthropic. The offtaker is one
          lab. The catalog is not public.
        </p>
        <p style={bodyStyle}>
          Scale is spoken in power, not in press-release GPU counts.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>CoreWeave</strong>, Q2 2026: more than{' '}
          <strong style={strong}>1.5 GW</strong> active, about{' '}
          <strong style={strong}>4.2 GW</strong> contracted by 11 August 2026, year-end active
          guide above 1.85 GW, 51 sites. Capex guide $35–39 billion. Backlog about $104 billion.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Nebius</strong>: connected-power target for 2026 of 800 MW to
          1 GW. Contracted-power target raised toward 5 GW by year-end 2026. Mäntsälä Finland
          is 75 MW live. A second Mäntsälä hall is up to 70 MW from 2027. Lappeenranta is up
          to 310 MW. Finland across three sites is planned at 455 MW. Independence, Missouri,
          is approved as a campus with potential capacity up to 1.2 GW. EMEA contracted power
          was already above 750 MW when Lappeenranta was announced (31 March 2026).
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Crusoe</strong>, 9 June 2026: 4.9 GW contracted, including a
          1.2 GW Abilene campus for Oracle and a 900 MW Abilene campus for Microsoft.
        </p>
        <p style={bodyStyle}>
          One card is not one megawatt. An H100 or H200 SXM is about 700 W. A B200 is about
          1,000 W, configurable to 1,200 W. A GB200 NVL72 rack is about 120–132 kW for 72
          GPUs. One thousand H100s are 0.7 MW of GPU silicon alone. Add CPUs, NICs, and
          storage, then multiply by PUE (western China often claims about 1.2). A rough
          working number: about 1 MW of campus power holds on the order of one thousand
          H100s. A B200 campus holds fewer cards per megawatt. A company&rsquo;s
          &ldquo;5 GW contracted&rdquo; is interconnection and offtake, not five million
          cards already seated.
        </p>
        <p style={bodyStyle}>
          Four tests, all required. Frontier GPUs in training quantities. A fabric of about
          10,000 cards, not a lab. Reserved cluster hours sold to a third party at high ACV.
          GPUs financed like aircraft, residual risk on the balance sheet. Fail one and the
          firm is something else. Fail all four and it is a landlord with a liquid-cooling
          brochure.
        </p>

        <SectionLabel>2. Comparable campuses, and the structure used here</SectionLabel>
        <p style={bodyStyle}>
          The comparable object in China is not a ticker. It is a campus that already has
          halls, power, and a named offtaker. The hubs that reporters can enter, and that
          public satellite can at least frame, are these.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Ulanqab</strong> (Wulanchabu), Inner Mongolia: Yiwutang
          (Huawei Ave / Apple Ave / Ali Blvd), Bayin, and the Chayouqianqi Jingmeng pad.
          City figures at year-end 2025: 84 signed data centers, about 330,000 operating
          racks, 66% occupancy (<ExtLink href={hangarRefs.cailian}>Cailian</ExtLink>, 26 June
          2026). UCloud&rsquo;s existing park: cabinet utilization above 95% and GPU{' '}
          <strong style={strong}>91.29%</strong> at 30 June 2026; Building D is about 75%
          intended power, not a signed take-or-pay (STAR inquiry, 31 July 2026).
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Zhongwei</strong>, Ningxia: West Cloud Base on Fengyun Road.
          Rooftop PV and a cooling pond sit next to the halls. Unicom&rsquo;s site visit copy
          is the offtake color, not the roof.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Qingyang</strong>, Gansu: China Computing Valley. The public
          mosaic over Wenquan is older than the park. Do not treat that frame as a Kingsoft
          hall.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Zhangjiakou / Huailai</strong>, Hebei: Chindata Donghuayuan
          and the Heying nameplate. Beijing overflow on landlord megawatts.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Langfang</strong>: Runze International Information Port
          (about 39.60N, 116.72E) and GDS Anci / Xianghe clusters. Runze sells cabinets.
          April 2026 IR had not confirmed the 200 MW all-liquid B-zone as live IT.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Shanghai Lingang</strong>: land AIDC on Lianggang Avenue, and
          the Highlander / Hai Lan Yun 2.3 MW underwater cabin 13.05 km east of Nanhui Cape,
          between offshore-wind phase I turbine 1-25# and phase II. The 14 m cylinder is
          about one Sentinel-2 pixel. Figures 17–18 in the illustrated pack are official
          sea-use planning maps, not satellite.
        </p>
        <p style={bodyStyle}>
          Johor–Batam is the ASEAN analog Semi and Cushman both write in public.
          Cushman&rsquo;s 2026 Global Data Center Market Comparison ranks Johor first among
          APAC primary markets and fifth among global primary markets. Dallas is first
          globally. Shanghai is tenth on global market fundamentals and third among APAC
          primaries. Beijing is seventh in APAC. Ulanqab and Zhongwei do not appear on that
          public list.
        </p>
        <p style={bodyStyle}>
          Cushman &amp; Wakefield&rsquo;s public 2026 comparison covers 107 markets and 24
          variables. What is free is the ranking and a few headline gigawatts (about 31.7 GW
          under construction globally in 2025). The city-level vacancy and megawatt table
          sits behind an email gate. The APAC construction-cost guide (90 clusters, 26
          locations) is the same shape: Japan about $13.0–19.2 million per MW, Taiwan about
          $5.2–7.9 million, China mainland construction-cost inflation written as 0.4% in the
          public digest. Semi&rsquo;s India teaser used about $5 million per MW and power
          under $0.10/kWh. That is shell capex, not a GPU-hour.
        </p>
        <p style={bodyStyle}>
          The structure of this essay keeps three tables unmerged: the shell, the power, and
          the order. A megawatt in the first table is not an offtake in the third.
        </p>

        <SectionLabel>3. How a number is verified, what the unit is, which card</SectionLabel>
        <p style={bodyStyle}>Units first.</p>
        <div style={{ overflowX: 'auto', marginBottom: 32 }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Unit</th>
                <th style={thStyle}>Object</th>
                <th style={thStyle}>Working number</th>
              </tr>
            </thead>
            <tbody>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Watt (W)</td>
                <td style={tdStyle}>one card</td>
                <td style={tdStyle}>H100 / H200 about 700 W. B200 about 1,000–1,200 W.</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Kilowatt (kW)</td>
                <td style={tdStyle}>one rack</td>
                <td style={tdStyle}>A GB200 NVL72 is about 120–132 kW.</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Megawatt (MW)</td>
                <td style={tdStyle}>one campus or one hall group</td>
                <td style={tdStyle}>1 MW = 1,000 kW = 1,000,000 W.</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Gigawatt (GW)</td>
                <td style={tdStyle}>a company&rsquo;s contracted or active fleet</td>
                <td style={tdStyle}>1 GW = 1,000 MW.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style={bodyStyle}>
          Do not add a city&rsquo;s &ldquo;1 GW&rdquo; to a campus door. Do not add contracted
          GW to active GW.
        </p>
        <p style={bodyStyle}>
          Verification is a stack, not a photograph.
        </p>
        <p style={bodyStyle}>
          Satellite, public commercial mosaics, pulled 14 August 2026, archive, not live: can
          show a windowless hall, a rooftop AHU row, a side-wall outdoor-unit row, an empty
          pad, a cooling pond, a PV field. Yiwutang Ali Blvd at 40.9845N 113.2420E shows five
          north–south halls and rooftop AHU rows, plus a pad still under construction. Huailai
          Chindata shows cooling along the long sides of the halls. Langfang Runze shows
          rooftop fan arrays. Bayin is a strip, not a Zhongjin door pin. Qingyang&rsquo;s
          mosaic predates the park. The Lingang cabin cannot be named at 10 m. There is no
          public live hall-level satellite. Starlink is communications, not Earth observation.
        </p>
        <p style={bodyStyle}>
          Satellite cannot show the SKU, the occupancy, the take-or-pay, the tenant, or
          whether the diesel sets are in the basement.
        </p>
        <p style={bodyStyle}>
          Filings and inquiry letters can show utilization and intended kilowatts (UCloud
          STAR). City releases can show rack counts and occupancy (Cailian on Ulanqab).
          Utility tariff sheets can show the door-to-door yuan per kWh. Company pricing pages
          can show a GPU-hour (CoreWeave, Nebius). Channel weeklies can show a China H100
          monthly ask (SMM, 10 July 2026). None of these is a census of cards in a named hall.
        </p>
        <p style={bodyStyle}>
          Which card is in the hall is a separate claim. Export-control public record: H200
          licenses were described as very few (BIS, July 2026). China west parks run a mix
          that public copy names as Ascend, Haiguang, and remaining NVIDIA inventory. An
          H100-hour price and an Ascend-hour price are not the same product. Convert power to
          card counts only after the SKU is named. Otherwise leave the number in megawatts.
        </p>

        <SectionLabel>4. Power price, and compute that is actually usable</SectionLabel>
        <p style={bodyStyle}>
          Ulanqab door-to-door power is about 0.33–0.36 yuan/kWh. The Economic Observer, 14
          August 2026: Inner Mongolia Power&rsquo;s August 2026 agent-purchase price 0.3234
          yuan/kWh; local officials said some compute centers land at about 0.358 yuan/kWh.
          Alibaba on site (21st Century Business Herald / Yicai, 13 August 2026) said about
          0.3 yuan and claimed 90% green power. Zhongjin Bayin&rsquo;s physical renewable
          substitution was 38.74% (<ExtLink href={hangarRefs.xinhuaBayin}>Xinhua</ExtLink>, 18
          July 2025). That is a plant figure, not a satellite figure.
        </p>
        <p style={bodyStyle}>
          At 7.2 yuan to the dollar, 0.36 yuan is about $0.05/kWh. Semi&rsquo;s India teaser
          was under $0.10/kWh. Texas industrial power is on the order of 6 cents. Western
          China is not expensive on electrons.
        </p>
        <p style={bodyStyle}>
          One H100-hour of electricity, at 700 W and PUE about 1.2, is about 0.3 yuan. Idle
          halls burn that too. East China cabinet power has been quoted around 6,000 yuan per
          unit per month in the SMM channel. West China idle is cheaper per kWh. City
          occupancy of 66% is a city number, not a hall meter. Ascend 910B2 was quoted at
          13,500 yuan/month in Wenzhou and was hard to lease (SMM, 10 July 2026). A list
          price with no tenant is idle compute.
        </p>
        <p style={bodyStyle}>
          Usable compute is not nameplate megawatts. It is megawatts that have a card, a
          network, and a buyer. UCloud&rsquo;s 91% GPU utilization is one park&rsquo;s
          inquiry-letter number. Ulanqab&rsquo;s 66% rack occupancy is the city&rsquo;s.
          DeepSeek&rsquo;s 1 GW is a city-level Bloomberg figure (31 July 2026), not a
          seated-card census. Do not multiply a city&rsquo;s GW by 1,000 H100s per MW and
          call it a cluster.
        </p>
        <p style={{ ...bodyStyle, color: 'rgba(255,255,255,0.9)', fontWeight: 600, marginTop: 40 }}>
          GPU-hour, public, mid-2026
        </p>
        <div style={{ overflowX: 'auto', marginBottom: 32 }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Print</th>
                <th style={thStyle}>Number</th>
              </tr>
            </thead>
            <tbody>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>China spot (Yingbo Cloud, early July 2026)</td>
                <td style={tdStyle}>H100 17.88 yuan/hour, about $2.50</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>China monthly closed lease (SMM, 10 July 2026)</td>
                <td style={tdStyle}>H100 75,000–80,000 yuan/month per unit, including Inner Mongolia spot at 80,000. About 100–110 yuan/hour, about $14–15</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>SemiAnalysis one-year H100 contract</td>
                <td style={tdStyle}>$1.70 in October 2025, $2.35 in March 2026</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>Nebius list</td>
                <td style={tdStyle}>H100 on-demand $3.85, preemptible $2.15</td>
              </tr>
              <tr style={trStyle}>
                <td style={tdLabelStyle}>CoreWeave list</td>
                <td style={tdStyle}>H100 8-GPU node $49.24/hour on-demand, $6.16 per GPU; spot about $2.46</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style={bodyStyle}>
          The west is cheap on power and expensive on the closed H100 lease. That gap is the
          export-control card, not the Inner Mongolia tariff. Building-shell capex is a fifth
          cell. Semi&rsquo;s India $5 million/MW is that cell. It is not the cost of model
          compute.
        </p>

        <SectionLabel>5. Whose order</SectionLabel>
        <p style={bodyStyle}>
          Bayin cannot be written as &ldquo;Alibaba plus DeepSeek plus GDS behind one
          door.&rdquo; The three public lines sit on three layers.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Alibaba</strong> is a field sighting in the Bayin core. 21st
          Century Business Herald / Yicai, 13 August 2026: Alibaba Cloud supernodes, Wang
          Chaoyang on tariff and green power. This is a walk-in, not a municipal memorandum.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>DeepSeek</strong> is city-level Ulanqab. Bloomberg, 31 July
          2026: about 1 GW, self-build plus lease. No public door GPS pins it to a Bayin hall.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>GDS</strong> is a city memorandum. 3 June 2026: with Ulanqab,
          more than RMB 30 billion over five years, gigawatt-scale parks. GDS Q2 2026 said
          Ulanqab and Horinger are new markets, and that Changshu in Jiangsu is progressing. A
          MoU is not a Bayin take-or-pay. GDS is also a landlord. It can be a tenant of a park
          and a landlord to a hyperscaler. Do not collapse those roles.
        </p>
        <p style={bodyStyle}>
          Changshu itself is a real GDS campus in company copy (CS1 and CS2 delivered). Public
          Google satellite along Wangwan North Road and Penghu Road, checked 15 August 2026,
          showed warehouses and logistics sheds, not a named hall and not a cooling tower. The
          campus is not disproved. The door is not in that mosaic.
        </p>
        <p style={bodyStyle}>
          Western offtake, for comparison, is named in filings: Microsoft, Meta, OpenAI,
          Anthropic on CoreWeave and Nebius reserved hours. Crusoe&rsquo;s 1.2 GW Abilene is
          written as Oracle. That is the order layer Semi sells in the model and teases in the
          newsletter.
        </p>

        <SectionLabel>6. What SemiAnalysis watches</SectionLabel>
        <p style={bodyStyle}>
          Semi&rsquo;s public datacenter writing is a method, not a China campus list.
        </p>
        <p style={bodyStyle}>
          It tracks more than 5,000 facilities through property records, permits, FOIA power,
          and satellite, with a vision model on rooftop chillers. A site moves from land, to
          ground broken, to shell and cooling plant, to energized, to live IT load. Announced
          gigawatts without site control, equipment deposits, or interconnection are treated
          as 2028-or-later air. Promised megawatts are scored against delivered megawatts each
          quarter.
        </p>
        <p style={bodyStyle}>
          It splits self-build, colo lease, and GPU-cloud rent, and asks who uses the
          megawatt: OpenAI, Anthropic, Microsoft, Meta. It prices the shell as capex excluding
          IT, broken into power, cooling, and building. It prices the card as a GPU-hour and a
          one-year contract. It prices the electron in cents per kWh. It asks whether the
          binding constraint is the chip, the hall, or the grid, including behind-the-meter
          gas.
        </p>
        <p style={bodyStyle}>
          Public case studies of delay are US doors: Nebius / DataOne New Jersey (rooftop
          chillers late), Core Scientific Denton for CoreWeave, STACK / Oracle New Mexico
          slipped toward 2029. Public China copy is thinner: China can build power and would
          lead gigawatt halls if the cards were allowed; they are not, so the US leads. Johor
          is written as Chinese operators internationalizing next to Singapore&rsquo;s 900 MW
          and $0.23/kWh tariff. India, 15 August 2026, was a three-tweet teaser: under 10 GW
          by 2030, about $5 million/MW, power under $0.10/kWh, Microsoft $17.5 billion. The
          site list is gated.
        </p>
        <p style={bodyStyle}>
          What this essay can write that Semi&rsquo;s public feed does not: the Bayin order
          split, the Ulanqab door-to-door yuan, the China H100 monthly ask versus the Western
          contract hour, and the 25 annotated frames that prove a shell and do not prove a
          contract.
        </p>
        <p style={bodyStyle}>
          The megawatts are on the ground. A terrestrial neocloud is a company that sells
          reserved cluster hours to a third party and finances the cards. That company is not
          in the taxi on Huawei Avenue.
        </p>

        <SectionLabel>Read next</SectionLabel>
        <ul style={listStyle}>
          <li>
            <Link href="/blog/china-neocloud" style={linkStyle}>
              Analysis — Is a Terrestrial Neocloud Possible in China? (14 August)
            </Link>
            {' '}— hangar tour, Singapore / Asia appendix, four missing ingredients.
          </li>
        </ul>

        <div style={{ marginTop: 56 }}>
          <Link href="/dispatch" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.35em',
            color: 'rgba(255,255,255,0.35)', textDecoration: 'none', textTransform: 'uppercase',
            transition: 'color 0.2s',
          }}>
            ← Back to Dispatch
          </Link>
        </div>

      </article>
    </SubstackShell>
  );
}

const bodyStyle: React.CSSProperties = {
  fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
  lineHeight: 1.9,
  color: 'rgba(255,255,255,0.65)',
  letterSpacing: '0.025em',
  marginBottom: 24,
};
const strong: React.CSSProperties = { color: 'rgba(255,255,255,0.95)', fontWeight: 600 };
const linkStyle: React.CSSProperties = {
  color: '#00ffea',
  textDecoration: 'none',
  borderBottom: '1px solid rgba(0,255,234,0.35)',
};
const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.85rem',
};
const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 16px 10px 0',
  fontFamily: 'monospace',
  fontSize: '0.65rem',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.55)',
  fontWeight: 600,
};
const trStyle: React.CSSProperties = { borderBottom: '1px solid rgba(255,255,255,0.07)' };
const tdLabelStyle: React.CSSProperties = {
  padding: '14px 16px 14px 0',
  color: 'rgba(255,255,255,0.85)',
  fontWeight: 600,
  verticalAlign: 'top',
};
const tdStyle: React.CSSProperties = {
  padding: '14px 16px 14px 0',
  color: 'rgba(255,255,255,0.7)',
  verticalAlign: 'top',
  lineHeight: 1.55,
};
const listStyle: React.CSSProperties = {
  fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
  lineHeight: 1.9,
  color: 'rgba(255,255,255,0.65)',
  letterSpacing: '0.025em',
  marginBottom: 24,
  paddingLeft: 22,
};

function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} style={linkStyle} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: 'monospace',
      fontSize: '0.6rem',
      letterSpacing: '0.45em',
      color: '#00ffea',
      textTransform: 'uppercase',
      marginBottom: 20,
      marginTop: 56,
      opacity: 0.8,
    }}>
      {children}
    </p>
  );
}
