/** URL ảnh đại diện ổn định theo email/mã (dùng khi chưa upload ảnh riêng). */
export function buildUserAvatarUrl(seed: string): string {
  return `https://i.pravatar.cc/256?u=${encodeURIComponent(seed)}`;
}

export function resolveUserAvatarUrl(
  avatarUrl: string | null | undefined,
  fallbackSeed: string
): string {
  const trimmed = avatarUrl?.trim();
  if (trimmed) return trimmed;
  return buildUserAvatarUrl(fallbackSeed);
}
