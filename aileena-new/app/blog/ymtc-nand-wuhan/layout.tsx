import { postMetadata } from '../../../lib/seo';

export const metadata = postMetadata('/blog/ymtc-nand-wuhan');

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
