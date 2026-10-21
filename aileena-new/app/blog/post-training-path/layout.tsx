import { postMetadata } from '../../../lib/seo';

export const metadata = postMetadata('/blog/post-training-path');

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
