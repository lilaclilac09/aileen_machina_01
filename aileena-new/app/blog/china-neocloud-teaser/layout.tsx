import { postMetadata } from '../../../lib/seo';

export const metadata = postMetadata('/blog/china-neocloud-teaser');

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
