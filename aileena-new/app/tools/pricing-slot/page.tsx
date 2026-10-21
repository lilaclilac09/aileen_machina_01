import PricingSlotTool from '../../../components/tools/PricingSlotTool';
import { NOINDEX, toolMetadata } from '../../../lib/seo';

export const metadata = toolMetadata('pricing-slot', { robots: NOINDEX });

export default function PricingSlotPage() {
  return <PricingSlotTool />;
}
