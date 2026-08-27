import React from 'react';
import { Loader2, Plus } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { formatSafeSentenceCase } from '@/shared/utils/textFormatter';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  autoSentenceCase?: boolean;
  fullWidth?: boolean;
  responsiveCollapse?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white shadow-sm hover:shadow focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 border border-transparent',
  secondary: 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/80 active:scale-[0.98] shadow-sm focus:ring-2 focus:ring-gray-400',
  outline: 'border border-gray-300 dark:border-gray-600 bg-transparent text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-[0.98] shadow-sm',
  danger: 'bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white shadow-sm hover:shadow focus:ring-2 focus:ring-red-500 focus:ring-offset-2 border border-transparent',
  ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 active:scale-[0.98]',
  success: 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white shadow-sm border border-transparent',
};

const sizeStyles: Record<ButtonSize, string> = {
  default: 'h-10 px-4 text-sm font-medium gap-2',
  sm: 'h-8 px-3 text-xs font-medium gap-1.5',
  lg: 'h-12 px-6 text-base font-semibold gap-2.5',
  icon: 'h-10 w-10 p-0 justify-center',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'default',
      isLoading = false,
      leftIcon,
      rightIcon,
      autoSentenceCase = true,
      fullWidth = false,
      responsiveCollapse = false,
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const formattedChildren = formatSafeSentenceCase(children, autoSentenceCase);

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium select-none transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none focus:outline-none',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0 flex items-center">{leftIcon}</span>
        )}

        {children && (
          <span
            className={cn(
              'truncate',
              responsiveCollapse && leftIcon && 'hidden sm:inline'
            )}
          >
            {formattedChildren}
          </span>
        )}

        {!isLoading && rightIcon && (
          <span className="shrink-0 flex items-center">{rightIcon}</span>
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';

/**
 * PrimaryButton: Nút hành động chính chuẩn hóa toàn hệ thống
 */
export const PrimaryButton = React.forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => (
  <Button ref={ref} variant="primary" {...props} />
));
PrimaryButton.displayName = 'PrimaryButton';

/**
 * CreateButton: Nút "+ Tạo mới / Thêm mới" tích hợp sẵn icon Plus
 */
export interface CreateButtonProps extends ButtonProps {
  icon?: React.ReactNode;
}

export const CreateButton = React.forwardRef<HTMLButtonElement, CreateButtonProps>(
  ({ icon = <Plus className="w-4 h-4" />, children = 'Tạo mới', ...props }, ref) => (
    <Button ref={ref} variant="primary" leftIcon={icon} {...props}>
      {children}
    </Button>
  )
);
CreateButton.displayName = 'CreateButton';

/**
 * SecondaryButton / OutlineButton: Nút hành động phụ, Hủy, Lọc, Xuất dữ liệu
 */
export const SecondaryButton = React.forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => (
  <Button ref={ref} variant="secondary" {...props} />
));
SecondaryButton.displayName = 'SecondaryButton';

export const OutlineButton = SecondaryButton;

/**
 * DangerButton: Nút Xóa, Hủy đơn, Từ chối
 */
export const DangerButton = React.forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => (
  <Button ref={ref} variant="danger" {...props} />
));
DangerButton.displayName = 'DangerButton';
