import InklingClipTool from '../../../components/tools/InklingClipTool';
import { toolMetadata } from '../../../lib/seo';

export const metadata = toolMetadata('inkling-clips', { alternates: { canonical: '/audio-clipping' } });

export default function InklingClipsToolPage() {
  return <InklingClipTool />;
}
