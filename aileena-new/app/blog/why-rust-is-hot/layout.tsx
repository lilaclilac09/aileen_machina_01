import { postMetadata } from '../../../lib/seo';

export const metadata = postMetadata('/blog/why-rust-is-hot');

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
