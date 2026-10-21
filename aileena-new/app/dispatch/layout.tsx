import type { Metadata } from 'next';
import { blogPosts } from '../../lib/seo';

export const metadata: Metadata = {
  title: 'Dispatch',
  description: 'Research dispatches, investing notes, essays and the listening shelf by Aileen Choo.',
};

/** Visually hidden but readable by screen readers and crawlers; the visual page is unchanged. */
const visuallyHidden: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

/**
 * The /dispatch page is a client carousel, so its post links are not all in
 * the server HTML. This server-rendered index lists every post as a plain link.
 */
export default function DispatchLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav aria-labelledby="dispatch-index-heading" style={visuallyHidden} data-testid="dispatch-index">
        <h1 id="dispatch-index-heading">Dispatch: research and essays by Aileen Choo</h1>
        <ul>
          {blogPosts().map((p) => (
            <li key={p.href}>
              <a href={p.href}>{p.title}</a> <time dateTime={p.date.replace(/\./g, '-')}>{p.date}</time>
            </li>
          ))}
        </ul>
      </nav>
      {children}
    </>
  );
}
