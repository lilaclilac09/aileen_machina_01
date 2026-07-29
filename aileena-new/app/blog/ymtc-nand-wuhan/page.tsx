'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

const references = [
  {
    label: 'SemiAnalysis — The Impending Chinese NAND Apocalypse (YMTC 128L)',
    href: 'https://newsletter.semianalysis.com/p/the-impending-chinese-nand-apocalypse-e01',
  },
  {
    label: 'SemiAnalysis — 2022 NAND Process Technology Comparison (YMTC densest 1Tb TLC)',
    href: 'https://newsletter.semianalysis.com/p/2022-nand-process-technology-comparison',
  },
  {
    label: 'SemiAnalysis — China and USA Are Officially At Economic War (YMTC / Lam ~7%)',
    href: 'https://newsletter.semianalysis.com/p/china-and-usa-are-officially-at-economic',
  },
  {
    label: 'SemiAnalysis — China’s CXMT Is Set to Challenge DRAM Incumbents (Jun 2026; YMTC aside)',
    href: 'https://newsletter.semianalysis.com/p/chinas-cxmt-is-set-to-challenge-dram',
  },
  {
    label: 'AP — CXMT Shanghai IPO debut (Jul 2026)',
    href: 'https://apnews.com/article/cxmt-china-memory-chips-debut-shares-9cd8b79866cf4bd5ef7c1cb81215e796',
  },
  {
    label: 'Caproasia — YMTC STAR IPO plans / Unigroup + Big Fund founding frame (May 2026)',
    href: 'https://www.caproasia.com/2026/05/27/china-state-backed-semiconductor-company-yangtze-memory-technologies-co-ymtc-plans-shanghai-star-market-ipo-at-44-billion-valuation-founded-in-2016-by-china-state-backed-tsinghua-unigroup-nation/',
  },
  {
    label: 'Digitimes — YMTC funding / post-Unigroup holding structure (Apr 2025)',
    href: 'https://www.digitimes.com/news/a20250429VL210/yangtze-memory-ymtc-funding-xmc.html',
  },
  {
    label: 'Companion — Why Huawei\'s Bet Isn\'t on the Chip (CXMT as HBM variable)',
    href: '/blog/huawei-hbm',
  },
  {
    label: 'Companion — Two Supply Chains, One Bottleneck',
    href: '/blog/huawei-supply',
  },
];

export default function YmtcNandWuhanArticle() {
  return (
    <SubstackShell
      category="Analysis"
      date="2026.07.28"
      tags="CXMT · YMTC · NAND · Wuhan · stigma · government capital · SemiAnalysis · IPO"
      title="Next IPO Is Wuhan — YMTC (Yangtze Memory)"
      dek={
        <>
          Hefei listed CXMT. Next: Wuhan — a city name still sticky with coronavirus stigma for
          many English-language readers. That stigma is worth discussing; so is why it stuck. Under
          it: Optics Valley, government-backed chip capital, and{' '}
          <strong>Yangtze Memory (YMTC)</strong>.
        </>
      }
    >
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>
        <p style={bodyStyle}>
          On <strong style={strong}>27 July 2026</strong>,{' '}
          <strong style={strong}>ChangXin Memory Technologies (CXMT)</strong> — China&apos;s DRAM
          champion, based in <strong style={strong}>Hefei</strong> — debuted on the Shanghai STAR
          Market. First-day trading printed a blockbuster: shares up on the order of{' '}
          <strong style={strong}>~466%</strong>, a mainland market cap that briefly made CXMT the
          most valuable China-listed company, after raising on the order of{' '}
          <strong style={strong}>$8.6B+</strong> in the IPO itself. That is a capital-markets event.
          It is also a map event.
        </p>
        <p style={bodyStyle}>
          The next IPO line people are already drawing points at{' '}
          <strong style={strong}>Wuhan</strong> — and at{' '}
          <strong style={strong}>YMTC / Yangtze Memory</strong>. If Hefei is where China lists{' '}
          <em>DRAM</em>, Wuhan is where China built the other half of the memory stack:{' '}
          <strong style={strong}>NAND flash</strong>. The IPO headlines will keep saying
          &ldquo;memory.&rdquo; The useful follow-up is: which memory, which city, and which
          analyst already treated that city as a structural variable — not a footnote.
        </p>
        <p style={bodyStyle}>
          Short answer: <strong style={strong}>SemiAnalysis did</strong> — repeatedly, and in depth —
          from 2021 onward. This piece is the Wuhan / YMTC companion to the CXMT listing week, with
          the SemiAnalysis trail named so you can go read the primary notes. But first: the name
          itself.
        </p>

        <SectionLabel>The Wuhan you know — and the stigma that stuck</SectionLabel>
        <p style={bodyStyle}>
          Say <strong style={strong}>Wuhan</strong> to a global English-language audience in 2026 and
          a lot of people still do not hear fabs. They hear <strong style={strong}>coronavirus</strong>.
          The city name got sticky with a pandemic origin story — shorthand, moral weather, a place
          that arrived in foreign feeds as contagion before it arrived as industry. In plain English:
          that is <strong style={strong}>stigma</strong> — not only fear of a virus, but a place name
          reduced to a contaminated sign. The pollution is semantic. It keeps working years after the
          acute crisis, the way Chernobyl or Fukushima still arrive as disaster nouns before they
          arrive as cities.
        </p>
        <p style={bodyStyle}>
          The useful question is not only &ldquo;was the naming fair.&rdquo; It is{' '}
          <strong style={strong}>what social machinery made the stigma stick</strong> — why a
          multi-million industrial city could be overwritten by one medical event in the public
          imagination outside China.
        </p>

        <SectionLabel>Why the stigma held — five English-language mechanisms</SectionLabel>
        <p style={bodyStyle}>
          <strong style={strong}>1 · First-contact media ecology.</strong> For much of the world,
          Wuhan entered the timeline as a breaking-news noun, not as a place with history. Platform
          news rewards a single origin pin: one city, one wet-market/lab meme, one face for
          fear. Complexity (global travel, asymptomatic spread, parallel outbreaks) loses to a
          place-name that can trend. Once the pin is set, later corrections rarely displace it —
          the first frame occupies the slot.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>2 · Scapegoating under uncertainty.</strong> Pandemics produce
          rage and helplessness. Societies often convert that into a{' '}
          <em>locatable blame object</em> — a city, a foodway, a foreigner — because blame feels
          like control. Wuhan became that object for audiences who needed somewhere to point.
          Tragedy happened; scapegoating is the social surplus layered on top. Stigma is the
          surplus that outlives the acute death counts.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>3 · Geopolitics mapped onto disease.</strong> The early 2020s were
          already a US–China confrontation decade: tariffs, Entity Lists, chip bans, narrative war.
          A pathogen that could be narrated as &ldquo;from China / from Wuhan&rdquo; slotted neatly
          into an existing enemy grammar. Public health vocabulary and great-power vocabulary
          fused. When that fusion holds, a city name stops being geography and becomes a proxy in
          the rivalry — useful for politicians, toxic for anyone who actually lives or builds
          there.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>4 · Racialization and civilizational othering.</strong> Disease
          stigma rarely stays on a map pin. It slides onto bodies, restaurants, students, accents —
          the old pattern of pathologizing East Asia as dirty, opaque, or dangerous. &ldquo;Wuhan
          virus&rdquo; talk and anti-Asian violence were not separate stories; they were the same
          social current. A city stigma that racializes is sticky because it attaches to identity,
          not only to epidemiology.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>5 · Asymmetric update speed.</strong> Outbreak headlines are cheap
          and viral. Fab density tables, national chip-fund ownership charts, and SemiAnalysis NAND
          tear-downs are expensive and niche. The information market therefore keeps refreshing the
          stigma and under-refreshes Wuhan&apos;s semiconductor campus. Capital and policy then
          inherit a <em>distorted map</em>: Hefei gets a ticker narrative; Wuhan stays a virus
          association until someone forces the industrial noun back into the sentence —{' '}
          <strong style={strong}>YMTC / Yangtze Memory</strong>.
        </p>
        <p style={bodyStyle}>
          So the stigma is worth discussing on its own — not as a PR scrub, and not as denial that
          tragedy happened. Worth discussing because stigma <em>selects what counts as knowledge</em>.
          The mechanisms above are why that selection bias did not fade when the acute crisis
          did — especially for readers whose only Wuhan was the one on cable news.
        </p>
        <p style={bodyStyle}>
          When this essay says the next IPO story is in Wuhan, it is doing two jobs at once. One is
          memory hardware: YMTC, Xtacking, wafer starts, Entity List, ChipBook. The other is naming:
          refusing to let coronavirus be the only public meaning of a city that also runs one of
          China&apos;s hardest semiconductor bets. The stigma is part of the story because the
          social machinery that produced it is still running in English-language public space.
        </p>

        <SectionLabel>Two cities, two memory products</SectionLabel>
        <p style={bodyStyle}>
          Memory is not one ticker. <strong style={strong}>DRAM</strong> (what CXMT sells) is the
          working memory of servers and phones — dense, fast, refreshed constantly.{' '}
          <strong style={strong}>NAND</strong> (what YMTC sells) is persistent storage — SSDs, phone
          flash, the cheap bits that hold the model weights and the photo library. AI pulls on both:
          HBM / DRAM near the accelerator, NAND in the storage hierarchy behind it. China&apos;s
          industrial policy built champions for each, in different provincial capitals, with
          different tool dependencies and different sanction clocks.
        </p>
        <Table
          headers={['', 'CXMT', 'YMTC']}
          rows={[
            ['City', 'Hefei (Anhui)', 'Wuhan — Optics Valley tech park (Hubei)'],
            ['Product', 'DRAM (DDR / LPDDR path; HBM as the open question)', '3D NAND (Xtacking)'],
            ['Ownership', 'Provincial + national chip-fund capital', 'Government-backed: national Big Fund + Hubei/Wuhan vehicles; no single controller'],
            ['2026 capital event', 'Shanghai STAR Market IPO — public price discovery', 'Pre-IPO listing prep reported; still on the US Entity List'],
            ['Production unit', 'DRAM wafer starts (Hefei)', '~2 Wuhan fabs · ~200k WPM reported; phase-3+ roadmap'],
            ['Prior deep read here', 'Huawei HBM bottleneck variable', 'This essay + SemiAnalysis trail'],
          ]}
        />
        <p style={bodyStyle}>
          We already put CXMT inside the Ascend story: the stockpile burns down;{' '}
          <Link href="/blog/huawei-hbm" style={inlineLink}>
            Huawei&apos;s bet isn&apos;t only the chip
          </Link>
          ; domestic HBM from CXMT is the curve that decides whether the SuperPod story stays
          solvent. The IPO does not finish that curve — it finances and prices it. Wuhan is the
          parallel question for <em>bits that persist</em>.
        </p>

        <SectionLabel>Wuhan background — a chip campus, not a blank map</SectionLabel>
        <p style={bodyStyle}>
          <strong style={strong}>Yangtze Memory Technologies Co. (YMTC)</strong> was formally
          established in <strong style={strong}>July 2016</strong> in{' '}
          <strong style={strong}>Wuhan</strong>, Hubei — inside the East Lake High-tech /
          <strong style={strong}>Optics Valley</strong> campus (think a regional semiconductor +
          optics tech park, not a tourism slogan) that already hosted a 12-inch wafer lineage under{' '}
          <strong style={strong}>Wuhan Xinxin / XMC</strong>. The founding pitch was not “start NAND
          from a greenfield PowerPoint.” It was: take an existing Wuhan wafer base, pour national +
          provincial capital into a dedicated 3D NAND manufacturer, and chase layer count + density until
          China had a storage product that was not just subsidized — but measurable against Samsung /
          SK Hynix / Micron / Kioxia in tear-downs.
        </p>
        <p style={bodyStyle}>
          Early corporate history is inseparable from <strong style={strong}>Tsinghua Unigroup</strong>{' '}
          — a sprawling Chinese tech conglomerate that acted as the industrial sponsor putting YMTC
          on the map, then entered bankruptcy restructuring (from 2021). The post-Unigroup chapter
          matters for ownership (below): YMTC was carved out so the NAND program would survive the
          parent’s balance-sheet failure. Headquarters, fabs, and the public “Wuhan memory” brand
          stayed in Optics Valley; the holding stack was rewritten around Hubei / Wuhan government
          investment vehicles plus the national chip funds.
        </p>
        <p style={bodyStyle}>
          Product surface today: 3D NAND wafers/die, embedded flash, client and enterprise SSD
          paths, consumer brand <strong style={strong}>Zhitai</strong>, and the architecture
          trademark SemiAnalysis kept returning to — <strong style={strong}>Xtacking</strong>. R&amp;D
          nodes are reported beyond Wuhan (Shanghai / Beijing and others); the manufacturing gravity
          remains Wuhan.
        </p>

        <SectionLabel>Who owns YMTC — government money, not founder VC</SectionLabel>
        <p style={bodyStyle}>
          Short answer for an English capital-markets reader:{' '}
          <strong style={strong}>YMTC is a government-backed industrial champion</strong>, closer to
          a national-champion build than to a Silicon Valley fab startup. It is not usually a single
          Beijing ministry “central SOE” with one parent on the org chart. Instead, national chip
          funds and Hubei / Wuhan local government investors dominate the register — plural official
          capital, patient enough to fund fabs through yield winters.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Founding capital (2016).</strong> Public establishment notices and
          later filings describe phase-one money from China’s{' '}
          <strong style={strong}>National Integrated Circuit Industry Investment Fund</strong>{' '}
          (trade press shorthand: the <strong style={strong}>Big Fund</strong> — a state-directed
          semiconductor financing vehicle), Hubei provincial industrial funds, and Hubei Science
          &amp; Technology Investment Group — built on Wuhan Xinxin — with Tsinghua Unigroup and the
          Big Fund again in the second phase. Caproasia’s 2026 IPO write-up still frames the origin
          as Unigroup + Big Fund + government investment on the order of a
          multi-ten-billion-dollar national memory bet.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>After Unigroup’s collapse.</strong> Digitimes (Apr 2025) and
          restructuring coverage describe YMTC separated into a holding structure led by{' '}
          <strong style={strong}>Hubei Science and Technology Investment</strong> / related Wuhan
          vehicles — so the NAND assets would not be trapped inside Unigroup’s bankruptcy estate.
          Big Fund Phase II and local Hubei vehicles reappeared in later capital increases (reported
          registered capital jumping into the ~RMB 100B+ class in 2023).
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>2026 pre-IPO ownership picture (reported).</strong> Mainland press
          covering YMTC’s May 2026 Shanghai STAR Market listing preparation is consistent on the
          shape, even when exact percentages move between stories:
        </p>
        <ul style={listStyle}>
          <li>
            <strong style={strong}>No controlling shareholder</strong> on the disclosed register —
            deliberately plural government capital, not one listed parent.
          </li>
          <li>
            Largest named block often cited:{' '}
            <strong style={strong}>Hubei Changsheng Development</strong> at roughly{' '}
            <strong style={strong}>~26.5%</strong>, itself a braid of a Hubei chip fund + Wuhan
            Optics Valley Financial Holdings + a Yangtze River industrial investment vehicle —
            province, city, and campus capital woven together.
          </li>
          <li>
            <strong style={strong}>Big Fund I + II</strong> still large (on the order of ~20%+
            combined in several write-ups); other Wuhan Optics Valley industrial investment arms and
            bank-affiliated industry funds as minorities.
          </li>
          <li>
            Some summaries put <strong style={strong}>government-linked holders above ~90%</strong>{' '}
            of the equity — treat the exact decimal as filing-dependent; treat the direction as
            settled: this is not a founder-VC NAND startup that happens to sit in Wuhan.
          </li>
        </ul>
        <p style={bodyStyle}>
          So when SemiAnalysis modeled YMTC as a structural NAND variable, the invisible half of the
          model was always <strong style={strong}>patient official balance sheets</strong> willing to
          fund 100k-WPM-class fabs through yield winters — until tool bans changed which half of the
          recipe money can still buy.
        </p>

        <SectionLabel>Production — fabs, wafers/month, expansion</SectionLabel>
        <p style={bodyStyle}>
          SemiAnalysis’s 2021–2022 unit of account was roughly{' '}
          <strong style={strong}>~100k wafers per month (WPM) per fab</strong>: ~80–100k of
          competitive NAND by early 2022 in the “apocalypse” framing; second fab tooling up; third
          under construction; funding talk for a fourth. That was the pre-Entity-List expansion
          grammar.
        </p>
        <p style={bodyStyle}>
          Mainland 2026 pre-IPO / industry coverage updates the <em>reported</em> Wuhan
          production map (numbers move; cite as media summaries of company filings, not audited
          SemiAnalysis ChipBook cells):
        </p>
        <Table
          headers={['Layer', 'Reported (2026 pre-IPO press)']}
          rows={[
            ['Installed Wuhan fabs', 'Two operating wafer fabs in Wuhan'],
            ['Combined wafer starts', '~200k WPM total across the two fabs'],
            ['Phase 3', 'Equipment install underway; target end-2026 production; ~50k WPM stage cited for 2027 in some reports'],
            ['Longer roadmap', 'Two more fabs after phase 3; ~500k WPM all-in aspiration if tools + yield cooperate'],
            ['Geography', 'Wuhan Optics Valley — manufacturing gravity stays in Hubei'],
          ]}
        />
        <p style={bodyStyle}>
          Read those expansion lines the way SemiAnalysis taught: capacity is not a press-release
          destination — it is conditional on etch/dep tools, domestic substitution under the Entity
          List, and ASP/mix. A 500k WPM slide without Lam-class upgrades is a different object from
          the 2022 density-lead story.
        </p>
        <p style={bodyStyle}>
          Brand / product ports matter commercially even when the process lead is constrained: YMTC
          ships into domestic phone/SSD channels and the Zhitai retail path; export share still
          shows up in customs-based trackers (see ChipBook below). Production port = Wuhan wafers;
          revenue port = whoever can still buy the bits.
        </p>

        <SectionLabel>What SemiAnalysis actually said about YMTC</SectionLabel>
        <p style={bodyStyle}>
          SemiAnalysis (Dylan Patel&apos;s shop) did not &ldquo;mention&rdquo; YMTC in passing. From
          2021 they treated it as China&apos;s first semiconductor product that was{' '}
          <strong style={strong}>technologically competitive</strong> with the global NAND leaders —
          and then as a capacity + sanctions variable that could reprice the whole industry.
        </p>

        <p style={bodyStyle}>
          <strong style={strong}>2021 — the &ldquo;NAND apocalypse&rdquo; note.</strong>{' '}
          <em>The Impending Chinese NAND Apocalypse – YMTC 128 Layer NAND Is The First Semiconductor
          Where China Is Technologically Competitive</em> argued that YMTC&apos;s shipping 128-layer
          TLC was not a press-release layer count. TechInsights-style tear-downs, in SemiAnalysis&apos;s
          telling, showed competitive (and in some dimensions superior) density and array efficiency
          at similar layer counts. Capacity framing in that era: on the order of{' '}
          <strong style={strong}>~80k → ~100k wafers/month</strong> of competitive NAND by early
          2022, with a second fab of similar scale under construction — enough, depending on mix and
          yield, for mid-single-digit global share. The word they used for the incumbents&apos;
          problem was not &ldquo;copycat.&rdquo; It was structural.
        </p>
        <p style={bodyStyle}>
          <a
            href="https://newsletter.semianalysis.com/p/the-impending-chinese-nand-apocalypse-e01"
            target="_blank"
            rel="noopener noreferrer"
            style={inlineLink}
          >
            Read: Chinese NAND Apocalypse (SemiAnalysis)
          </a>
        </p>

        <p style={bodyStyle}>
          <strong style={strong}>2022 — process comparison, densest shipping TLC.</strong>{' '}
          <em>2022 NAND – Process Technology Comparison, China&apos;s YMTC Shipping Densest NAND…</em>{' '}
          put YMTC in the same table as Samsung, SK Hynix, Micron, Solidigm, Kioxia, and Western
          Digital. The highlight SemiAnalysis and Angstronomics published: YMTC&apos;s{' '}
          <strong style={strong}>Xtacking 3.0</strong> was shipping the densest commercial{' '}
          <strong style={strong}>1Tb TLC</strong> at about{' '}
          <strong style={strong}>15.2 Gbit/mm²</strong>, with layer count described as &ldquo;more
          than 230&rdquo; — SemiAnalysis&apos;s belief:{' '}
          <strong style={strong}>232 layers</strong> — comparable in their write-up to Micron&apos;s
          232L class on a 6-plane / ~2.4 Gbps style architecture, and already shipping to partners.
          YMTC was coy on official layer counts; SemiAnalysis treated that coyness as sanction-aware
          disclosure management, the same genre as SMIC not advertising 7 nm.
        </p>
        <p style={bodyStyle}>
          Fab scale in that report: second fab nearly full of tools; third under construction;
          funding talk for a fourth;{' '}
          <strong style={strong}>~100k WPM per fab</strong> as the unit of expansion. Line from the
          piece that still matters after the Entity List:{' '}
          <em>they will structurally change the NAND industry</em> — if yields catch cost, and if
          tools keep arriving.
        </p>
        <p style={bodyStyle}>
          <a
            href="https://newsletter.semianalysis.com/p/2022-nand-process-technology-comparison"
            target="_blank"
            rel="noopener noreferrer"
            style={inlineLink}
          >
            Read: 2022 NAND Process Technology Comparison (SemiAnalysis)
          </a>
        </p>

        <SectionLabel>Xtacking — why the architecture mattered</SectionLabel>
        <p style={bodyStyle}>
          Conventional 3D NAND builds the peripheral CMOS and the memory array on related process
          paths that fight each other for area and thermal budget. YMTC&apos;s{' '}
          <strong style={strong}>Xtacking</strong> (hybrid bonding / wafer-to-wafer: CMOS wafer bonded
          to array wafer) is the reason SemiAnalysis kept calling the product{' '}
          <em>innovative</em>, not merely subsidized. Separate wafers → more array efficiency on the
          die → higher bit density at a given layer count. That is the mechanical reason a 128L or
          232L YMTC die could look denser than &ldquo;same layer count&rdquo; peers in the
          comparison tables.
        </p>
        <p style={bodyStyle}>
          SemiAnalysis also named the tool and IP dependencies honestly: heavy use of{' '}
          <strong style={strong}>Lam Research</strong>-class etch/deposition productivity, and
          licensed hybrid-bonding IP in the Adeia / Xperi lineage. Homegrown architecture + imported
          tool chain + state capital is the Wuhan recipe — until the import half breaks.
        </p>

        <SectionLabel>Sanctions — the other half of the model</SectionLabel>
        <p style={bodyStyle}>
          December 2022 put YMTC on the U.S. Commerce <strong style={strong}>Entity List</strong>.
          SemiAnalysis had already been writing the prequel: tool bans as the lever that stops YMTC
          expansions <em>and</em> complicates Samsung / SK Hynix NAND fabs inside China. In{' '}
          <em>China and USA Are Officially At Economic War</em>, they flagged YMTC as the biggest
          memory name on the unverified / Entity-list path and stated the equipment hit explicitly:{' '}
          <strong style={strong}>Lam Research ~7% of revenue</strong> at risk from the YMTC ban —
          the sharpest single-name equipment exposure in that write-up.
        </p>
        <p style={bodyStyle}>
          <a
            href="https://newsletter.semianalysis.com/p/china-and-usa-are-officially-at-economic"
            target="_blank"
            rel="noopener noreferrer"
            style={inlineLink}
          >
            Read: China / USA economic war overview (SemiAnalysis)
          </a>
        </p>
        <p style={bodyStyle}>
          So the 2021–2022 SemiAnalysis YMTC file has two chapters that still trade against each
          other: <strong style={strong}>(1)</strong> density and fab-scale optimism when tools flow;{' '}
          <strong style={strong}>(2)</strong> a hard stop on advanced U.S. equipment when they
          don&apos;t. Post-Entity-List YMTC is still a NAND variable — domestic SSD, handset flash,
          export share where channels remain — but the &ldquo;structurally change the industry&rdquo;
          path is now conditional on domestic tools, yield under constraint, and how much of the
          pre-ban process lead survives without Lam-class upgrades.
        </p>

        <SectionLabel>ChipBook, trackers, and the attention shift</SectionLabel>
        <p style={bodyStyle}>
          SemiAnalysis still keeps YMTC inside the Memory Model / ChipBook surface — notably a{' '}
          <strong style={strong}>YMTC Global Market Share Tracker</strong> built off Chinese export
          data (value and volume), not a one-off 2021 apocalypse essay. That is the living series for
          Wuhan after Hefei’s IPO: CXMT now has a public tape; YMTC is still mostly observed through
          tear-downs, customs, and third-party share trackers.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>May 2026 ChipBook.</strong> The tracker update that circulated from
          the May ’26 edition is an ASP story disguised as an export story: YMTC manufacturing-base
          April export <em>value</em> up on the order of{' '}
          <strong style={strong}>+651% YoY</strong>, while export <em>volume</em> was only up about{' '}
          <strong style={strong}>~10%</strong>. SemiAnalysis’s implication is straightforward —
          revenue is being pushed by higher selling prices in a memory supercycle, not by a matching
          explosion in bits shipped. Read Wuhan through that lens: capacity headlines and ASP
          headlines can diverge hard.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>June 2026 — CXMT takes the long form.</strong>{' '}
          <em>China’s CXMT Is Set to Challenge DRAM Incumbents</em> (23 Jun 2026) is the reminder that
          Dylan Patel’s shop now spends its deep pages on Hefei DRAM / HBM ambition. YMTC appears as
          a side comparison: private / hard-to-observe China memory peers (CXMT pre-IPO and YMTC)
          were always difficult to model from the outside — then CXMT listed, and the observability
          gap widened further in CXMT’s favor.
        </p>
        <p style={bodyStyle}>
          <strong style={strong}>Honest conclusion on coverage.</strong> SemiAnalysis has not
          abandoned YMTC — the ChipBook tracker and sanction asides (including external quotes from
          analysts like Ray Wang on China memory tool limits) still exist. But the{' '}
          <em>dedicated process/capacity long reads</em> of 2021–2022 have not been repeated at that
          intensity. Attention rotated to <strong style={strong}>CXMT + the memory supercycle</strong>.
          Wuhan remains a modeled variable; Hefei became the prose subject.
        </p>
        <p style={bodyStyle}>
          <a
            href="https://newsletter.semianalysis.com/p/chinas-cxmt-is-set-to-challenge-dram"
            target="_blank"
            rel="noopener noreferrer"
            style={inlineLink}
          >
            Read: China’s CXMT Is Set to Challenge DRAM Incumbents (SemiAnalysis)
          </a>
        </p>

        <SectionLabel>How to read CXMT IPO week without collapsing the map</SectionLabel>
        <ul style={listStyle}>
          <li>
            <strong style={strong}>Do not say &ldquo;China memory&rdquo; as one bet.</strong> Hefei
            DRAM ≠ Wuhan NAND. Different process, different tools, different sanction status, different
            customer stacks — and different observability after CXMT’s listing.
          </li>
          <li>
            <strong style={strong}>Government capital is not optional color.</strong> YMTC’s recipe was always
            national chip fund + Hubei/Wuhan government vehicles + (historically) Unigroup industrial
            sponsorship. Post-restructuring, the register is still official-capital-led even without one
            controller.
          </li>
          <li>
            <strong style={strong}>Production ports are Wuhan wafer starts.</strong> Treat ~200k WPM
            / phase-3 / 500k aspiration as tutoring-era reported capacity, then stress-test against
            Entity List tool reality — the same way SemiAnalysis conditioned 100k-WPM fabs on tool
            flow in 2022.
          </li>
          <li>
            <strong style={strong}>CXMT IPO prices the DRAM / HBM ambition.</strong> It does not
            automatically fund or unlock YMTC&apos;s next etch tool. The Ascend HBM essay still
            hinges on CXMT yield — see{' '}
            <Link href="/blog/huawei-hbm" style={inlineLink}>
              David&apos;s stockpile
            </Link>
            .
          </li>
          <li>
            <strong style={strong}>YMTC&apos;s peak density story is real in the SemiAnalysis record</strong>{' '}
            — 128L competitive, then Xtacking 3.0 as densest shipping 1Tb TLC at ~15.2 Gbit/mm² /
            ~232L. Treat that as a <em>pre-ban process achievement</em>, then ask what survives
            under Entity List constraints.
          </li>
          <li>
            <strong style={strong}>Equipment is the coupling term.</strong> SemiAnalysis&apos;s Lam
            ~7% line is the reminder that Wuhan was never &ldquo;just a Chinese fab story&rdquo; —
            it was a U.S. tool P&amp;L line item until it wasn&apos;t.
          </li>
        </ul>

        <SectionLabel>Closing</SectionLabel>
        <p style={bodyStyle}>
          CXMT&apos;s listing week will dominate Chinese financial media because public markets love
          a first-day print. The analytical habit SemiAnalysis already trained for Wuhan is the one
          worth keeping: <strong style={strong}>name the city</strong>,{' '}
          <strong style={strong}>name the government-capital stack</strong>,{' '}
          <strong style={strong}>name the WPM</strong>,{' '}
          <strong style={strong}>name the density</strong>,{' '}
          <strong style={strong}>name the tool exposure</strong>, then update the sanctions
          boundary — and notice when the long-form attention moved to Hefei while Wuhan stayed in
          the tracker. Hefei went public. Wuhan still has to answer whether Xtacking-class NAND can
          keep scaling when the Lam-shaped part of the recipe is on the Entity List.
        </p>
        <p style={bodyStyle}>
          And name the stigma when it is doing work: for too many English-language readers,
          coronavirus still pollutes what &ldquo;Wuhan&rdquo; means. That is not a side note — it is
          why <strong style={strong}>YMTC / Yangtze Memory</strong> has to be said out loud. The next
          IPO line is not only a ticker path. It is a fight over which Wuhan gets to be public
          knowledge.
        </p>
        <p style={bodyStyle}>
          That is the map after the IPO — not a second ticker, a second city.
        </p>

        <SectionLabel>References</SectionLabel>
        <ul style={listStyle}>
          {references.map((r) => (
            <li key={r.href}>
              {r.href.startsWith('/') ? (
                <Link href={r.href} style={inlineLink}>
                  {r.label}
                </Link>
              ) : (
                <a href={r.href} target="_blank" rel="noopener noreferrer" style={inlineLink}>
                  {r.label}
                </a>
              )}
            </li>
          ))}
        </ul>
        <p style={{ ...bodyStyle, marginTop: 32, color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
          <Link href="/dispatch" style={inlineLink}>
            Back to Dispatch
          </Link>
        </p>
      </article>
    </SubstackShell>
  );
}

function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div style={{ margin: '28px 0 36px', overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.82rem',
          lineHeight: 1.5,
          color: 'rgba(255,255,255,0.7)',
        }}
      >
        <thead>
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                style={{
                  textAlign: 'left',
                  fontFamily: 'monospace',
                  fontSize: '0.58rem',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'rgba(0,255,234,0.75)',
                  borderBottom: '1px solid rgba(0,255,234,0.25)',
                  padding: '8px 12px 10px 0',
                  whiteSpace: 'nowrap',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    padding: '12px 14px 12px 0',
                    verticalAlign: 'top',
                    color: j === 0 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.65)',
                    fontWeight: j === 0 ? 500 : 400,
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: 'monospace',
        fontSize: '0.6rem',
        letterSpacing: '0.45em',
        color: '#00ffea',
        textTransform: 'uppercase',
        marginBottom: 20,
        marginTop: 56,
        opacity: 0.8,
      }}
    >
      {children}
    </p>
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
const listStyle: React.CSSProperties = {
  fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
  lineHeight: 1.9,
  color: 'rgba(255,255,255,0.65)',
  letterSpacing: '0.025em',
  marginBottom: 24,
  paddingLeft: 22,
};
const inlineLink: React.CSSProperties = {
  color: '#00ffea',
  textDecoration: 'underline',
  textUnderlineOffset: 3,
};
