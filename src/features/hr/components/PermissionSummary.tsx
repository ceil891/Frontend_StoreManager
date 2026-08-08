import { Check, X } from 'lucide-react';
import { getPermissionsByModule, MODULE_GROUPS, useRoleStore } from '../store/roleStore';

interface PermissionSummaryProps {
  roleCode: string;
  roleTitle: string;
  grantedPermissions: string[];
}

export function PermissionSummary({ roleTitle, grantedPermissions }: PermissionSummaryProps) {
  const isSuperAdmin = grantedPermissions.includes('*');

  if (isSuperAdmin) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-4 rounded-xl border border-red-200 dark:border-red-800">
        <h4 className="font-bold text-base mb-1">{roleTitle}</h4>
        <p className="text-sm">✓ Quản trị toàn năng (Root Access) - Có toàn quyền trên tất cả module.</p>
      </div>
    );
  }

  const systemPermissions = useRoleStore(state => state.systemPermissions);
  const permissionsByModule = getPermissionsByModule(systemPermissions);

  return (
    <div className="space-y-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
      <h4 className="font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
        {roleTitle}
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        {MODULE_GROUPS.map(group => {
          const perms = permissionsByModule[group.key] || [];
          if (perms.length === 0) return null;

          const selectedCount = perms.filter(p => grantedPermissions.includes(p.key)).length;
          const isFull = selectedCount === perms.length;
          const isPartial = selectedCount > 0 && !isFull;
          
          if (selectedCount === 0) {
            return (
              <div key={group.key} className="flex items-start gap-2 text-gray-400 dark:text-gray-500">
                <X className="w-4 h-4 mt-0.5 text-gray-300 dark:text-gray-600" />
                <span className="text-sm line-through decoration-gray-300 dark:decoration-gray-700">{group.label}</span>
              </div>
            );
          }

          return (
            <div key={group.key} className="flex flex-col gap-1">
              <div className="flex items-start gap-2 text-gray-800 dark:text-gray-200 font-semibold">
                <Check className={`w-4 h-4 mt-0.5 ${isFull ? 'text-emerald-500' : 'text-amber-500'}`} />
                <span className="text-sm">
                  {group.label} <span className="text-xs text-gray-400 font-normal">({selectedCount}/{perms.length})</span>
                </span>
              </div>
              {isPartial && (
                <div className="pl-6 text-xs text-gray-500 dark:text-gray-400">
                  {perms.filter(p => grantedPermissions.includes(p.key)).map(p => p.action).join(', ')}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
