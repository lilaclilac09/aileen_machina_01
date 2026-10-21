import { postMetadata } from '../../../lib/seo';

export const metadata = postMetadata('/blog/ai-cooling');

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
