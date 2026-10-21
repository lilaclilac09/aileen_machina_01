import { postMetadata } from '../../../lib/seo';

export const metadata = postMetadata('/blog/local-models');

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
