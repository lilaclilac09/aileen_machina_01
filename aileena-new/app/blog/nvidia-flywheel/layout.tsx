import { postMetadata } from '../../../lib/seo';

export const metadata = postMetadata('/blog/nvidia-flywheel');

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
