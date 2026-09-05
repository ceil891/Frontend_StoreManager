import React, { useRef, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/shared/components/ui/Modal';
import { FormField } from '@/shared/components/ui/FormField';
import { useAutoFocusFirstError } from '@/shared/hooks/useAutoFocusFirstError';
import {
  purchaseOrderFormSchema,
  type PurchaseOrderFormValues,
} from '@/shared/schemas/commonSchemas';
import { PrimaryButton, SecondaryButton } from '@/shared/components/ui/Button';
import { CurrencyInput } from '@/shared/components/ui/CurrencyInput';
import { toast } from 'sonner';
import { Plus, Trash2, ShoppingCart, Loader2, Package } from 'lucide-react';

interface PurchaseOrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess?: (values: PurchaseOrderFormValues) => void;
}

export const PurchaseOrderFormModal: React.FC<PurchaseOrderFormModalProps> = ({
  isOpen,
  onClose,
  onSubmitSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formContainerRef = useRef<HTMLFormElement | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(purchaseOrderFormSchema) as any,
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      poCode: `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      orderDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      destinationBranchId: '1',
      supplierId: '1',
      discountAmount: 0,
      shippingFee: 0,
      items: [
        {
          productId: '1',
          sku: 'SKU-COCA-330',
          productName: 'Nước ngọt Coca Cola 330ml',
          unit: 'Thùng',
          quantity: 10,
          unitPrice: 180000,
          taxRate: 0.08,
          subTotal: 1800000,
          notes: 'Hàng mới nguyên đai',
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  // Tự động cuộn và focus vào ô lỗi đầu tiên khi submit thất bại
  useAutoFocusFirstError(errors, isSubmitting, formContainerRef);

  const watchedItems = watch('items') || [];
  const totalItemsAmount = watchedItems.reduce((sum, item) => sum + (Number(item?.subTotal) || 0), 0);
  const watchedDiscount = watch('discountAmount') || 0;
  const watchedShipping = watch('shippingFee') || 0;
  const finalOrderTotal = Math.max(0, totalItemsAmount - watchedDiscount + watchedShipping);

  const handleUpdateItemTotal = (index: number, qty: number, price: number) => {
    const sub = (qty || 0) * (price || 0);
    setValue(`items.${index}.subTotal`, sub, { shouldValidate: true });
  };

  const onFormSubmit = async (data: PurchaseOrderFormValues) => {
    try {
      setIsSubmitting(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      toast.success(`Đã khởi tạo thành công Đơn mua hàng PO: ${data.poCode}`);
      onSubmitSuccess?.(data);
      reset();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tạo đơn mua hàng');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="📑 Tạo Đơn Đặt Hàng Nhập Kho (PO) - Dynamic Array Validation"
      width="max-w-4xl"
    >
      <form
        ref={formContainerRef}
        onSubmit={handleSubmit(onFormSubmit as any)}
        className="space-y-5 text-xs"
        noValidate
      >
        {/* SECTION 1: MASTER INFO */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField label="Mã Đơn Đặt Hàng (PO Code)" required error={errors.poCode?.message}>
            <input
              {...register('poCode')}
              type="text"
              className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-900 font-mono font-bold text-emerald-600 text-sm uppercase"
            />
          </FormField>

          <FormField label="Nhà Cung Cấp" required error={errors.supplierId?.message}>
            <select
              {...register('supplierId')}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm"
            >
              <option value="1">Công ty TNHH Coca-Cola Việt Nam</option>
              <option value="2">Công ty Cổ phần Sữa Vinamilk</option>
              <option value="3">Công ty TNHH Unilever Việt Nam</option>
            </select>
          </FormField>

          <FormField label="Kho / Chi Nhánh Nhận" required error={errors.destinationBranchId?.message}>
            <select
              {...register('destinationBranchId')}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm"
            >
              <option value="1">Kho Tổng Miền Bắc (Hà Nội)</option>
              <option value="2">Kho Trung Chuyển Miền Nam (TP.HCM)</option>
              <option value="3">Kho Chi Nhánh Cần Thơ</option>
            </select>
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Ngày Lập Đơn" required error={errors.orderDate?.message}>
            <input
              {...register('orderDate')}
              type="date"
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm"
            />
          </FormField>

          <FormField
            label="Ngày Dự Kiến Giao Hàng"
            required
            error={errors.expectedDeliveryDate?.message}
            helperText="Phải sau hoặc bằng ngày lập đơn"
          >
            <input
              {...register('expectedDeliveryDate')}
              type="date"
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm"
            />
          </FormField>
        </div>

        {/* SECTION 2: DYNAMIC FIELD ARRAY (PO LINES) */}
        <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-gray-200 dark:border-gray-800">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5 text-sm">
                <Package className="w-4 h-4 text-emerald-600" />
                Danh Sách Sản Phẩm Đặt Mua ({fields.length})
              </h4>
              {errors.items?.root && (
                <p className="text-red-500 text-xs font-semibold mt-1">
                  {errors.items.root.message}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                append({
                  productId: String(Date.now()),
                  sku: `SKU-NEW-${Math.floor(100 + Math.random() * 900)}`,
                  productName: '',
                  unit: 'Cái',
                  quantity: 1,
                  unitPrice: 100000,
                  taxRate: 0.08,
                  subTotal: 100000,
                  notes: '',
                })
              }
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm Mặt Hàng
            </button>
          </div>

          <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-950">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 uppercase text-[10px]">
                <tr>
                  <th className="p-2.5 w-8 text-center">#</th>
                  <th className="p-2.5 w-36">Mã SKU *</th>
                  <th className="p-2.5">Tên Sản Phẩm *</th>
                  <th className="p-2.5 w-24 text-center">ĐVT *</th>
                  <th className="p-2.5 w-24 text-center">Số Lượng *</th>
                  <th className="p-2.5 w-36 text-right">Đơn Giá Mua *</th>
                  <th className="p-2.5 w-36 text-right">Thành Tiền</th>
                  <th className="p-2.5 w-10 text-center">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-gray-800">
                {fields.map((field, idx) => {
                  const lineError = errors.items?.[idx];
                  return (
                    <tr key={field.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/50">
                      <td className="p-2.5 text-center font-bold text-gray-400">{idx + 1}</td>

                      {/* SKU */}
                      <td className="p-2.5">
                        <input
                          {...register(`items.${idx}.sku`)}
                          type="text"
                          placeholder="SKU-001"
                          className={`w-full p-1.5 border rounded uppercase font-mono text-xs ${
                            lineError?.sku ? 'border-red-500 bg-red-50/20' : 'border-gray-300'
                          }`}
                        />
                        {lineError?.sku && (
                          <p className="text-[10px] text-red-500 mt-0.5">{lineError.sku.message}</p>
                        )}
                      </td>

                      {/* Product Name */}
                      <td className="p-2.5">
                        <input
                          {...register(`items.${idx}.productName`)}
                          type="text"
                          placeholder="Nhập tên sản phẩm..."
                          className={`w-full p-1.5 border rounded text-xs ${
                            lineError?.productName ? 'border-red-500 bg-red-50/20' : 'border-gray-300'
                          }`}
                        />
                        {lineError?.productName && (
                          <p className="text-[10px] text-red-500 mt-0.5">{lineError.productName.message}</p>
                        )}
                      </td>

                      {/* Unit */}
                      <td className="p-2.5">
                        <select
                          {...register(`items.${idx}.unit`)}
                          className="w-full p-1.5 border rounded bg-white dark:bg-gray-900 text-xs text-center"
                        >
                          <option value="Cái">Cái</option>
                          <option value="Thùng">Thùng</option>
                          <option value="Hộp">Hộp</option>
                          <option value="Chai">Chai</option>
                          <option value="Kg">Kg</option>
                        </select>
                      </td>

                      {/* Quantity */}
                      <td className="p-2.5">
                        <input
                          {...register(`items.${idx}.quantity`, {
                            valueAsNumber: true,
                            onChange: (e) =>
                              handleUpdateItemTotal(
                                idx,
                                parseInt(e.target.value) || 0,
                                watchedItems[idx]?.unitPrice || 0
                              ),
                          })}
                          type="number"
                          min={1}
                          className={`w-full p-1.5 border rounded text-center font-bold text-xs ${
                            lineError?.quantity ? 'border-red-500 bg-red-50/20' : 'border-gray-300'
                          }`}
                        />
                      </td>

                      {/* Unit Price */}
                      <td className="p-2.5">
                        <Controller
                          name={`items.${idx}.unitPrice`}
                          control={control}
                          render={({ field: pField }) => (
                            <CurrencyInput
                              value={pField.value ?? 0}
                              onChange={(val) => {
                                pField.onChange(val);
                                handleUpdateItemTotal(idx, watchedItems[idx]?.quantity || 0, val);
                              }}
                              placeholder="0"
                            />
                          )}
                        />
                      </td>

                      {/* Subtotal */}
                      <td className="p-2.5 text-right font-mono font-bold text-emerald-600">
                        {((watchedItems[idx]?.quantity || 0) * (watchedItems[idx]?.unitPrice || 0)).toLocaleString('vi-VN')} ₫
                      </td>

                      {/* Remove Button */}
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          disabled={fields.length <= 1}
                          onClick={() => remove(idx)}
                          className="text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 3: TOTALS & SUMMARY */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-900/40 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
          <div>
            <FormField label="Ghi Chú Đơn Mua Hàng">
              <textarea
                {...register('notes')}
                rows={2}
                placeholder="Ghi chú thêm về điều khoản giao hàng hoặc bảo hành..."
                className="w-full p-2 border rounded-lg bg-white dark:bg-gray-900 text-xs"
              />
            </FormField>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Tổng tiền hàng ({watchedItems.length} dòng):</span>
              <span className="font-bold font-mono">{totalItemsAmount.toLocaleString('vi-VN')} ₫</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Chiết khấu nhà cung cấp:</span>
              <span className="font-mono text-amber-600">-{watchedDiscount.toLocaleString('vi-VN')} ₫</span>
            </div>
            <div className="flex justify-between items-center text-sm font-extrabold text-emerald-600 border-t pt-2">
              <span>Tổng Tiền Thanh Toán:</span>
              <span className="font-mono text-base">{finalOrderTotal.toLocaleString('vi-VN')} ₫</span>
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
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
                <ShoppingCart className="w-4 h-4" />
              )
            }
          >
            {isSubmitting ? 'Đang Khởi Tạo Đơn PO...' : 'Tạo Đơn Hàng Nhập Kho'}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
};
