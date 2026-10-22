import { postMetadata } from '../../../lib/seo';

export const metadata = postMetadata('/blog/instant-inference');

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
