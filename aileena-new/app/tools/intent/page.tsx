import IntentAggregatorTool from '../../../components/tools/IntentAggregatorTool';
import { toolMetadata } from '../../../lib/seo';

export const metadata = toolMetadata('intent');

export default function IntentToolPage() {
  return <IntentAggregatorTool />;
}
