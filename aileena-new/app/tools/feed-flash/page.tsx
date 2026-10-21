import FeedFlashTool from '../../../components/tools/FeedFlashTool';
import { NOINDEX, toolMetadata } from '../../../lib/seo';

export const metadata = toolMetadata('feed-flash', { robots: NOINDEX });

export default function FeedFlashPage() {
  return <FeedFlashTool />;
}
