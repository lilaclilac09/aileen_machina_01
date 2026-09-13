/** Shared workspace ids. Keep this file free of Next/Node-only imports (Edge chat uses cfClient). */
export const OWNER_COMPUTER_ID = 'owner';
export const CWID_RE = /^v-[a-z0-9]{8,32}$/;

/** One public pad. Anyone with /proof?room=open shares this Durable Object. Not the owner computer. */
export const SHARED_COMPUTER_ROOM_ID = 'v-sharedroom01';
export const SHARED_COMPUTER_ROOM_QUERY = 'open';
export const SHARED_COMPUTER_ROOM_PATH = '/proof?room=open';
export const SHARED_COMPUTER_ROOM_HEADER = 'x-aileena-computer-room';

export function isComputerWorkspaceName(name: string): boolean {
  return name === OWNER_COMPUTER_ID || CWID_RE.test(name);
}

export function isSharedComputerRoom(id: string): boolean {
  return id === SHARED_COMPUTER_ROOM_ID;
}

export function isSharedComputerRoomToken(value: string | null | undefined): boolean {
  const raw = (value || '').trim().toLowerCase();
  return raw === SHARED_COMPUTER_ROOM_QUERY || raw === 'share' || raw === SHARED_COMPUTER_ROOM_ID;
}
