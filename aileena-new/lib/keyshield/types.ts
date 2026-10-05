export type KsPasskey = {
  id: string;
  publicKeySpki: string;
  counter: number;
  vaultId: string;
  sealIv: string;
  sealCipher: string;
  createdAt: string;
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
