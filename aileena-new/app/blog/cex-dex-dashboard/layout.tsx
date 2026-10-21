import { postMetadata } from '../../../lib/seo';

export const metadata = postMetadata('/blog/cex-dex-dashboard');

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
