import React from 'react';
import { FolderTree } from 'lucide-react';

export interface TreeNodeOption {
  id: string;
  name: string;
  parentId?: string | null;
  children?: TreeNodeOption[];
  level?: number;
}

interface TreeSelectProps {
  options: TreeNodeOption[];
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const TreeSelect: React.FC<TreeSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = '-- Chọn thành phần cha / cấp trên --',
  className = '',
  disabled = false,
}) => {
  // Helper to flatten nested tree options into hierarchical select items with prefix dashes
  const flattenTree = (
    nodes: TreeNodeOption[],
    level = 0,
    result: { id: string; name: string; level: number }[] = []
  ) => {
    nodes.forEach((node) => {
      result.push({ id: node.id, name: node.name, level });
      if (node.children && node.children.length > 0) {
        flattenTree(node.children, level + 1, result);
      }
    });
    return result;
  };

  const flatOptions = flattenTree(options);

  return (
    <div className="relative flex items-center w-full">
      <div className="absolute left-3 pointer-events-none">
        <FolderTree className="w-4 h-4 text-gray-400" />
      </div>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-60 ${className}`}
      >
        <option value="">{placeholder}</option>
        {flatOptions.map((opt) => {
          const indent = '— '.repeat(opt.level);
          return (
            <option key={opt.id} value={opt.id}>
              {indent} {opt.name}
            </option>
          );
        })}
      </select>
    </div>
  );
};

export default TreeSelect;
