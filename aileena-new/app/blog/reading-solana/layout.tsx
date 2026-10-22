import { postMetadata } from '../../../lib/seo';

export const metadata = postMetadata('/blog/reading-solana');

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
