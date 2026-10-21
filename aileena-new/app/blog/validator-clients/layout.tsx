import { postMetadata } from '../../../lib/seo';

export const metadata = postMetadata('/blog/validator-clients');

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
