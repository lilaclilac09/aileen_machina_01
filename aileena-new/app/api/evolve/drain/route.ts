import { handleEvolveDrain } from '../../../../lib/evolution/drainHandler';

export const maxDuration = 15;

/** POST — GitHub Actions OIDC only. Pops uncovered visitor asks from Redis. */
export async function POST(req: Request) {
  return handleEvolveDrain(req);
}
