/**
 * Donation config. Crypto (Solana Pay) is live behind a flag; fiat (Stripe)
 * is stubbed for later. Nothing here is surfaced in the UI until
 * NEXT_PUBLIC_DONATE_ENABLED === '1'.
 */

// The dedicated receiving address (NOT a personal wallet). Overridable by env.
export const DONATE_SOL_ADDRESS =
  process.env.NEXT_PUBLIC_DONATE_SOL_ADDRESS ||
  'HpAeSK6bcRuZywQNpoYhGUtqvKD9zntCWb9B1hRDnzTj';

// USDC SPL mint on Solana mainnet-beta.
export const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

export const DONATE_ENABLED = process.env.NEXT_PUBLIC_DONATE_ENABLED === '1';

export type Asset = 'SOL' | 'USDC';

/**
 * Build a Solana Pay URI. Phones open it straight into a wallet; desktops
 * scan it as a QR. No transaction is constructed in the browser — the wallet
 * does that — so we never touch web3.js or a private key.
 */
export function solanaPayURI(opts: { asset: Asset; amount?: number }): string {
  const params = new URLSearchParams();
  if (opts.amount && opts.amount > 0) params.set('amount', String(opts.amount));
  if (opts.asset === 'USDC') params.set('spl-token', USDC_MINT);
  params.set('label', 'AILEENA MACHINA');
  params.set('message', 'Thank you for supporting the writing and the agent');
  return `solana:${DONATE_SOL_ADDRESS}?${params.toString()}`;
}
