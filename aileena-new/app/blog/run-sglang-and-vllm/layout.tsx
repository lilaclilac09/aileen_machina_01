import { postMetadata } from '../../../lib/seo';

export const metadata = postMetadata('/blog/run-sglang-and-vllm');

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
