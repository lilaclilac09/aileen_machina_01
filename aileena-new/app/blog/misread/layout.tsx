import { postMetadata } from '../../../lib/seo';

export const metadata = postMetadata('/blog/misread');

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
