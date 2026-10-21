import { postMetadata } from '../../../lib/seo';

export const metadata = postMetadata('/blog/wire-speed');

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
