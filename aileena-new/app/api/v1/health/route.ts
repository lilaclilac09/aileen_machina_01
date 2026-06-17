import { withApi } from '../../../../lib/api/handler';
import { DATA_RATE } from '../../../../lib/api/ratelimit';
import { ok } from '../../../../lib/api/jsonResp';
import { datasetSummary } from '../../../../lib/data/tools';

export const runtime = 'edge';

export const GET = withApi({ rate: DATA_RATE, scope: 'health' }, async () => {
  return ok({
    service: 'aileena-data-api',
    version: 'v1',
    datasets: datasetSummary(),
    serverTime: new Date().toISOString(),
  });
});

export const OPTIONS = GET;
