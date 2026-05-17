'use client';
import Link from 'next/link';
import ScrollUnlock from '../ScrollUnlock';

export default function ClobArticle() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#000',
      position: 'relative',
      color: '#fff',
      fontFamily: "'Barlow Condensed', system-ui, sans-serif",
      overflowY: 'auto',
      WebkitFontSmoothing: 'antialiased',
    }}>
      <ScrollUnlock />

      {/* ── Nav bar ── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 32px',
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <Link href="/#blog" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontFamily: 'monospace',
          fontSize: '0.65rem',
          letterSpacing: '0.3em',
          color: 'rgba(255,255,255,0.4)',
          textDecoration: 'none',
          textTransform: 'uppercase',
          transition: 'color 0.2s',
        }}
          onMouseEnter={e => (e.currentTarget.style.color = '#00ffea')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
        >
          <span style={{ fontSize: '1rem', lineHeight: 1 }}>←</span>
          Archive
        </Link>
        <span style={{
          fontFamily: 'monospace',
          fontSize: '0.55rem',
          letterSpacing: '0.4em',
          color: 'rgba(255,255,255,0.2)',
          textTransform: 'uppercase',
        }}>
          AILEENA MACHINA
        </span>
      </header>

      {/* ── Hero ── */}
      <section style={{ padding: '80px 32px 64px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 40, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: 'monospace',
            fontSize: '0.55rem',
            letterSpacing: '0.45em',
            color: '#00ffea',
            textTransform: 'uppercase',
            padding: '4px 10px',
            border: '1px solid rgba(0,255,234,0.3)',
          }}>
            ANALYSIS
          </span>
          <span style={{
            fontFamily: 'monospace',
            fontSize: '0.55rem',
            letterSpacing: '0.3em',
            color: 'rgba(255,255,255,0.3)',
          }}>
            2026.05.17
          </span>
          <span style={{
            fontFamily: 'monospace',
            fontSize: '0.55rem',
            letterSpacing: '0.3em',
            color: 'rgba(255,255,255,0.3)',
          }}>
            DeFi · Solana · CLOB · MEV
          </span>
        </div>

        <h1 style={{
          fontSize: 'clamp(2.4rem, 7vw, 5.5rem)',
          fontWeight: 700,
          letterSpacing: '0.04em',
          lineHeight: 1.08,
          marginBottom: 32,
          color: '#fff',
        }}>
          链上订单簿，<br /><span style={{ color: '#00ffea' }}>能活下去的那种</span>
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
          lineHeight: 1.75,
          color: 'rgba(255,255,255,0.55)',
          letterSpacing: '0.03em',
          borderLeft: '2px solid rgba(0,255,234,0.4)',
          paddingLeft: 20,
          marginBottom: 0,
        }}>
          把交易所的撮合系统放到链上，以前大家都觉得不可能。Solana 证明了可以做。
          但订单簿本身不是最难的——谁来买你的单、你会不会被抢跑，才是真正要命的问题。
        </p>
      </section>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />
      </div>

      {/* ── Body ── */}
      <article style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>

        <SectionLabel>01 — 为什么以前做不到</SectionLabel>
        <p style={bodyStyle}>
          链上订单簿的原理其实简单：把交易所的买卖列表放到区块链上，任何人都能挂单、撮合、成交，没有中间人，没有人能跑路。
        </p>
        <p style={bodyStyle}>
          问题在于区块链有个规则：同一个账户同一时间只能有一个人写它。订单簿就是一个账户。你、我、他同时下单，只能排队一个一个来。人少还好，人多就全部堵死。
        </p>
        <p style={bodyStyle}>
          以太坊上试过。失败了。每次改一次报价都要付 gas 费，频繁更新贵到亏钱，根本不现实。最后大家的解法是妥协：报价放在链下，只把成交结果放到链上。不是真正的链上订单簿。
        </p>
        <p style={bodyStyle}>
          Solana 不一样。每 400 毫秒出一个块，手续费极低。速度够了，成本够低了，链上订单簿第一次变得可能。
        </p>

        <SectionLabel>02 — Phoenix：第一个证明可以的</SectionLabel>
        <p style={bodyStyle}>
          以前的 Serum（Solana 上的第一代订单簿）有个设计：你下单，订单进队列，然后需要一个"搬运工"程序定期来处理队列、做撮合、更新账本。这个搬运工要有人一直在链下跑着，是个额外的依赖。
        </p>
        <p style={bodyStyle}>
          Phoenix 把搬运工这个步骤直接塞进你下单的那笔交易里。你一笔交易发出去，里面同时包含：检查订单簿、找到对手方、撮合、更新余额。一步完成，不需要等任何人，不需要任何额外程序在旁边跑。
        </p>
        <p style={bodyStyle}>
          听起来简单，工程上不容易。Solana 每笔交易有计算量上限，把撮合逻辑全部塞进去还不超限，需要极度优化的代码。Phoenix 做到了，证明了这件事可行。
        </p>

        <SectionLabel>03 — Manifest：更激进的做法</SectionLabel>
        <p style={bodyStyle}>
          Manifest 在 Phoenix 的基础上再往前走了一步，而且在几个关键地方更激进。
        </p>
        <p style={bodyStyle}>
          开一个新市场，Phoenix 要 3 SOL 以上，Manifest 不到一分钱。手续费永久为零。这意味着任何人都可以为任何代币创建市场，不需要许可，不需要成本。
        </p>
        <p style={bodyStyle}>
          但 Manifest 最核心的创新是 <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Global Orders</strong>——一个让做市商资金利用率大幅提升的机制。
        </p>

        <blockquote style={{
          margin: '48px 0',
          padding: '28px 32px',
          background: 'rgba(0,255,234,0.04)',
          borderLeft: '3px solid #00ffea',
          fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
          fontWeight: 600,
          letterSpacing: '0.05em',
          lineHeight: 1.5,
          color: 'rgba(255,255,255,0.9)',
        }}>
          "订单簿本身不是最难的。难的是上面一层和下面一层同时搞清楚。"
        </blockquote>

        <SectionLabel>04 — Global Orders：链上版的保证金制度</SectionLabel>
        <p style={bodyStyle}>
          普通做法（包括 Phoenix）：你要在 SOL/USDC 市场做市，就要把钱锁进这个市场的账户。同时想在 WIF/USDC 做市，再锁一份钱进那个账户。五个市场，五份资金，全部分开锁死。
        </p>
        <p style={bodyStyle}>
          Manifest 的 Global Orders：你的钱放在你自己的账户里，不预先锁进任何市场。在十个市场同时挂单，钱还在你那里。等到真的有人来成交了，那一刻才把钱划走——叫 JIT 结算（Just In Time）。
        </p>
        <p style={bodyStyle}>
          结果是：同样 10 万美元，Phoenix 方式分成五份每个市场 2 万，Manifest 方式十个市场同时挂满 10 万。做市商用同样的本金，能提供多倍的流动性。
        </p>
        <p style={bodyStyle}>
          本质上就是 <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Cross Margin</strong>——所有市场共用一个资金池，和 Binance 合约的全仓模式是同一个逻辑。区别是 Manifest 上没有杠杆，你挂的是限价单，成交了就划钱，没成交钱就在那里，没有爆仓风险。
        </p>

        {/* Risk box */}
        <div style={{
          margin: '40px 0',
          padding: '28px 32px',
          background: 'rgba(255,60,60,0.04)',
          border: '1px solid rgba(255,60,60,0.15)',
        }}>
          <p style={{
            fontFamily: 'monospace',
            fontSize: '0.52rem',
            letterSpacing: '0.4em',
            color: 'rgba(255,100,100,0.7)',
            textTransform: 'uppercase',
            marginBottom: 16,
          }}>风险：多个市场同时成交</p>
          <p style={{ ...bodyStyle, marginBottom: 12 }}>
            你有 10 万，在十个市场各挂了 5 万的买单。正常情况下不会同时全部成交，没有问题。
          </p>
          <p style={{ ...bodyStyle, marginBottom: 12 }}>
            但行情剧烈波动时，多个市场可能同时有人来吃你的单。Manifest 的处理是先到先得：第一笔成交划钱，第二笔划钱，第三笔检查余额不够——失败。后面全部失败。
          </p>
          <p style={{ ...bodyStyle, marginBottom: 0 }}>
            你没有损失，但你以为自己在十个市场提供了流动性，实际上只有前几个有效。做市商要自己算好：挂出去的总额不能远超账户余额，否则大部分单在关键时刻都是虚的。
          </p>
        </div>

        <SectionLabel>05 — 谁来买你的单：聚合器这一层</SectionLabel>
        <p style={bodyStyle}>
          0x 是以太坊上的老牌协议，2017 年他们也试过链上订单簿，做不成，最后变成"报价在链下、成交在链上"的模式。现在他们的 Swap API 也支持 Solana 了，会自动在所有市场里比价，把用户的交易路由到最便宜的地方——Phoenix、Manifest、Orca、Raydium 都在比较范围内。
        </p>
        <p style={bodyStyle}>
          对做市商来说，被聚合器接入意味着流量来了。但聚合器只看价格，谁便宜路由谁。你的价差如果比别人宽哪怕 0.1%，交易就不会来你这里。
        </p>
        <p style={bodyStyle}>
          另一个好处是：聚合器带来的是散户流量，不是高频套利机器人。散户不会盯着你的报价抢跑，对做市商来说是质量更好的流量。
        </p>

        <SectionLabel>06 — 被抢跑的成本：Jito 这一层</SectionLabel>
        <p style={bodyStyle}>
          做市商最怕的场景：你报了一个价，一笔大单来了，你知道这单成交后价格会动，想赶紧撤掉旧单重新报价。但还没来得及撤，机器人已经抢在前面把你的旧价格全部吃掉，转手以新价格卖出去。你的单全成交了，但价格已经跑掉了。这叫被抢跑。
        </p>
        <p style={bodyStyle}>
          Jito 是 Solana 上专门处理这类问题的基础设施。它让你可以把"撤单 + 报新价 + 成交"打包成一个原子操作——要么全部成功，要么全部失败，中间没有缝隙给机器人钻。
        </p>
        <p style={bodyStyle}>
          但用 Jito 要付竞价费，而且是跟其他人竞价——你出价越高，你的交易越先被处理。最后做市商把这个成本加进了价差里。你看到的买卖价差，有一块其实是在替做市商承担被抢跑的风险。价差不只是做市商的利润，也是他们的保险费。
        </p>

        <div style={{
          marginTop: 64,
          padding: '40px 32px',
          background: 'rgba(255,255,255,0.025)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          <p style={{
            fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
            fontWeight: 600,
            letterSpacing: '0.06em',
            lineHeight: 1.6,
            color: 'rgba(255,255,255,0.88)',
            margin: 0,
          }}>
            订单簿的代码写好，只是开始。<br />
            <span style={{ color: '#00ffea' }}>
              谁来买你的单、你会不会被抢跑——是另外两个完全不同的问题，但都直接决定你能不能活。
            </span>
          </p>
          <p style={{
            marginTop: 20,
            fontFamily: 'monospace',
            fontSize: '0.6rem',
            letterSpacing: '0.3em',
            color: 'rgba(255,255,255,0.28)',
            textTransform: 'uppercase',
          }}>
            — AILEENA MACHINA / 2026
          </p>
        </div>

        <div style={{ marginTop: 48 }}>
          <Link href="/#blog" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: 'monospace',
            fontSize: '0.6rem',
            letterSpacing: '0.35em',
            color: 'rgba(255,255,255,0.35)',
            textDecoration: 'none',
            textTransform: 'uppercase',
            transition: 'color 0.2s',
          }}>
            ← Back to Archive
          </Link>
        </div>

      </article>
    </div>
  );
}

const bodyStyle: React.CSSProperties = {
  fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
  lineHeight: 1.9,
  color: 'rgba(255,255,255,0.65)',
  letterSpacing: '0.025em',
  marginBottom: 24,
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
