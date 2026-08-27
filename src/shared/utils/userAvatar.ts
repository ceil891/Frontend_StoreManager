/**
 * Utility xử lý an toàn URL ảnh đại diện cho User và Customer.
 * Loại bỏ hoàn toàn mock ảnh Pravatar bên ngoài. Khi chưa có ảnh tải lên sẽ trả về chuỗi rỗng để render avatar chữ cái mặc định.
 */
export function buildUserAvatarUrl(_seed?: string): string {
  return '';
}

export function resolveUserAvatarUrl(
  avatarUrl?: unknown,
  _fallbackSeed?: string
): string {
  if (typeof avatarUrl === 'string') {
    const trimmed = avatarUrl.trim();
    if (trimmed && (trimmed.startsWith('http') || trimmed.startsWith('data:image') || trimmed.startsWith('/'))) {
      return trimmed;
    }
  }
  return '';
}
