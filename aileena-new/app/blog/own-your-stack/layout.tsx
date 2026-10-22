import { postMetadata } from '../../../lib/seo';

export const metadata = postMetadata('/blog/own-your-stack');

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
