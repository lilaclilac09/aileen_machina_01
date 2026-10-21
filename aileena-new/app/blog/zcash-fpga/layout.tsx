import { postMetadata } from '../../../lib/seo';

export const metadata = postMetadata('/blog/zcash-fpga');

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
