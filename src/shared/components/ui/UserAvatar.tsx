import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { resolveUserAvatarUrl } from '@/shared/utils/userAvatar';

interface UserAvatarProps {
  name?: string;
  avatarUrl?: unknown;
  src?: unknown;
  seed?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'w-7 h-7 text-[10px]',
  sm: 'w-9 h-9 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-24 h-24 text-2xl',
};

export function UserAvatar({
  name = 'U',
  avatarUrl,
  src: legacySrc,
  seed,
  size = 'md',
  className = '',
}: UserAvatarProps) {
  const [failed, setFailed] = useState(false);
  const rawUrl = avatarUrl || legacySrc;
  const validSrc = resolveUserAvatarUrl(rawUrl, seed ?? name);

  useEffect(() => {
    setFailed(false);
  }, [validSrc]);

  const dim = sizeClasses[size];
  const displayName = typeof name === 'string' && name.trim() ? name.trim() : 'U';
  const initial = displayName.charAt(0).toUpperCase() || 'U';

  if (!validSrc || failed) {
    return (
      <div
        className={`${dim} rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold shrink-0 shadow-sm ${className}`}
        title={displayName}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={validSrc}
      alt={displayName}
      title={displayName}
      onError={() => setFailed(true)}
      className={`${dim} rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-sm shrink-0 bg-slate-100 dark:bg-slate-800 ${className}`}
    />
  );
}

/** Fallback khi không có tên (icon generic). */
export function UserAvatarPlaceholder({
  size = 'md',
  className = '',
}: {
  size?: UserAvatarProps['size'];
  className?: string;
}) {
  const dim = sizeClasses[size];
  return (
    <div
      className={`${dim} rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 shrink-0 ${className}`}
    >
      <User className="w-1/2 h-1/2" />
    </div>
  );
}
