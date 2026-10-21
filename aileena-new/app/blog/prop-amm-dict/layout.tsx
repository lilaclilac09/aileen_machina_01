import { postMetadata } from '../../../lib/seo';

export const metadata = postMetadata('/blog/prop-amm-dict');

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
