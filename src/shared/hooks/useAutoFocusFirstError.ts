import { useEffect } from 'react';
import type { FieldErrors } from 'react-hook-form';

/**
 * Hook tự động cuộn màn hình và focus vào ô input bị lỗi đầu tiên khi Submit Form thất bại.
 * Hỗ trợ các trường đơn, trường lồng nhau (nested objects) và mảng động (field arrays - items.0.sku).
 */
export function useAutoFocusFirstError(
  errors: FieldErrors,
  isSubmitting?: boolean,
  containerRef?: React.RefObject<HTMLElement | null>
) {
  useEffect(() => {
    // Chỉ thực thi khi có lỗi và không còn trong trạng thái đang submit
    if (errors && Object.keys(errors).length > 0 && !isSubmitting) {
      // Hàm đệ quy tìm key của trường lỗi đầu tiên
      const getFirstErrorField = (errorObj: Record<string, any>, prefix = ''): string | null => {
        for (const key of Object.keys(errorObj)) {
          const currentPath = prefix ? `${prefix}.${key}` : key;
          const val = errorObj[key];

          if (val && typeof val === 'object') {
            if ('message' in val || 'type' in val) {
              return currentPath;
            }
            const nested = getFirstErrorField(val, currentPath);
            if (nested) return nested;
          }
        }
        return null;
      };

      const firstErrorPath = getFirstErrorField(errors);
      if (!firstErrorPath) return;

      // Tìm kiếm phần tử DOM theo nhiều định dạng selector
      const root = containerRef?.current || document;
      
      // Các selector hỗ trợ: name="items.0.sku", id="items.0.sku", name="items[0].sku", aria-invalid="true"
      const selector = [
        `[name="${firstErrorPath}"]`,
        `#${firstErrorPath.replace(/\./g, '\\.')}`,
        `[name="${firstErrorPath.replace(/\.(\d+)\./g, '[$1].')}"]`,
        `[data-field-name="${firstErrorPath}"]`,
        '[aria-invalid="true"]',
      ].join(', ');

      const errorElement = root.querySelector<HTMLElement>(selector);

      if (errorElement) {
        // Cuộn mượt mà đưa ô lỗi vào trung tâm tầm nhìn
        errorElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        });

        // Focus con trỏ chuột vào ô lỗi
        setTimeout(() => {
          errorElement.focus({ preventScroll: true });
        }, 150);
      }
    }
  }, [errors, isSubmitting, containerRef]);
}
