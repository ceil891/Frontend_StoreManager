import { useState, useRef, useEffect } from 'react';
import { Search, Check } from 'lucide-react';
import { useRoleStore, type PermissionItem } from '../store/roleStore';

interface PermissionSearchProps {
  selectedPermissions: string[];
  onTogglePermission: (key: string) => void;
}

export function PermissionSearch({ selectedPermissions, onTogglePermission }: PermissionSearchProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const systemPermissions = useRoleStore(state => state.systemPermissions);

  const filteredPermissions = systemPermissions.filter(p => {
    if (!search) return false;
    const lowerSearch = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(lowerSearch) ||
      p.action.toLowerCase().includes(lowerSearch) ||
      p.module.toLowerCase().includes(lowerSearch)
    );
  });

  const handleSelect = (perm: PermissionItem) => {
    onTogglePermission(perm.key);
    // Don't close or clear search immediately so user can select multiple
  };

  return (
    <div className="relative w-full max-w-sm" ref={containerRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (search) setIsOpen(true);
          }}
          placeholder="Tìm quyền: VD 'product'..."
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary shadow-sm"
        />
      </div>

      {isOpen && search && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto">
          {filteredPermissions.length === 0 ? (
            <div className="p-3 text-sm text-gray-500 text-center">Không tìm thấy quyền nào.</div>
          ) : (
            <div className="p-1 space-y-0.5">
              {filteredPermissions.map(perm => {
                const isSelected = selectedPermissions.includes(perm.key);
                return (
                  <button
                    key={perm.key}
                    type="button"
                    onClick={() => handleSelect(perm)}
                    className="w-full flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors text-left"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{perm.name}</p>
                      <p className="text-xs font-mono text-gray-500">{perm.module}.{perm.action}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
