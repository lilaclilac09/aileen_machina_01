'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

export default function ReadingSolanaArticle() {
  return (
    <SubstackShell
      category="Reference"
      date="2026.05.29"
      tags="Solana · RPC · API · DAS · Helius"
      title="Reading Solana — From Data Structure to API Call"
      dek="Everything on Solana is an account. Every API call is, underneath, a way of reading one. Here's the whole map — six layers of on-chain data and the exact call that pulls each one back — plus the handful of rules that explain why the API looks the way it does."
    >
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>

        <p style={bodyStyle}>
          Once you internalize one idea, the entire Solana RPC API stops looking like a grab-bag of method names and starts looking like a map. The idea: <strong style={strong}>everything on Solana lives in an account</strong> — a flat blob of bytes with an owner — and every API method is just a different lens for reading those accounts. Balances, tokens, NFTs, validator stake, the block that wrapped your transaction: all of it is account data, sometimes raw, sometimes indexed, sometimes parsed for you off-chain. This is the layer-by-layer mapping, from the data structure on the chain to the call that reads it.
        </p>

        <SectionLabel>The Account Layer</SectionLabel>
        <p style={bodyStyle}>
          An account is the atom. It holds <code style={codeStyle}>lamports</code> (the smallest unit of SOL), a <code style={codeStyle}>data</code> blob, and an <code style={codeStyle}>owner</code> (the program allowed to write to it). Reading state, at bottom, is reading an account.
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.22)' }}>
                <th style={thStyle}>On-chain structure</th>
                <th style={thStyle}>API method</th>
                <th style={thStyle}>What comes back</th>
              </tr>
            </thead>
            <tbody>
              <tr style={trStyle}><td style={tdLabelStyle}>Account &#123; lamports, data, owner &#125;</td><td style={tdStyle}><code style={codeStyle}>getAccountInfo</code></td><td style={tdStyle}>lamports, data (base64), owner, executable</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>Many accounts at once</td><td style={tdStyle}><code style={codeStyle}>getMultipleAccounts</code></td><td style={tdStyle}>same fields, as an array</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>Every account a program owns</td><td style={tdStyle}><code style={codeStyle}>getProgramAccounts</code></td><td style={tdStyle}>account list, with <code style={codeStyle}>filters</code></td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>Token mint account</td><td style={tdStyle}><code style={codeStyle}>getAccountInfo</code> → parse MintLayout</td><td style={tdStyle}>supply, decimals, mintAuthority</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>Token account (ATA)</td><td style={tdStyle}><code style={codeStyle}>getTokenAccountsByOwner</code></td><td style={tdStyle}>amount, mint, owner</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>Balance only (lamports)</td><td style={tdStyle}><code style={codeStyle}>getBalance</code></td><td style={tdStyle}>lamports (u64)</td></tr>
            </tbody>
          </table>
        </div>

        <p style={bodyStyle}>
          Notice that the mint account and the token account both come back through plain account reads — you just have to know the byte layout to decode them. An ATA, by the way, is an <strong style={strong}>associated token account</strong>: the one deterministic address that holds a given wallet&apos;s balance of a given token.
        </p>

        <SectionLabel>The Transaction Layer</SectionLabel>
        <p style={bodyStyle}>
          A transaction is a bundle of signatures plus a message. Once it lands, the chain also attaches <code style={codeStyle}>meta</code> — the receipt, with balance snapshots, logs, and any nested calls. That meta is where most of the useful information actually lives.
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.22)' }}>
                <th style={thStyle}>On-chain structure</th>
                <th style={thStyle}>API method</th>
                <th style={thStyle}>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr style={trStyle}><td style={tdLabelStyle}>Transaction &#123; signatures, message &#125;</td><td style={tdStyle}><code style={codeStyle}>getTransaction</code></td><td style={tdStyle}>the full transaction, meta included</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>Many transactions</td><td style={tdStyle}><code style={codeStyle}>getTransactions</code></td><td style={tdStyle}>up to 1,000 at a time</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>An address&apos;s history</td><td style={tdStyle}><code style={codeStyle}>getSignaturesForAddress</code></td><td style={tdStyle}>signatures + slot only, nothing parsed</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>meta.pre/postBalances</td><td style={tdStyle}><code style={codeStyle}>getTransaction</code> → meta</td><td style={tdStyle}>SOL balance change, aligned by accountKeys index</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>meta.pre/postTokenBalances</td><td style={tdStyle}><code style={codeStyle}>getTransaction</code> → meta</td><td style={tdStyle}>SPL token balance change</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>meta.innerInstructions</td><td style={tdStyle}><code style={codeStyle}>getTransaction</code> → meta</td><td style={tdStyle}>the nested CPI calls (one program invoking another)</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>meta.logMessages</td><td style={tdStyle}><code style={codeStyle}>getTransaction</code> → meta</td><td style={tdStyle}>program log output — where you parse events from</td></tr>
            </tbody>
          </table>
        </div>

        <p style={bodyStyle}>
          The catch with the raw API: it hands you bytes and logs, not meaning. To know that a transaction was a swap, you have to read the logs and the inner instructions yourself. That&apos;s the gap Helius — an RPC provider that indexes and parses on its own servers — fills with an <strong style={strong}>enhanced</strong> layer that does the interpretation for you.
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.22)' }}>
                <th style={thStyle}>Raw structure</th>
                <th style={thStyle}>Helius enhanced API</th>
                <th style={thStyle}>What it adds</th>
              </tr>
            </thead>
            <tbody>
              <tr style={trStyle}><td style={tdLabelStyle}>raw instructions + logs</td><td style={tdStyle}><code style={codeStyle}>getTransactions</code> (Enhanced)</td><td style={tdStyle}>auto-parsed type (SWAP, NFT_SALE…), tokenTransfers, nativeTransfers</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>signature list</td><td style={tdStyle}><code style={codeStyle}>getTransactionsForAddress</code></td><td style={tdStyle}>pagination, type filter, source filter</td></tr>
            </tbody>
          </table>
        </div>

        <SectionLabel>The Block and Slot Layer</SectionLabel>
        <p style={bodyStyle}>
          A slot is a 400ms time bucket (the target); a block is what fills one when the scheduled leader produces it. This layer is how you move between &quot;what time is it on the chain&quot; and &quot;what happened in that window.&quot;
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.22)' }}>
                <th style={thStyle}>On-chain structure</th>
                <th style={thStyle}>API method</th>
                <th style={thStyle}>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr style={trStyle}><td style={tdLabelStyle}>Block &#123; parentSlot, transactions[], rewards[] &#125;</td><td style={tdStyle}><code style={codeStyle}>getBlock</code></td><td style={tdStyle}>the full block, every transaction in it</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>Current slot</td><td style={tdStyle}><code style={codeStyle}>getSlot</code></td><td style={tdStyle}>latest confirmed slot</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>Slot → timestamp</td><td style={tdStyle}><code style={codeStyle}>getBlockTime</code></td><td style={tdStyle}>Unix timestamp</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>Block height</td><td style={tdStyle}><code style={codeStyle}>getBlockHeight</code></td><td style={tdStyle}>current height</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>Recent blockhash (replay guard)</td><td style={tdStyle}><code style={codeStyle}>getLatestBlockhash</code></td><td style={tdStyle}>blockhash + lastValidBlockHeight</td></tr>
            </tbody>
          </table>
        </div>

        <SectionLabel>The Token Layer</SectionLabel>
        <p style={bodyStyle}>
          SPL tokens (Solana&apos;s token standard) are themselves just accounts, but they&apos;re common enough that the API gives them shortcuts so you don&apos;t have to decode layouts by hand.
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.22)' }}>
                <th style={thStyle}>On-chain structure</th>
                <th style={thStyle}>API method</th>
                <th style={thStyle}>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr style={trStyle}><td style={tdLabelStyle}>Mint account</td><td style={tdStyle}><code style={codeStyle}>getTokenSupply</code></td><td style={tdStyle}>uiAmount, decimals, amount</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>All token accounts a wallet holds</td><td style={tdStyle}><code style={codeStyle}>getTokenAccountsByOwner</code></td><td style={tdStyle}>filter by programId or mint</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>Every holder of a mint</td><td style={tdStyle}><code style={codeStyle}>getProgramAccounts</code> + filter</td><td style={tdStyle}>scans all Token Program accounts — slow</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>Token balance (one account)</td><td style={tdStyle}><code style={codeStyle}>getTokenAccountBalance</code></td><td style={tdStyle}>uiAmount, decimals</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>Token balance (many)</td><td style={tdStyle}><code style={codeStyle}>getTokenAccountsByOwner</code></td><td style={tdStyle}>returned in one batch</td></tr>
            </tbody>
          </table>
        </div>

        <p style={bodyStyle}>
          NFTs and compressed assets are the exception. A compressed NFT (a cNFT) doesn&apos;t get its own token account at all — it lives as a leaf in a Merkle tree to save rent (the SOL deposit that keeps an account alive) — so the normal token calls can&apos;t see it. For those you need the <strong style={strong}>DAS</strong> API (Digital Asset Standard), a separate indexed layer built for exactly this.
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.22)' }}>
                <th style={thStyle}>Asset type</th>
                <th style={thStyle}>DAS method</th>
                <th style={thStyle}>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr style={trStyle}><td style={tdLabelStyle}>One NFT / asset</td><td style={tdStyle}><code style={codeStyle}>getAsset</code></td><td style={tdStyle}>metadata, ownership, compression proof</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>All NFTs a wallet holds</td><td style={tdStyle}><code style={codeStyle}>getAssetsByOwner</code></td><td style={tdStyle}>paginated, with sortBy</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>All NFTs in a collection</td><td style={tdStyle}><code style={codeStyle}>getAssetsByGroup</code></td><td style={tdStyle}>groupKey = collection</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>Compressed-NFT Merkle proof</td><td style={tdStyle}><code style={codeStyle}>getAssetProof</code></td><td style={tdStyle}>verify a leaf on-chain</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>Search assets</td><td style={tdStyle}><code style={codeStyle}>searchAssets</code></td><td style={tdStyle}>filter by owner / creator / mint and more</td></tr>
            </tbody>
          </table>
        </div>

        <SectionLabel>The Validator and Stake Layer</SectionLabel>
        <p style={bodyStyle}>
          Who&apos;s producing blocks, who&apos;s delegated to them, and when the next handoff happens — all of it is readable, because validators and stake are (you guessed it) just accounts owned by the vote and stake programs.
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.22)' }}>
                <th style={thStyle}>On-chain structure</th>
                <th style={thStyle}>API method</th>
                <th style={thStyle}>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr style={trStyle}><td style={tdLabelStyle}>All validator vote accounts</td><td style={tdStyle}><code style={codeStyle}>getVoteAccounts</code></td><td style={tdStyle}>current (active) + delinquent (offline)</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>Epoch info</td><td style={tdStyle}><code style={codeStyle}>getEpochInfo</code></td><td style={tdStyle}>epoch, slotIndex, slotsInEpoch, absoluteSlot</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>Epoch schedule</td><td style={tdStyle}><code style={codeStyle}>getEpochSchedule</code></td><td style={tdStyle}>slotsPerEpoch, warmup config (how fast newly activated stake ramps up)</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>Stake account</td><td style={tdStyle}><code style={codeStyle}>getProgramAccounts</code> → Stake Program</td><td style={tdStyle}>delegation, activationEpoch</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>Leader schedule</td><td style={tdStyle}><code style={codeStyle}>getLeaderSchedule</code></td><td style={tdStyle}>slot → validator mapping</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>Block production stats</td><td style={tdStyle}><code style={codeStyle}>getBlockProduction</code></td><td style={tdStyle}>produced / skipped per validator</td></tr>
            </tbody>
          </table>
        </div>

        <SectionLabel>The Network State Layer</SectionLabel>
        <p style={bodyStyle}>
          The last layer is the chain&apos;s vital signs — throughput, fees, supply, who&apos;s online. This is what you read when you&apos;re tuning a transaction or building a dashboard, not chasing a specific account.
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.22)' }}>
                <th style={thStyle}>On-chain structure</th>
                <th style={thStyle}>API method</th>
                <th style={thStyle}>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr style={trStyle}><td style={tdLabelStyle}>Network TPS / performance</td><td style={tdStyle}><code style={codeStyle}>getRecentPerformanceSamples</code></td><td style={tdStyle}>tx count + duration per sample window</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>Network fee</td><td style={tdStyle}><code style={codeStyle}>getFeeForMessage</code></td><td style={tdStyle}>cost for a specific message</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>Priority fee estimate</td><td style={tdStyle}><code style={codeStyle}>getPriorityFeeEstimate</code> (Helius)</td><td style={tdStyle}>suggested microLamports, by percentile</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>Supply</td><td style={tdStyle}><code style={codeStyle}>getSupply</code></td><td style={tdStyle}>total, circulating, nonCirculating</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>Cluster node list</td><td style={tdStyle}><code style={codeStyle}>getClusterNodes</code></td><td style={tdStyle}>IP / version of every gossip node</td></tr>
            </tbody>
          </table>
        </div>

        <SectionLabel>The Whole Map</SectionLabel>
        <p style={bodyStyle}>
          Stacked up, the layers and where the off-chain indexers (Helius, DAS) bolt on look like this:
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <pre style={preStyle}>
{`Solana on-chain state
  │
  ├── Account layer       getAccountInfo / getProgramAccounts
  ├── Transaction layer   getTransaction / getSignaturesForAddress ──► Helius enhanced
  │                                                                     (type, tokenTransfers, nativeTransfers)
  ├── Block layer         getBlock / getSlot / getBlockTime
  ├── Token layer         getTokenAccountsByOwner / getTokenSupply ───► DAS layer
  │                                                                     (getAsset / getAssetsByOwner / searchAssets)
  ├── Validator layer     getVoteAccounts / getEpochInfo
  └── Network layer       getRecentPerformanceSamples / getFeeForMessage`}
          </pre>
        </div>

        <SectionLabel>The Rules That Explain the Shape</SectionLabel>
        <p style={bodyStyle}>
          Six patterns fall out of the map. Learn these and you can usually guess the right method before you look it up.
        </p>

        <div style={{ margin: '32px 0 40px', overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.22)' }}>
                <th style={thStyle}>Rule</th>
                <th style={thStyle}>What it means</th>
              </tr>
            </thead>
            <tbody>
              <tr style={trStyle}><td style={tdLabelStyle}>Account = data container</td><td style={tdStyle}>All state lives in accounts. Every read is, underneath, reading an account.</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>Program = stateless logic</td><td style={tdStyle}><code style={codeStyle}>getAccountInfo(programId)</code> returns bytecode, never state.</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>Index vs real-time</td><td style={tdStyle}><code style={codeStyle}>getSignaturesForAddress</code> reads history from an index; <code style={codeStyle}>getAccountInfo</code> reads current state from a live RPC.</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>Balance changes need a diff</td><td style={tdStyle}>pre/postBalances are snapshots — the change is post − pre, and you compute it yourself.</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>Compressed assets go through DAS</td><td style={tdStyle}>A cNFT has no normal token account, so only the DAS API can find it.</td></tr>
              <tr style={trStyle}><td style={tdLabelStyle}>Enhanced parsing is off-chain</td><td style={tdStyle}>Helius&apos;s type / tokenTransfers are indexed off-chain — not raw on-chain fields.</td></tr>
            </tbody>
          </table>
        </div>

        <p style={bodyStyle}>
          That last rule is the one people trip on most. The chain stores bytes and emits logs; it never tells you &quot;this was a swap.&quot; Any time a field reads like a human sentence — a transaction <em>type</em>, a clean list of token transfers — something off-chain parsed it for you. Useful, but it&apos;s an interpretation layer, not ground truth. When you need ground truth, drop back down to the raw account and decode it yourself.
        </p>

        <div style={{ marginTop: 56 }}>
          <Link href="/#dispatch" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.35em',
            color: 'rgba(255,255,255,0.35)', textDecoration: 'none', textTransform: 'uppercase',
            transition: 'color 0.2s',
          }}>
            ← Back to Archive
          </Link>
        </div>

      </article>
    </SubstackShell>
  );
}

/* ── Shared inline styles ── */
const bodyStyle: React.CSSProperties = {
  fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
  lineHeight: 1.9,
  color: 'rgba(255,255,255,0.65)',
  letterSpacing: '0.025em',
  marginBottom: 24,
};
const strong: React.CSSProperties = { color: 'rgba(255,255,255,0.95)', fontWeight: 600 };
const codeStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '0.88em',
  background: 'rgba(255,255,255,0.06)',
  padding: '1px 6px',
  borderRadius: 3,
  color: '#fff',
};
const preStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '0.78rem',
  lineHeight: 1.6,
  color: 'rgba(255,255,255,0.75)',
  background: 'rgba(0,255,234,0.025)',
  border: '1px solid rgba(0,255,234,0.12)',
  padding: '20px 24px',
  overflowX: 'auto',
  letterSpacing: '0.01em',
  margin: 0,
};
const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.9rem',
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
