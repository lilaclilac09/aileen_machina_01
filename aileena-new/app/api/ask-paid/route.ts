import { handleAskPaid } from '../../../lib/mpp/askPaid';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

/** Pay-per-question (MPP charge). Off unless MPP_PAID_ENABLED; see lib/mpp/askPaid.ts. */
export async function POST(req: Request): Promise<Response> {
  return handleAskPaid(req);
}
