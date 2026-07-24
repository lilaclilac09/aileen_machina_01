/**
 * Single import surface for every agent tool that queries Aileen's
 * tracked data. Plug into streamText({ tools: { ...agentDataTools, ... } }).
 *
 * Diagnostic helpers also exposed so /api/chat can surface dataset sizes
 * in the X-* headers and so the system prompt can be auto-augmented with
 * "you have N SKUs, M earnings docs..." context if we want.
 */

import { skuTools, skuDatasetInfo } from './sku';
import { pricingTools, pricingDatasetInfo } from './pricing';
import { newsTools, newsDatasetInfo } from './news';
import { docTools, docDatasetInfo } from './docs';
import { socialTools, socialDatasetInfo } from './social';

export const agentDataTools = {
  ...skuTools,
  ...pricingTools,
  ...newsTools,
  ...docTools,
  ...socialTools,
};

export function datasetSummary() {
  return {
    skus: skuDatasetInfo(),
    pricing: pricingDatasetInfo(),
    news: newsDatasetInfo(),
    docs: docDatasetInfo(),
    social: socialDatasetInfo(),
  };
}
