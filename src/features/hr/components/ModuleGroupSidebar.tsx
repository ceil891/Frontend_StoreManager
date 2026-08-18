import { MODULE_GROUPS } from '../store/roleStore';

interface ModuleGroupSidebarProps {
  activeModule?: string;
  onSelectModule?: (moduleKey: string) => void;
}

export function ModuleGroupSidebar({ activeModule, onSelectModule }: ModuleGroupSidebarProps) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-3">
        Nhóm Phân Hệ
      </h3>
      <div className="space-y-1">
        {MODULE_GROUPS.map((group) => (
          <button
            key={group.key}
            type="button"
            onClick={() => onSelectModule && onSelectModule(group.key)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeModule === group.key
                ? 'bg-primary text-white shadow-md'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <span className="text-base">{group.icon}</span>
            {group.label}
          </button>
        ))}
      </div>
    </div>
  );
}
