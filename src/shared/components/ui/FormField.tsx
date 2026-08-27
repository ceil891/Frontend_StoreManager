import React from 'react';
import { AlertCircle, HelpCircle } from 'lucide-react';

export interface FormFieldProps {
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  tooltip?: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  error,
  helperText,
  tooltip,
  htmlFor,
  className = '',
  children,
}) => {
  return (
    <div className={`flex flex-col space-y-1.5 ${className}`}>
      {/* Label and Tooltip Header */}
      {label && (
        <div className="flex items-center justify-between">
          <label
            htmlFor={htmlFor}
            className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1 cursor-pointer select-none"
          >
            <span>{label}</span>
            {required && <span className="text-red-500 font-bold ml-0.5">*</span>}
          </label>

          {tooltip && (
            <div className="group relative flex items-center">
              <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-help" />
              <div className="absolute right-0 bottom-full mb-1 hidden group-hover:block z-50 w-48 p-2 text-[11px] bg-gray-900 text-white rounded-lg shadow-lg">
                {tooltip}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Control Input Element */}
      <div className="relative">
        {React.isValidElement(children)
          ? React.cloneElement(children as React.ReactElement<any>, {
              id: htmlFor || (children.props as any).id,
              'aria-invalid': !!error,
              className: [
                (children.props as any).className || '',
                error
                  ? 'border-red-500 bg-red-50/20 text-red-900 dark:text-red-100 placeholder:text-red-300 focus:border-red-500 focus:ring-red-500/20'
                  : 'border-gray-300 dark:border-gray-600 focus:border-emerald-500 focus:ring-emerald-500/20',
              ]
                .filter(Boolean)
                .join(' '),
            })
          : children}
      </div>

      {/* Inline Error Message */}
      {error ? (
        <div className="flex items-center gap-1 text-red-500 text-xs font-medium mt-0.5 animate-fadeIn">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="leading-tight">{error}</span>
        </div>
      ) : helperText ? (
        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">{helperText}</p>
      ) : null}
    </div>
  );
};
