import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, ChevronRight, LayoutGrid, List, Check, Lock } from 'lucide-react';
import { MODULE_GROUPS, getPermissionsByModule, useRoleStore, ACTION_VIETNAMESE_MAP, MODULE_VIETNAMESE_MAP } from '../store/roleStore';

interface RolePermissionMatrixProps {
  selectedPermissions: string[];
  onChange: (permissions: string[]) => void;
  searchTerm?: string;
  isReadOnly?: boolean;
  activeModule?: string;
}

type ViewMode = 'accordion' | 'matrix';

export function RolePermissionMatrix({
  selectedPermissions,
  onChange,
  searchTerm = '',
  isReadOnly = false,
  activeModule,
}: RolePermissionMatrixProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('accordion');
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>(
    MODULE_GROUPS.reduce((acc, g) => ({ ...acc, [g.key]: true }), {})
  );

  const systemPermissions = useRoleStore(state => state.systemPermissions);

  const permissionsByModule = useMemo(() => getPermissionsByModule(systemPermissions), [systemPermissions]);

  // Compute all unique actions for Matrix View
  const allActions = useMemo(() => {
    const actions = new Set<string>();
    systemPermissions.forEach(p => actions.add(p.action));
    return Array.from(actions).sort(); // Sort for consistent columns
  }, [systemPermissions]);

  const togglePermission = (key: string) => {
    if (isReadOnly) return;
    if (selectedPermissions.includes(key)) {
      onChange(selectedPermissions.filter((p) => p !== key));
    } else {
      onChange([...selectedPermissions, key]);
    }
  };

  const toggleModulePermissions = (module: string) => {
    if (isReadOnly) return;
    const modulePerms = permissionsByModule[module] || [];
    const moduleKeys = modulePerms.map(p => p.key);
    const allSelected = moduleKeys.every(k => selectedPermissions.includes(k));

    if (allSelected) {
      onChange(selectedPermissions.filter(p => !moduleKeys.includes(p)));
    } else {
      const newSelected = new Set([...selectedPermissions, ...moduleKeys]);
      onChange(Array.from(newSelected));
    }
  };

  const toggleModuleExpand = (module: string) => {
    setExpandedModules(prev => ({ ...prev, [module]: !prev[module] }));
  };

  const filteredModules = useMemo(() => {
    let modules = MODULE_GROUPS;
    if (activeModule) {
      const found = MODULE_GROUPS.filter(g => g.key === activeModule);
      if (found.length > 0) modules = found;
    }

    const lowerSearch = searchTerm.toLowerCase();
    if (!lowerSearch) return modules;

    return modules.filter(group => {
      const modulePerms = permissionsByModule[group.key] || [];
      return (
        group.label.toLowerCase().includes(lowerSearch) ||
        modulePerms.some(p => p.name.toLowerCase().includes(lowerSearch) || p.action.toLowerCase().includes(lowerSearch))
      );
    });
  }, [searchTerm, permissionsByModule, activeModule]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-primary" /> Chế độ hiển thị:
          </span>
          <div className="flex bg-white dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-600 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('accordion')}
              className={`p-1.5 rounded flex items-center justify-center transition-colors ${
                viewMode === 'accordion' ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
              title="Dạng danh sách (Accordion)"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              className={`p-1.5 rounded flex items-center justify-center transition-colors ${
                viewMode === 'matrix' ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
              title="Dạng ma trận (Matrix)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
        {!isReadOnly && (
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <button
              type="button"
              onClick={() => onChange(systemPermissions.map(p => p.key))}
              className="text-xs px-3 py-1.5 font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Chọn tất cả
            </button>
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-xs px-3 py-1.5 font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Bỏ chọn
            </button>
          </div>
        )}
      </div>

      {/* Accordion View */}
      {viewMode === 'accordion' && (
        <div className="space-y-3">
          {filteredModules.map(group => {
            const modulePerms = permissionsByModule[group.key] || [];
            if (modulePerms.length === 0) return null;
            
            const selectedInModule = modulePerms.filter(p => selectedPermissions.includes(p.key)).length;
            const isAllSelected = selectedInModule === modulePerms.length && modulePerms.length > 0;
            const isPartiallySelected = selectedInModule > 0 && !isAllSelected;
            const isExpanded = expandedModules[group.key];

            return (
              <div key={group.key} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                <div 
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors select-none"
                  onClick={() => toggleModuleExpand(group.key)}
                >
                  <div className="flex items-center gap-3">
                    <button type="button" className="text-gray-400">
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    <span className="text-base font-bold flex items-center gap-2">
                      <span className="w-6 text-center">{group.icon}</span> {group.label}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium">
                      {selectedInModule} / {modulePerms.length}
                    </span>
                  </div>
                  {!isReadOnly && (
                    <div 
                      className="flex items-center gap-2 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={(e) => { e.stopPropagation(); toggleModulePermissions(group.key); }}
                    >
                      <input 
                        type="checkbox" 
                        readOnly 
                        checked={isAllSelected} 
                        ref={input => { if (input) input.indeterminate = isPartiallySelected; }}
                        className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4 pointer-events-none"
                      />
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Tất cả</span>
                    </div>
                  )}
                </div>
                
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-gray-100 dark:border-gray-700 p-4 bg-gray-50/50 dark:bg-gray-900/30"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {modulePerms.map(perm => {
                          const isSelected = selectedPermissions.includes(perm.key);
                          const matchesSearch = searchTerm && (perm.name.toLowerCase().includes(searchTerm.toLowerCase()) || perm.action.toLowerCase().includes(searchTerm.toLowerCase()));
                          
                          return (
                            <div 
                              key={perm.key}
                              onClick={() => togglePermission(perm.key)}
                              className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer select-none transition-all ${
                                isSelected 
                                  ? 'bg-primary/5 dark:bg-primary/10 border-primary shadow-sm' 
                                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                              } ${matchesSearch ? 'ring-2 ring-emerald-400' : ''} ${isReadOnly ? 'opacity-80 cursor-default' : ''}`}
                            >
                              <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-gray-300 dark:border-gray-600'}`}>
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <div className="flex-1 min-w-0 leading-tight">
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{perm.name}</p>
                                <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400 block mt-0.5 truncate bg-gray-100 dark:bg-gray-800 px-1 rounded inline-block">
                                  {MODULE_VIETNAMESE_MAP[perm.module] || perm.module} • {ACTION_VIETNAMESE_MAP[perm.action] || perm.action}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* Matrix View */}
      {viewMode === 'matrix' && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 font-bold">Module</th>
                {allActions.map(action => (
                  <th key={action} className="px-3 py-3 font-semibold text-center whitespace-nowrap -rotate-45 sm:rotate-0 h-24 sm:h-auto align-bottom sm:align-middle origin-bottom-left sm:origin-center">
                    <div className="w-6 sm:w-auto">{ACTION_VIETNAMESE_MAP[action] || action}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredModules.map((group, index) => {
                const modulePerms = permissionsByModule[group.key] || [];
                if (modulePerms.length === 0) return null;
                return (
                  <tr key={group.key} className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/30'}`}>
                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-white whitespace-nowrap flex items-center gap-2">
                      <span>{group.icon}</span> {group.label}
                    </td>
                    {allActions.map(action => {
                      const perm = modulePerms.find(p => p.action === action);
                      if (!perm) return <td key={action} className="px-3 py-3 text-center bg-gray-100/50 dark:bg-gray-900/30 text-gray-300 dark:text-gray-700">-</td>;
                      
                      const isSelected = selectedPermissions.includes(perm.key);
                      return (
                        <td key={action} className="px-3 py-3 text-center" onClick={() => togglePermission(perm.key)}>
                          <div className={`w-5 h-5 mx-auto rounded border flex items-center justify-center cursor-pointer transition-colors ${
                            isSelected ? 'bg-primary border-primary text-white' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-transparent hover:border-gray-400'
                          } ${isReadOnly ? 'cursor-default' : ''}`}>
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
