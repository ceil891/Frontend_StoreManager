import { useState, useMemo } from 'react';
import { Search, UserPlus, Users, Check } from 'lucide-react';
import { Modal } from '@/shared/components/ui/Modal';
import type { SecurityRoleRecord } from '../store/roleStore';
import { useUserStore } from '../store/userStore';
import { UserAvatar } from '@/shared/components/ui/UserAvatar';
import { toast } from 'sonner';

interface RoleUserAssignmentProps {
  isOpen: boolean;
  onClose: () => void;
  role: SecurityRoleRecord | null;
}

export function RoleUserAssignment({ isOpen, onClose, role }: RoleUserAssignmentProps) {
  const { users, updateUser } = useUserStore();
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Initialize selected users based on who currently has this role
  // We use useState with lazy initialization so it runs when dialog opens
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  
  // Update local state when role changes or modal opens
  useMemo(() => {
    if (isOpen && role) {
      const assigned = users.filter(u => u.assignedRole === role.roleCode).map(u => u.id);
      setSelectedUserIds(new Set(assigned));
      setSearch('');
    }
  }, [isOpen, role, users]);

  const filteredUsers = useMemo(() => {
    if (!search) return users;
    const lowerSearch = search.toLowerCase();
    return users.filter(u => 
      u.fullName.toLowerCase().includes(lowerSearch) || 
      u.emailAddress.toLowerCase().includes(lowerSearch) ||
      u.userCode.toLowerCase().includes(lowerSearch)
    );
  }, [users, search]);

  const toggleUser = (userId: string) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUserIds(newSelected);
  };

  const handleSave = async () => {
    if (!role) return;
    setIsLoading(true);
    try {
      // In a real app, this would be a single API call to assign users to role.
      // Here we simulate by updating each changed user individually via userStore.
      
      const initiallyAssigned = users.filter(u => u.assignedRole === role.roleCode).map(u => u.id);
      
      // Users to add
      const toAdd = Array.from(selectedUserIds).filter(id => !initiallyAssigned.includes(id));
      // Users to remove
      const toRemove = initiallyAssigned.filter(id => !selectedUserIds.has(id));

      const updatePromises = [];

      for (const id of toAdd) {
        const user = users.find(u => u.id === id);
        if (user) {
          updatePromises.push(updateUser({ ...user, assignedRole: role.roleCode }));
        }
      }

      for (const id of toRemove) {
        const user = users.find(u => u.id === id);
        if (user) {
          // Revert to a default role or remove role. Assuming 'STAFF' for now.
          updatePromises.push(updateUser({ ...user, assignedRole: 'STAFF' }));
        }
      }

      await Promise.all(updatePromises);
      toast.success(`Đã cập nhật tài khoản cho vai trò ${role.roleTitle}`);
      onClose();
    } catch (error) {
      toast.error('Lỗi khi cập nhật danh sách tài khoản');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gán Tài Khoản Vào Vai Trò" width="max-w-2xl">
      <div className="space-y-4">
        {role && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-800 flex items-center justify-between">
            <div>
              <p className="text-emerald-800 dark:text-emerald-300 font-bold">{role.roleTitle}</p>
              <p className="text-emerald-600 dark:text-emerald-400 text-xs">Mã vai trò: {role.roleCode}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 px-3 py-1 rounded shadow-sm text-sm font-bold text-gray-700 dark:text-gray-300">
              Đã chọn: <span className="text-primary">{selectedUserIds.size}</span>
            </div>
          </div>
        )}

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm tài khoản nhân viên (tên, email, mã)..."
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-900">
          <div className="max-h-[350px] overflow-y-auto p-2 space-y-1 scrollbar-thin">
            {filteredUsers.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <Users className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p>Không tìm thấy tài khoản nào phù hợp</p>
              </div>
            ) : (
              filteredUsers.map(user => {
                const isSelected = selectedUserIds.has(user.id);
                return (
                  <div
                    key={user.id}
                    onClick={() => toggleUser(user.id)}
                    className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-primary/5 hover:bg-primary/10 border border-primary/20' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar userFullName={user.fullName} avatarUrl={user.avatarUrl} size="sm" />
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{user.fullName}</p>
                        <p className="text-xs text-gray-500">{user.emailAddress} • {user.branchLocation}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {user.assignedRole !== role?.roleCode && user.assignedRole !== 'STAFF' && !isSelected && (
                        <span className="text-[10px] font-mono bg-gray-100 dark:bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded">
                          Đang có: {user.assignedRole}
                        </span>
                      )}
                      <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                        isSelected ? 'bg-primary border-primary text-white' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
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
            type="button"
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold shadow transition-colors disabled:opacity-50"
          >
            {isLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Lưu phân quyền
          </button>
        </div>
      </div>
    </Modal>
  );
}
