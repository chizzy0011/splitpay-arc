// Split-share color coding used across the split bar, recipient avatars, and
// the hero live-preview. Indigo / ochre / green trio, then a small extension.
export const SHARE_COLORS = [
  "#4F46E5", // indigo
  "#C0803A", // ochre
  "#2F9160", // green
  "#7C3AED", // violet
  "#0E7490", // teal
  "#B23A32", // brick
];

export function shareColor(i: number): string {
  return SHARE_COLORS[i % SHARE_COLORS.length];
}

/** Two-char avatar seed from an address (first hex pair after 0x). */
export function avatarSeed(address: string): string {
  const a = address.replace(/^0x/, "");
  return (a.slice(0, 2) || "0x").toUpperCase();
}

export function shortAddr(address: string): string {
  if (!/^0x[a-fA-F0-9]{6,}$/.test(address)) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
