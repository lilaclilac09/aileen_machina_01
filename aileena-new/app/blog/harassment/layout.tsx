import { postMetadata } from '../../../lib/seo';

export const metadata = postMetadata('/blog/harassment');

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
