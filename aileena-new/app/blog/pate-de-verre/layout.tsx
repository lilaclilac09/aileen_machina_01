import { postMetadata } from '../../../lib/seo';

export const metadata = postMetadata('/blog/pate-de-verre');

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
