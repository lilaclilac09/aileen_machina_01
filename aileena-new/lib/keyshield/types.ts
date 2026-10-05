export type KsPasskey = {
  id: string;
  publicKeySpki: string;
  counter: number;
  vaultId: string;
  sealIv: string;
  sealCipher: string;
  createdAt: string;
  label?: string;
};

export type KsVaultEntry = {
  id: string;
  iv: string;
  cipher: string;
  createdAt: string;
};

export type KsVaultDoc = {
  vaultId: string;
  entries: KsVaultEntry[];
  updatedAt: string;
};

export type KsSessionVia = 'wallet' | 'passkey';

export type KsAuthSession = {
  id: string;
  vaultId: string;
  via: KsSessionVia;
  sub: string;
  ua: string;
  createdAt: string;
  revoked?: boolean;
};

export type KsAgent = {
  id: string;
  name: string;
  pubkey: string;
  createdAt: string;
};

export type KsShareGrant = {
  id: string;
  entryId: string;
  recipient: string;
  expires?: string;
  createdAt: string;
};

export type KsTrustDomain = {
  host: string;
  thresholdUsd: number;
  createdAt: string;
};

export type KsSecretKind = 'api_key' | 'password' | 'note' | 'env' | 'ssh_key';

export type KsSecretPlain = {
  kind: KsSecretKind;
  label: string;
  secret: string;
  provider?: string;
  domain?: string;
  username?: string;
  publicKey?: string;
  passphrase?: string;
  expiryDate?: string;
  tags?: string[];
};
