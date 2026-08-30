import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { DangerButton, SecondaryButton } from './Button';

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  itemName?: string;
  isLoading?: boolean;
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Xác nhận xóa',
  description = 'Bạn có chắc chắn muốn xóa mục này không? Hành động này không thể hoàn tác.',
  itemName,
  isLoading = false,
}: ConfirmDeleteModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      isDestructive={true}
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3.5 p-3.5 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-800/60">
          <div className="p-2 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
              {description}
            </p>
            {itemName && (
              <p className="text-xs font-mono font-bold text-red-700 dark:text-red-400 bg-red-100/70 dark:bg-red-900/40 px-2 py-0.5 rounded w-fit mt-1">
                {itemName}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-700">
          <SecondaryButton onClick={onClose} disabled={isLoading}>
            Hủy bỏ
          </SecondaryButton>
          <DangerButton
            onClick={onConfirm}
            isLoading={isLoading}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Xác nhận xóa
          </DangerButton>
        </div>
      </div>
    </Modal>
  );
}
