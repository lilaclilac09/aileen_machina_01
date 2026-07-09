'use client';
import Link from 'next/link';
import SubstackShell from '../_substack/SubstackShell';

export default function PateDeVerreArticle() {
  return (
    <SubstackShell
      category="Visual"
      date="2026.05.30"
      tags="Glass · Pâte de Verre · Made by hand"
      title="How I Made These — Glass, Powder by Powder"
      dek="These little squares are pâte de verre — 'paste of glass.' No pouring, no blowing. Just colored glass powder, packed into a mold by hand, and a kiln you have to trust. Here's the whole process, step by step, the way I actually do it."
    >
      <article style={{ maxWidth: 760, margin: '0 auto', padding: '64px 32px 120px' }}>

        <p style={bodyStyle}>
          People assume glass like this is poured or blown. It isn&rsquo;t.{' '}
          <strong style={strong}>Pâte de verre</strong> just means <em>&ldquo;paste of glass&rdquo;</em>{' '}
          &mdash; you build the whole thing out of powder, by hand, and the kiln does the rest. This is
          how one of these little tiles actually gets made, start to finish.
        </p>

        <SectionLabel>1 · Start with powder</SectionLabel>
        <p style={bodyStyle}>
          The glass arrives ground down to a powder &mdash; somewhere between flour and fine sand,
          sorted by color. Finer powder gives that soft, matte, candy-like surface; coarser grains come
          out more glassy and clear. Most of what I use is the fine stuff, because I like the powdery
          look.
        </p>

        <SectionLabel>2 · Mix it into a paste</SectionLabel>
        <p style={bodyStyle}>
          On its own, powder won&rsquo;t hold a shape, so I wet it with a little binder &mdash; basically
          a drop of glue in water &mdash; until each color turns into a thick paste, like wet sugar. The
          binder is just temporary; it burns away in the kiln and leaves nothing behind. It&rsquo;s only
          there to make the powder stay where I put it.
        </p>

        <SectionLabel>3 · Pack the mold — in reverse</SectionLabel>
        <p style={bodyStyle}>
          Now the slow part. I press the paste into a little mold, color by color, with a tiny tool and
          my fingers. The trick is that you work <em>backwards</em>: the very first powder you lay
          against the mold is the surface you&rsquo;ll see at the end. So I have to think in reverse
          &mdash; place the top layer first, the background last. Packing tight matters: loose powder
          comes out full of holes, well-packed powder comes out solid and heavy.
        </p>

        <SectionLabel>4 · Into the kiln, and let go</SectionLabel>
        <p style={bodyStyle}>
          Then it goes in the kiln and I lose all control, which is the hard part. It heats up slowly
          (rush it and it cracks), holds at the temperature where the grains soften and fuse together,
          then cools back down slowly so the glass doesn&rsquo;t crack later from the stress. The key is
          to melt it <em>just enough</em> &mdash; enough for the powder to become one solid piece, but
          not so much that it flows flat and loses the texture and color I packed in.
        </p>

        <SectionLabel>5 · Wait a day. Open it.</SectionLabel>
        <p style={bodyStyle}>
          And then you wait. You can&rsquo;t peek, can&rsquo;t fix anything, can&rsquo;t undo. A full day
          later the kiln is cool and you open it and finally see what you actually made. After years of
          code &mdash; weightless, endless undo &mdash; I love that glass makes you wait and means it.
        </p>
        <p style={bodyStyle}>
          The whole craft really comes down to one quiet thing: <strong style={strong}>how much air
          stays trapped inside</strong>. Powder is mostly air; the firing slowly squeezes it out. Stop
          early and you keep that soft, sugary, lit-from-inside look; push hotter and it turns heavier
          and clearer. Those tiny bubbles that never left aren&rsquo;t a mistake &mdash; they&rsquo;re
          the whole look. It&rsquo;s air I decided to keep.
        </p>

        <SectionLabel>These four</SectionLabel>
        <p style={bodyStyle}>
          The <strong style={strong}>Mondrian</strong> one stayed crisp because I packed the colors
          tight so they wouldn&rsquo;t bleed. The deep <strong style={strong}>maroon</strong> tile kept
          its herringbone because I stopped it just before it melted flat. The blue is calm and solid;
          the little bird is my favorite accident. None of them are perfect &mdash; that&rsquo;s kind of
          the point. Made by hand, not by prompt. ♡
        </p>

        <div style={{ marginTop: 56 }}>
          <Link href="/#glass-bench" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.35em',
            color: 'rgba(255,255,255,0.35)', textDecoration: 'none', textTransform: 'uppercase',
            transition: 'color 0.2s',
          }}>
            ← Back to Visual
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
