import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { resolveUserAvatarUrl } from '@/shared/utils/userAvatar';

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  src?: string | null;
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

export function UserAvatar({ name, avatarUrl, src: legacySrc, seed, size = 'md', className = '' }: UserAvatarProps) {
  const [failed, setFailed] = useState(false);
  const actualUrl = avatarUrl || legacySrc;

  useEffect(() => {
    setFailed(false);
  }, [actualUrl]);

  const resolvedSrc = resolveUserAvatarUrl(failed ? null : actualUrl, seed ?? name);
  const dim = sizeClasses[size];

  if (failed) {
    return (
      <div
        className={`${dim} rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold shrink-0 ${className}`}
        title={name}
      >
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={name}
      title={name}
      onError={() => setFailed(true)}
      className={`${dim} rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-sm shrink-0 bg-gray-100 dark:bg-gray-800 ${className}`}
    />
  );
}

/** Fallback khi không có tên (icon generic). */
export function UserAvatarPlaceholder({ size = 'md', className = '' }: { size?: UserAvatarProps['size']; className?: string }) {
  const dim = sizeClasses[size];
  return (
    <div className={`${dim} rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 shrink-0 ${className}`}>
      <User className="w-1/2 h-1/2" />
    </div>
  );
}
