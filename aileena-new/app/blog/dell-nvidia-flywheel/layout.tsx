import { postMetadata } from '../../../lib/seo';

export const metadata = postMetadata('/blog/dell-nvidia-flywheel');

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
