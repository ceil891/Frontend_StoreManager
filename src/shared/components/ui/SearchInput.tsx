import React, { useRef, useImperativeHandle } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { toSentenceCase } from '@/shared/utils/textFormatter';

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  value: string;
  onValueChange?: (value: string) => void;
  onClear?: () => void;
  containerClassName?: string;
  placeholder?: string;
  autoSentenceCasePlaceholder?: boolean;
  size?: 'default' | 'sm' | 'lg';
}

export interface SearchInputRef {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  input: HTMLInputElement | null;
}

export const SearchInput = React.forwardRef<SearchInputRef, SearchInputProps>(
  (
    {
      value,
      onValueChange,
      onChange,
      onClear,
      containerClassName = 'w-full sm:max-w-xs',
      placeholder = 'Tìm kiếm...',
      autoSentenceCasePlaceholder = true,
      size = 'default',
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      clear: handleClear,
      input: inputRef.current,
    }));

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) onChange(e);
      if (onValueChange) onValueChange(e.target.value);
    };

    const handleClear = () => {
      if (onValueChange) onValueChange('');
      if (onClear) onClear();
      if (inputRef.current) {
        inputRef.current.value = '';
        inputRef.current.focus();
      }
    };

    const formattedPlaceholder = autoSentenceCasePlaceholder
      ? toSentenceCase(placeholder)
      : placeholder;

    const sizeInputStyles = {
      default: 'h-10 text-sm pl-10 pr-9',
      sm: 'h-8 text-xs pl-8 pr-7',
      lg: 'h-12 text-base pl-11 pr-10',
    }[size];

    const iconPlStyle = {
      default: 'pl-3',
      sm: 'pl-2.5',
      lg: 'pl-3.5',
    }[size];

    const iconSvgSize = {
      default: 'w-4 h-4',
      sm: 'w-3.5 h-3.5',
      lg: 'w-5 h-5',
    }[size];

    return (
      <div className={cn('relative flex items-center w-full', containerClassName)}>
        {/* Search Icon */}
        <div
          className={cn(
            'absolute inset-y-0 left-0 flex items-center pointer-events-none text-gray-400 dark:text-gray-500 transition-colors z-10',
            iconPlStyle
          )}
        >
          <Search className={cn('shrink-0', iconSvgSize)} />
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={formattedPlaceholder}
          disabled={disabled}
          className={cn(
            'w-full rounded-lg border border-[#D9D9D9] dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 font-normal transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm',
            'disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed',
            sizeInputStyles,
            className
          )}
          {...props}
        />

        {/* Clear Button */}
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            tabIndex={-1}
            title="Xóa tìm kiếm"
            aria-label="Xóa nội dung tìm kiếm"
            className="absolute right-2.5 p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer focus:outline-none"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';
export default SearchInput;
