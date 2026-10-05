import { KS_WALLETS } from './constants';

export type KsWalletId = (typeof KS_WALLETS)[number]['id'];

type SolanaInjected = {
  isPhantom?: boolean;
  isSolflare?: boolean;
  isBackpack?: boolean;
  connect: () => Promise<{ publicKey?: { toString?: () => string; toBase58?: () => string } | string }>;
  signMessage: (msg: Uint8Array, enc?: string) => Promise<Uint8Array | { signature: Uint8Array }>;
};

function asAddress(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  const pk = value as { toString?: () => string; toBase58?: () => string };
  return pk.toBase58?.() || pk.toString?.() || '';
}

function asSignature(value: unknown): Uint8Array<ArrayBuffer> {
  if (value instanceof Uint8Array || ArrayBuffer.isView(value)) {
    const view = value instanceof Uint8Array ? value : new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    const out = new Uint8Array(view.byteLength);
    out.set(view);
    return out;
  }
  if (value && typeof value === 'object' && 'signature' in value) {
    return asSignature((value as { signature: unknown }).signature);
  }
  throw new Error('Wallet did not return a signature.');
}

function readInjected(): Record<KsWalletId, SolanaInjected | null> {
  if (typeof window === 'undefined') {
    return { phantom: null, solflare: null, backpack: null, okx: null };
  }
  const w = window as unknown as {
    solana?: SolanaInjected;
    phantom?: { solana?: SolanaInjected };
    solflare?: SolanaInjected;
    backpack?: SolanaInjected;
    okxwallet?: { solana?: SolanaInjected };
  };
  const phantom = w.phantom?.solana || (w.solana?.isPhantom ? w.solana : null);
  return {
    phantom: phantom || null,
    solflare: w.solflare || (w.solana?.isSolflare ? w.solana : null),
    backpack: w.backpack || (w.solana?.isBackpack ? w.solana : null),
    okx: w.okxwallet?.solana || null,
  };
}

export function installedWallets(): { id: KsWalletId; label: string; href: string; installed: boolean }[] {
  const inj = readInjected();
  return KS_WALLETS.map((row) => ({ ...row, installed: !!inj[row.id] }));
}

export async function connectKsWallet(id: KsWalletId): Promise<{
  address: string;
  signMessage: (msg: Uint8Array) => Promise<Uint8Array<ArrayBuffer>>;
}> {
  const provider = readInjected()[id];
  if (!provider) {
    throw new Error(`${id} is not installed`);
  }
  const acc = await provider.connect();
  const address = asAddress(acc?.publicKey);
  if (!address) throw new Error('Wallet did not return an address.');
  return {
    address,
    signMessage: async (msg) => asSignature(await provider.signMessage(msg, 'utf8')),
  };
}

export function bytesToB64(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
