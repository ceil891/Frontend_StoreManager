import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/shared/components/ui/Modal';
import { FormField } from '@/shared/components/ui/FormField';
import { customerFormSchema, type CustomerFormValues } from '@/shared/schemas/commonSchemas';
import { AddressCascadeSelect } from '@/shared/components/ui/AddressCascadeSelect';
import { CurrencyInput } from '@/shared/components/ui/CurrencyInput';
import { PrimaryButton, SecondaryButton } from '@/shared/components/ui/Button';
import { toast } from 'sonner';
import { UserPlus, Loader2 } from 'lucide-react';

import { useAutoFocusFirstError } from '@/shared/hooks/useAutoFocusFirstError';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess?: (values: CustomerFormValues) => void;
  defaultValues?: Partial<CustomerFormValues>;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  onClose,
  onSubmitSuccess,
  defaultValues,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      gender: 'OTHER',
      creditLimit: 0,
      ...defaultValues,
    },
  });

  // Tự động cuộn & focus vào trường bị lỗi đầu tiên khi validate thất bại
  useAutoFocusFirstError(errors, isSubmitting);

  const onFormSubmit = async (data: CustomerFormValues) => {
    try {
      setIsSubmitting(true);
      // Simulate API Call or call Real Store/Service
      await new Promise((resolve) => setTimeout(resolve, 800));

      toast.success(`Đã thêm thành công khách hàng: ${data.name}`);
      onSubmitSuccess?.(data);
      reset();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi lưu thông tin khách hàng');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="👤 Thêm Mới Khách Hàng (Validation Zod + HookForm)"
      width="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 text-xs" noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. Họ và Tên */}
          <FormField
            label="Họ và Tên Khách Hàng"
            required
            error={errors.name?.message}
            htmlFor="customer-name"
          >
            <input
              {...register('name')}
              type="text"
              placeholder="Ví dụ: Nguyễn Văn An"
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2"
            />
          </FormField>

          {/* 2. Số Điện Thoại */}
          <FormField
            label="Số Điện Thoại"
            required
            error={errors.phone?.message}
            helperText="10 chữ số (Đầu số: 03, 05, 07, 08, 09)"
            htmlFor="customer-phone"
          >
            <input
              {...register('phone')}
              type="tel"
              placeholder="Ví dụ: 0981234567"
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm font-mono focus:outline-none focus:ring-2"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 3. Email */}
          <FormField
            label="Địa Chỉ Email"
            error={errors.email?.message}
            htmlFor="customer-email"
          >
            <input
              {...register('email')}
              type="email"
              placeholder="nguyenvanan@gmail.com"
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2"
            />
          </FormField>

          {/* 4. Giới Tính */}
          <FormField label="Giới Tính" htmlFor="customer-gender">
            <select
              {...register('gender')}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2"
            >
              <option value="MALE">Nam</option>
              <option value="FEMALE">Nữ</option>
              <option value="OTHER">Khác</option>
            </select>
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 5. Ngày Sinh */}
          <FormField
            label="Ngày Sinh"
            error={errors.dateOfBirth?.message}
            helperText="Không được lớn hơn ngày hiện tại"
            htmlFor="customer-dob"
          >
            <input
              {...register('dateOfBirth')}
              type="date"
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2"
            />
          </FormField>

          {/* 6. Hạn Mức Nợ */}
          <FormField
            label="Hạn Mức Nợ Tối Đa"
            error={errors.creditLimit?.message}
            htmlFor="customer-credit-limit"
          >
            <Controller
              name="creditLimit"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  value={field.value ?? 0}
                  onChange={(val) => field.onChange(val)}
                  placeholder="0"
                />
              )}
            />
          </FormField>
        </div>

        {/* 7. Địa Chỉ 3 Cấp */}
        <FormField label="Địa Chỉ Thường Trú / Giao Hàng" htmlFor="customer-address">
          <Controller
            name="address"
            control={control}
            render={({ field }) => (
              <AddressCascadeSelect
                addressDetail={field.value || ''}
                onChange={({ province, district, ward, addressDetail }) => {
                  const full = [addressDetail, ward, district, province].filter(Boolean).join(', ');
                  field.onChange(full);
                }}
              />
            )}
          />
        </FormField>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <SecondaryButton type="button" onClick={onClose} disabled={isSubmitting}>
            Hủy Bỏ
          </SecondaryButton>
          <PrimaryButton
            type="submit"
            disabled={isSubmitting}
            leftIcon={
              isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )
            }
          >
            {isSubmitting ? 'Đang Lưu Khách Hàng...' : 'Lưu Thông Tin'}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
};
