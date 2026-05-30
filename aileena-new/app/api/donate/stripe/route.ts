import { NextResponse } from 'next/server';

/**
 * Fiat (card) donations — STUB. Wired up only once a Stripe account exists.
 * When STRIPE_SECRET_KEY is set we'll create a one-off Checkout session here
 * and return its URL; until then this is intentionally inert.
 */
export const runtime = 'nodejs';

export async function POST() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: 'Card donations are not set up yet. Use a Solana wallet for now.' },
      { status: 501 },
    );
  }
  // TODO: const session = await stripe.checkout.sessions.create({ mode: 'payment', ... })
  return NextResponse.json({ error: 'Stripe wiring pending.' }, { status: 501 });
}
