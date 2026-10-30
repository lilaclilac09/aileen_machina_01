import { postMetadata } from '../../../lib/seo';

export const metadata = postMetadata('/blog/prompts-to-shared-skills');

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
