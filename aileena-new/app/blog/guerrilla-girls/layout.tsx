import { postMetadata } from '../../../lib/seo';

export const metadata = postMetadata('/blog/guerrilla-girls');

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
