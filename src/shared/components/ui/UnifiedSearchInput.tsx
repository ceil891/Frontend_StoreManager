import React, { useRef } from 'react';
import { Search, X } from 'lucide-react';

export interface UnifiedSearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onValueChange?: (value: string) => void;
  onClear?: () => void;
  containerClassName?: string;
  placeholder?: string;
}

export function UnifiedSearchInput({
  value,
  onValueChange,
  onChange,
  onClear,
  containerClassName = 'w-full sm:max-w-xs',
  placeholder = 'Tìm kiếm dữ liệu...',
  className = '',
  ...props
}: UnifiedSearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) onChange(e);
    if (onValueChange) onValueChange(e.target.value);
  };

  const handleClear = () => {
    if (onValueChange) onValueChange('');
    if (onClear) onClear();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className={`relative ${containerClassName}`}>
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
        <Search className="w-4 h-4" />
      </div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full pl-10 pr-9 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm transition-all duration-150 ${className}`}
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          title="Xóa tìm kiếm"
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <X className="w-4 h-4 p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800" />
        </button>
      )}
    </div>
  );
}
