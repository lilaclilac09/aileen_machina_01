import { postMetadata } from '../../../lib/seo';

export const metadata = postMetadata('/blog/watch-listening-shelf');

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
