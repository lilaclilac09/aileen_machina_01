/** Shared workspace ids. Keep this file free of Next/Node-only imports (Edge chat uses cfClient). */
export const OWNER_COMPUTER_ID = 'owner';
export const CWID_RE = /^v-[a-z0-9]{8,32}$/;

export function isComputerWorkspaceName(name: string): boolean {
  return name === OWNER_COMPUTER_ID || CWID_RE.test(name);
}
