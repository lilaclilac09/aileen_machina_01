import { postMetadata } from '../../../lib/seo';

export const metadata = postMetadata('/blog/suffocating-bias');

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
