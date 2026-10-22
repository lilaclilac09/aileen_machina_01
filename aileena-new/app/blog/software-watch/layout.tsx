import { postMetadata } from '../../../lib/seo';

export const metadata = postMetadata('/blog/software-watch');

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
