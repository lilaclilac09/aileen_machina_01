import { postMetadata } from '../../../lib/seo';

export const metadata = postMetadata('/blog/let-there-be-light');

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
