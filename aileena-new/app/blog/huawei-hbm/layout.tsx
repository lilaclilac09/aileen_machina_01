import { postMetadata } from '../../../lib/seo';

export const metadata = postMetadata('/blog/huawei-hbm');

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
