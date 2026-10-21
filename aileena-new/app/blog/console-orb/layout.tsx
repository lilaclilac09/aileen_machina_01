import { postMetadata } from '../../../lib/seo';

export const metadata = postMetadata('/blog/console-orb');

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
