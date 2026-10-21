import { postMetadata } from '../../../lib/seo';

export const metadata = postMetadata('/blog/nokia-dci');

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
