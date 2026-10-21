import { postMetadata } from '../../../lib/seo';

export const metadata = postMetadata('/blog/ai-hardware-scarcity');

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
