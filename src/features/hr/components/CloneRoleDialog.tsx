import { useState } from 'react';
import { Copy, AlertCircle } from 'lucide-react';
import { Modal } from '@/shared/components/ui/Modal';
import { useRoleStore, type SecurityRoleRecord } from '../store/roleStore';
import { toast } from 'sonner';

interface CloneRoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sourceRole: SecurityRoleRecord | null;
}

export function CloneRoleDialog({ isOpen, onClose, sourceRole }: CloneRoleDialogProps) {
  const { cloneRole } = useRoleStore();
  const [newCode, setNewCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // When dialog opens/closes, reset form
  if (!isOpen && newCode !== '') {
    setNewCode('');
    setNewTitle('');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceRole) return;
    
    setIsLoading(true);
    try {
      await cloneRole(sourceRole.id, newCode, newTitle, `Sao chép từ vai trò: ${sourceRole.roleTitle}`);
      toast.success('Sao chép vai trò thành công');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi sao chép vai trò');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sao chép Vai trò (Clone Role)" width="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {sourceRole && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800 text-sm mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-800 dark:text-blue-300 font-semibold mb-1">Vai trò nguồn: {sourceRole.roleTitle}</p>
                <p className="text-blue-600 dark:text-blue-400 text-xs">Vai trò mới sẽ kế thừa {sourceRole.grantedPermissions.length} quyền thao tác từ vai trò này.</p>
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mã vai trò mới *</label>
          <input
            type="text"
            required
            value={newCode}
            onChange={(e) => setNewCode(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
            placeholder="VD: BRANCH_MANAGER_2"
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên nhãn vai trò mới *</label>
          <input
            type="text"
            required
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="VD: Quản lý chi nhánh phụ"
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isLoading || !newCode || !newTitle}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold shadow transition-colors disabled:opacity-50"
          >
            {isLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Copy className="w-4 h-4" />}
            Xác nhận sao chép
          </button>
        </div>
      </form>
    </Modal>
  );
}
