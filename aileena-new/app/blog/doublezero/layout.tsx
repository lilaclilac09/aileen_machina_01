import { postMetadata } from '../../../lib/seo';

export const metadata = postMetadata('/blog/doublezero');

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
