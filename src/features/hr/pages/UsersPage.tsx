import { useMemo, useState, useEffect } from 'react';
import { Plus, Download, Search, Eye, Mail, Phone, MapPin, Building, Key, ShieldCheck, UserX, UserCheck, Trash2, X, Edit, Scan, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import { useUserStore, type SystemUserRecord } from '../store/userStore';
import { UserAvatar } from '@/shared/components/ui/UserAvatar';
import { buildUserAvatarUrl } from '@/shared/utils/userAvatar';
import { useRoleStore } from '../store/roleStore';
import { useHrStore } from '../store/hrStore';
import { useBranchStore } from '@/features/system/store/branchStore';
import type { ColumnDef } from '@tanstack/react-table';

const statusBadgeStyles = {
  ACTIVE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200',
  SUSPENDED: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 animate-pulse',
  ON_LEAVE: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200',
  TERMINATED: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-200',
};

type SearchField = 'all' | 'userCode' | 'fullName' | 'emailAddress' | 'assignedRole' | 'primaryDepartment' | 'branchLocation';

export function UsersPage() {
  const { users, fetchUsers, addUser, updateUser, updateUserRoleAndBranch, deleteUser } = useUserStore();
  const { roles, fetchRoles } = useRoleStore();
  const { branches, fetchBranches } = useBranchStore();
  const { departments, positions, fetchDepartments, fetchPositions } = useHrStore();

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchBranches();
    fetchDepartments();
    fetchPositions();
  }, [fetchUsers, fetchRoles, fetchBranches, fetchDepartments, fetchPositions]);

  const [search, setSearch] = useState('');
  const [searchField, setSearchField] = useState<SearchField>('all');
  const [selectedUser, setSelectedUser] = useState<SystemUserRecord | null>(null);
  const [deletingUser, setDeletingUser] = useState<SystemUserRecord | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [faceScanUser, setFaceScanUser] = useState<SystemUserRecord | null>(null);
  const [scanStep, setScanStep] = useState<number>(0);

  // Quick Role & Branch Change Modal State
  const [roleModalUser, setRoleModalUser] = useState<SystemUserRecord | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('4');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('1');
  const [isSavingRole, setIsSavingRole] = useState(false);

  const handleOpenRoleModal = (user: SystemUserRecord) => {
    setRoleModalUser(user);
    const matched = roles.find(r => 
      String(r.id) === user.assignedRole || 
      r.roleName === user.assignedRole || 
      r.roleCode === user.assignedRole || 
      r.roleTitle === user.assignedRole
    );
    setSelectedRoleId(matched ? String(matched.id) : (roles[0]?.id ? String(roles[0].id) : '4'));
    setSelectedBranchId(user.branchId ? String(user.branchId) : (branches[0]?.id ? String(branches[0].id) : '1'));
  };

  const handleSaveRoleAndBranch = async () => {
    if (!roleModalUser) return;
    setIsSavingRole(true);
    try {
      await updateUserRoleAndBranch(roleModalUser.id, selectedRoleId, selectedBranchId);
      const targetRole = roles.find(r => String(r.id) === String(selectedRoleId));
      const targetBranch = branches.find(b => String(b.id) === String(selectedBranchId));
      toast.success(`Đã cập nhật vai trò ${targetRole?.roleTitle || ''} & chi nhánh cho ${roleModalUser.fullName}!`);
      
      // Update selectedUser if open in drawer
      if (selectedUser && String(selectedUser.id) === String(roleModalUser.id)) {
        setSelectedUser(prev => prev ? {
          ...prev,
          assignedRole: targetRole?.roleCode || targetRole?.roleName || selectedRoleId,
          branchId: selectedBranchId,
          branchLocation: targetBranch?.name || `Chi nhánh ${selectedBranchId}`
        } : null);
      }
      setRoleModalUser(null);
    } catch (err: any) {
      toast.error('Lỗi khi cập nhật: ' + (err.message || 'Hệ thống bận'));
    } finally {
      setIsSavingRole(false);
    }
  };





  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Form states
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingMeta, setEditingMeta] = useState<{
    id: string;
    userCode: string;
    authUserId: string;
    lastLoginTimestamp: string;
  } | null>(null);

  const [formData, setFormData] = useState<Omit<SystemUserRecord, 'id' | 'userCode' | 'lastLoginTimestamp' | 'authUserId'>>({
    fullName: '',
    emailAddress: '',
    contactPhone: '',
    avatarUrl: buildUserAvatarUrl('new-user@retailhub.vn'),
    assignedRole: 'STAFF',
    departmentId: departments[0]?.id || '1',
    branchId: 'BR-001',
    branchLocation: 'CH Quận 1',
    positionId: positions[0]?.id || '1',
    managerId: '',
    timezone: 'Asia/Ho_Chi_Minh',
    locale: 'vi-VN',
    identityId: '',
    taxId: '',
    dateOfBirth: '',
    hireDate: new Date().toISOString().split('T')[0],
    employmentType: 'FULL_TIME',
    status: 'ACTIVE',
    mfaEnabled: false,
    notes: '',
  });

  const filtered = users.filter((item) => {
    // 1. Text search filter
    let matchesSearch = true;
    const q = search.toLowerCase();
    if (q) {
      switch (searchField) {
        case 'userCode':
          matchesSearch = item.userCode.toLowerCase().includes(q);
          break;
        case 'fullName':
          matchesSearch = item.fullName.toLowerCase().includes(q);
          break;
        case 'emailAddress':
          matchesSearch = item.emailAddress.toLowerCase().includes(q);
          break;
        case 'assignedRole':
          matchesSearch = item.assignedRole.toLowerCase().includes(q);
          break;
        case 'primaryDepartment':
          matchesSearch = item.departmentId.toLowerCase().includes(q) || (departments.find(d => d.id === item.departmentId)?.departmentName.toLowerCase().includes(q) ?? false);
          break;
        case 'branchLocation':
          matchesSearch = item.branchLocation.toLowerCase().includes(q);
          break;
        case 'all':
        default:
          matchesSearch = (
            item.userCode.toLowerCase().includes(q) ||
            item.fullName.toLowerCase().includes(q) ||
            item.emailAddress.toLowerCase().includes(q) ||
            item.assignedRole.toLowerCase().includes(q) ||
            (departments.find(d => d.id === item.departmentId)?.departmentName.toLowerCase().includes(q) ?? false) ||
            item.branchLocation.toLowerCase().includes(q)
          );
      }
    }

    // 2. Status filter
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    // 3. Role filter
    const matchesRole = roleFilter === 'all' || item.assignedRole === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  const searchPlaceholder = useMemo(() => {
    switch (searchField) {
      case 'userCode':
        return 'Tìm theo mã nhân viên (ví dụ: USR-9901)...';
      case 'fullName':
        return 'Tìm theo họ và tên đầy đủ...';
      case 'emailAddress':
        return 'Tìm theo địa chỉ email...';
      case 'assignedRole':
        return 'Tìm theo vai trò phân quyền...';
      case 'primaryDepartment':
        return 'Tìm theo bộ phận phòng ban...';
      case 'branchLocation':
        return 'Tìm theo tên chi nhánh/địa điểm làm việc...';
      case 'all':
      default:
        return 'Nhập từ khóa tìm kiếm theo mọi thuộc tính tài khoản...';
    }
  }, [searchField]);

  const handleExportCSV = () => {
    const headers = ['Mã nhân viên', 'Họ tên', 'Email', 'SĐT', 'Ảnh đại diện', 'Vai trò', 'Chức danh', 'Phòng ban', 'Mã CN', 'Chi nhánh', 'Ngày vào làm', 'Hình thức', 'Trạng thái', 'MFA', 'Ghi chú'];
    const rows = users.map(u => [
      u.userCode,
      u.fullName,
      u.emailAddress,
      u.contactPhone,
      u.avatarUrl,
      u.assignedRole,
      positions.find(p => p.id === u.positionId)?.positionTitle || u.positionId,
      departments.find(d => d.id === u.departmentId)?.departmentName || u.departmentId,
      u.branchId,
      u.branchLocation,
      u.hireDate,
      u.employmentType,
      u.status,
      u.mfaEnabled ? 'Đã kích hoạt' : 'Chưa kích hoạt',
      u.notes || ''
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Danh_Sach_Nhan_Vien_RetailHub_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenCreate = () => {
    setFormMode('create');
    setEditingMeta(null);
    setFormData({
      fullName: '',
      emailAddress: '',
      contactPhone: '',
      avatarUrl: buildUserAvatarUrl('new-user@retailhub.vn'),
      assignedRole: roles.length > 0 ? roles[0].roleCode : 'STAFF',
      departmentId: departments.length > 0 ? departments[0].id : '1',
      branchId: branches.length > 0 ? branches[0].id : '1',
      branchLocation: branches.length > 0 ? branches[0].name : 'Chi nhánh',
      positionId: positions.length > 0 ? positions[0].id : '1',
      managerId: '',
      timezone: 'Asia/Ho_Chi_Minh',
      locale: 'vi-VN',
      identityId: '',
      taxId: '',
      dateOfBirth: '',
      hireDate: new Date().toISOString().split('T')[0],
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
      mfaEnabled: false,
      notes: '',
    });
    setFormOpen(true);
  };

  const handleOpenEdit = (user: SystemUserRecord) => {
    setSelectedUser(null);
    setFormMode('edit');
    setEditingMeta({
      id: user.id,
      userCode: user.userCode,
      authUserId: user.authUserId,
      lastLoginTimestamp: user.lastLoginTimestamp,
    });
    setFormData({
      fullName: user.fullName,
      emailAddress: user.emailAddress,
      contactPhone: user.contactPhone,
      avatarUrl: user.avatarUrl,
      assignedRole: user.assignedRole,
      departmentId: user.departmentId,
      branchId: user.branchId,
      branchLocation: user.branchLocation,
      positionId: user.positionId,
      managerId: user.managerId || '',
      timezone: user.timezone || 'Asia/Ho_Chi_Minh',
      locale: user.locale || 'vi-VN',
      identityId: user.identityId || '',
      taxId: user.taxId || '',
      dateOfBirth: user.dateOfBirth || '',
      hireDate: user.hireDate,
      employmentType: user.employmentType,
      status: user.status,
      mfaEnabled: user.mfaEnabled,
      notes: user.notes || '',
    });
    setFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validate Họ & tên (no numbers or special characters)
    const nameTrimmed = formData.fullName.trim();
    if (!nameTrimmed) {
      toast.error('Họ & tên không được để trống!');
      return;
    }
    const nameRegex = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậnắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s]+$/u;
    if (!nameRegex.test(nameTrimmed)) {
      toast.error('Họ & tên không hợp lệ! Vui lòng không nhập chữ số hoặc ký tự đặc biệt.');
      return;
    }

    // 2. Validate SĐT (numeric digits, 9-11 length, no letters or special chars)
    const phoneTrimmed = formData.contactPhone.trim();
    if (!phoneTrimmed) {
      toast.error('Số điện thoại không được để trống!');
      return;
    }
    if (/[a-zA-Z]/.test(phoneTrimmed) || /[^0-9+\s\-]/.test(phoneTrimmed)) {
      toast.error('Số điện thoại không hợp lệ! Vui lòng chỉ nhập chữ số, không chứa chữ hoặc ký tự đặc biệt.');
      return;
    }
    const digitsOnly = phoneTrimmed.replace(/[^0-9]/g, '');
    if (digitsOnly.length < 9 || digitsOnly.length > 11) {
      toast.error('Số điện thoại không hợp lệ! Vui lòng nhập từ 9 đến 11 chữ số.');
      return;
    }

    // 3. Validate CCCD & Tax ID if provided
    if (formData.identityId && formData.identityId.trim()) {
      if (/[^0-9]/.test(formData.identityId.trim())) {
        toast.error('Thông tin lý lịch (CCCD/CMND) chỉ được chứa chữ số!');
        return;
      }
    }
    if (formData.taxId && formData.taxId.trim()) {
      if (/[^0-9\-]/.test(formData.taxId.trim())) {
        toast.error('Mã số thuế chỉ được chứa chữ số!');
        return;
      }
    }

    const avatarUrl = formData.avatarUrl?.trim() || buildUserAvatarUrl(formData.emailAddress || formData.fullName);
    const payload = { ...formData, fullName: nameTrimmed, contactPhone: phoneTrimmed, avatarUrl };

    try {
      if (formMode === 'create') {
        await addUser(payload);
        toast.success(`Đã cấp tài khoản nhân viên thành công cho ${nameTrimmed}!`);
      } else if (editingMeta) {
        await updateUser({
          ...payload,
          id: editingMeta.id,
          authUserId: editingMeta.authUserId,
          userCode: editingMeta.userCode,
          lastLoginTimestamp: editingMeta.lastLoginTimestamp,
        });
        toast.success(`Đã cập nhật thông tin nhân viên ${editingMeta.userCode} thành công!`);
      }
      setFormOpen(false);
      setEditingMeta(null);
    } catch (err: any) {
      toast.error('Lỗi khi lưu thông tin nhân viên: ' + (err.message || 'Hệ thống bận'));
    }
  };

  const handleDelete = (user: SystemUserRecord) => {
    if (user.emailAddress === 'admin@system.com') {
      setErrorNotice('Không thể xóa tài khoản Quản trị viên tối cao root!');
      return;
    }
    setDeletingUser(user);
  };

  const handleDeleteConfirm = () => {
    if (!deletingUser) return;
    deleteUser(deletingUser.id);
    setDeletingUser(null);
    setSelectedUser(null);
  };

  const toggleUserSuspension = async (user: SystemUserRecord) => {
    const nextStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const statusText = nextStatus === 'SUSPENDED' ? 'Đình chỉ' : 'Kích hoạt lại';
    try {
      await updateUser({
        ...user,
        status: nextStatus,
      });
      setSelectedUser(prev => prev ? { ...prev, status: nextStatus } : null);
      toast.success(`Đã ${statusText.toLowerCase()} tài khoản nhân viên ${user.userCode} - ${user.fullName}!`);
    } catch (err: any) {
      toast.error(`Lỗi khi ${statusText.toLowerCase()} tài khoản: ` + (err.message || 'Hệ thống bận'));
    }
  };

  const columns = useMemo<ColumnDef<SystemUserRecord>[]>(
    () => [
      {
        accessorKey: 'userCode',
        header: 'Mã nhân viên',
        cell: (info) => <span className="font-mono font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20 hover:underline">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'fullName',
        header: 'Nhân viên',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <UserAvatar
              name={row.original.fullName}
              avatarUrl={row.original.avatarUrl}
              seed={row.original.emailAddress}
              size="sm"
            />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{row.original.fullName}</p>
              <p className="text-xs text-gray-500">{positions.find(p => String(p.id) === String(row.original.positionId))?.positionTitle || row.original.positionId || '—'}</p>
              <p className="text-xs text-gray-400 font-mono">{row.original.emailAddress}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'assignedRole',
        header: 'Vai trò bảo mật',
        cell: (info) => {
          const code = info.getValue() as string;
          const match = roles.find(r => r.roleCode === code);
          return (
            <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 px-2 py-0.5 rounded font-bold border border-gray-200 dark:border-gray-700">
              {match ? match.roleTitle : code}
            </span>
          );
        },
      },
      {
        accessorKey: 'departmentId',
        header: 'Phòng ban & Chi nhánh',
        cell: ({ row }) => {
          const dept = departments.find(d => String(d.id) === String(row.original.departmentId));
          const branchObj = branches.find(b => String(b.id) === String(row.original.branchId) || b.branchCode === String(row.original.branchId));
          return (
            <div>
              <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{dept?.departmentName || row.original.departmentId || '—'}</p>
              <p className="text-xs text-gray-500 font-semibold">{branchObj?.name || row.original.branchLocation || '—'}</p>
            </div>
          );
        },
      },
      {
        accessorKey: 'employmentType',
        header: 'Hình thức',
        cell: (info) => {
          const type = info.getValue() as string;
          return (
            <span className="font-mono text-xs font-semibold text-gray-600 dark:text-gray-400">
              {type === 'FULL_TIME' ? 'TOÀN THỜI GIAN' :
               type === 'PART_TIME' ? 'BÁN THỜI GIAN' :
               type === 'CONTRACTOR' ? 'HỢP ĐỒNG BÊN NGOÀI' : 'THỜI VỤ'}
            </span>
          );
        },
      },
      {
        accessorKey: 'mfaEnabled',
        header: 'MFA 2FA',
        cell: (info) => (
          <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold border ${
            info.getValue() as boolean ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200'
          }`}>
            {info.getValue() as boolean ? 'ĐÃ KÍCH HOẠT' : 'CHƯA BẬT'}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as keyof typeof statusBadgeStyles;
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusBadgeStyles[status]}`}>
              {status === 'ACTIVE' ? 'ĐANG LÀM VIỆC' : status === 'SUSPENDED' ? 'TẠM NGHƯNG' : status === 'ON_LEAVE' ? 'NGHỈ PHÉP' : 'ĐÃ NGHỈ VIỆC'}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Hành động',
        cell: ({ row }) => (
          <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedUser(row.original)}
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              title="Xem hồ sơ"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenRoleModal(row.original)}
              className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors border border-emerald-200/60 dark:border-emerald-800/40"
              title="Phân gán vai trò bảo mật (Role)"
            >
              <ShieldCheck className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="Chỉnh sửa lý lịch"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(row.original)}
              disabled={row.original.emailAddress === 'admin@system.com'}
              className={`p-1.5 rounded-lg transition-colors ${
                row.original.emailAddress === 'admin@system.com' 
                  ? 'text-gray-200 dark:text-gray-800 cursor-not-allowed' 
                  : 'text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
              }`}
              title="Xóa nhân sự"
            >
              <Trash2 className="w-4 h-4" />
            </button>

          </div>
        ),
      },
    ],
    [roles, departments, positions, branches]
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Danh bạ Tài Khoản & Nhân sự doanh nghiệp</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quản lý cấp phát tài khoản, phân gán vai trò bảo mật RBAC chi tiết và theo dõi lịch sử hoạt động đăng nhập của nhân sự.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-none shrink-0">
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-sm font-semibold shadow-sm hover:shadow active:scale-95 whitespace-nowrap shrink-0"
            >
              <Download className="w-4 h-4" /> Xuất danh sách nhân sự
            </button>
            <button 
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-full transition-all text-sm font-bold shadow hover:shadow-lg active:scale-95 whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" /> Cấp tài khoản mới
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Vietnamese Attribute Dropdown */}
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-2 shrink-0">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Tìm kiếm theo:</span>
              <select
                value={searchField}
                onChange={(e) => setSearchField(e.target.value as SearchField)}
                className="text-xs font-bold text-gray-700 dark:text-gray-200 bg-transparent border-none py-1 focus:ring-0 focus:outline-none cursor-pointer"
              >
                <option value="all">Tất cả thông tin</option>
                <option value="userCode">Mã nhân viên</option>
                <option value="fullName">Họ và tên</option>
                <option value="emailAddress">Địa chỉ email</option>
                <option value="assignedRole">Vai trò bảo mật</option>
                <option value="primaryDepartment">Phòng ban</option>
                <option value="branchLocation">Chi nhánh</option>
              </select>
            </div>

            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all"
              />
            </div>
          </div>

          {/* Quick Filters Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium">Lọc Trạng thái:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary text-xs cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="ACTIVE">ĐANG LÀM VIỆC</option>
                <option value="SUSPENDED">TẠM NGHƯNG</option>
                <option value="ON_LEAVE">NGHỈ PHÉP</option>
                <option value="TERMINATED">ĐÃ NGHỈ VIỆC</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium">Lọc Vai trò:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary text-xs cursor-pointer"
              >
                <option value="all">Tất cả vai trò</option>
                {roles.map(r => (
                  <option key={r.id} value={r.roleCode}>{r.roleTitle}</option>
                ))}
              </select>
            </div>

            {(statusFilter !== 'all' || roleFilter !== 'all' || search) && (
              <button
                onClick={() => { setStatusFilter('all'); setRoleFilter('all'); setSearch(''); }}
                className="text-xs text-red-500 hover:text-red-600 font-semibold flex items-center gap-1 ml-auto transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedUser(row)} />
      </div>

      {/* Details View Modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={selectedUser ? `Thông tin tài khoản: ${selectedUser.userCode}` : 'Hồ sơ nhân sự'}
        width="max-w-lg"
      >
        {selectedUser && (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
              <UserAvatar
                name={selectedUser.fullName}
                avatarUrl={selectedUser.avatarUrl}
                seed={selectedUser.emailAddress}
                size="xl"
              />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{selectedUser.fullName}</h3>
              <p className="text-sm text-gray-500">{positions.find(p => String(p.id) === String(selectedUser.positionId))?.positionTitle || selectedUser.positionId || '—'}</p>
              <p className="text-xs font-mono text-gray-400">{selectedUser.userCode} · {selectedUser.authUserId}</p>
              {selectedUser.faceEnrolled ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mt-2 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Nhận diện khuôn mặt (Đã đăng ký)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mt-2 rounded-full text-xs font-bold bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Nhận diện khuôn mặt (Chưa thiết lập)
                </span>
              )}
            </div>

            <div className={`flex items-center justify-between p-4 rounded-xl border ${
              selectedUser.status === 'ACTIVE'
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                : selectedUser.status === 'ON_LEAVE'
                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                  selectedUser.status === 'ACTIVE' ? 'bg-emerald-600' : selectedUser.status === 'ON_LEAVE' ? 'bg-amber-600' : 'bg-red-600'
                }`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Vai trò phân quyền</p>
                  <p className="text-lg font-bold font-mono text-gray-900 dark:text-white mt-0.5">
                    {roles.find(r => r.roleCode === selectedUser.assignedRole || r.roleName === selectedUser.assignedRole || r.roleTitle === selectedUser.assignedRole || String(r.id) === selectedUser.assignedRole)?.roleTitle || roles.find(r => r.roleCode === selectedUser.assignedRole || r.roleName === selectedUser.assignedRole)?.roleName || selectedUser.assignedRole}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedUser.status === 'ACTIVE' ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100' :
                selectedUser.status === 'ON_LEAVE' ? 'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100' :
                'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100'
              }`}>
                {selectedUser.status === 'ACTIVE' ? 'ĐANG LÀM VIỆC' : selectedUser.status === 'ON_LEAVE' ? 'NGHỈ PHÉP' : selectedUser.status === 'SUSPENDED' ? 'BỊ ĐÌNH CHỈ' : 'ĐÃ NGHỈ VIỆC'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Mail className="w-4 h-4 text-primary" /> Email đăng ký
                </div>
                <p className="text-xs font-mono font-bold text-gray-900 dark:text-white truncate">{selectedUser.emailAddress}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Key className="w-4 h-4 text-emerald-500" /> Trạng thái xác thực 2FA/MFA
                </div>
                <p className={`text-xs font-bold truncate font-mono ${selectedUser.mfaEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {selectedUser.mfaEnabled ? 'ĐÃ BẬT XÁC THỰC' : 'TÀI KHOẢN CHƯA BẢO MẬT'}
                </p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-sm">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Hợp đồng & Ngày vào làm</span>
                <span className="inline-block text-xs bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-300 px-2 py-0.5 rounded font-mono font-bold">
                  {selectedUser.employmentType === 'FULL_TIME' ? 'Chính thức' : selectedUser.employmentType === 'PART_TIME' ? 'Bán thời gian' : selectedUser.employmentType === 'CONTRACTOR' ? 'Hợp đồng ngoài' : 'Thời vụ'}
                </span>
                <span className="ml-2 text-xs text-gray-500">Từ {selectedUser.hireDate}</span>
              </div>

              <div className="flex items-center gap-2 text-sm pt-1 text-gray-700 dark:text-gray-300">
                <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                <span>Số điện thoại: <span className="font-mono">{selectedUser.contactPhone}</span></span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <Building className="w-4 h-4 text-gray-400 shrink-0" />
                <span>Bộ phận phòng ban: <span className="font-semibold">{departments.find(d => String(d.id) === String(selectedUser.departmentId))?.departmentName || selectedUser.departmentId || '—'}</span></span>
              </div>
              <div className="flex items-center gap-2 text-sm pt-1 text-gray-700 dark:text-gray-300">
                <UserCheck className="w-4 h-4 text-gray-400 shrink-0" />
                <span>Quản lý trực tiếp: <span className="font-semibold">{selectedUser.managerId ? users.find(u => u.id === selectedUser.managerId)?.fullName : 'Không có'}</span></span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                <span>Chi nhánh: <span className="font-semibold">{branches.find(b => String(b.id) === String(selectedUser.branchId))?.name || selectedUser.branchLocation || '—'}</span> <span className="font-mono text-xs text-gray-400">({branches.find(b => String(b.id) === String(selectedUser.branchId))?.branchCode || `ID: ${selectedUser.branchId}`})</span></span>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700 text-xs font-mono">
                <span className="text-gray-500 dark:text-gray-400 font-sans">Thời gian đăng nhập gần nhất:</span>
                <span className="text-gray-800 dark:text-gray-200">{selectedUser.lastLoginTimestamp}</span>
              </div>

              {selectedUser.notes && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-800 mt-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Ghi chú quản lý nhân sự</span>
                  <p className="text-xs text-gray-700 dark:text-gray-300 italic bg-white dark:bg-gray-800 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 leading-relaxed">{selectedUser.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              {selectedUser.emailAddress !== 'admin@system.com' && (
                <button 
                  onClick={() => toggleUserSuspension(selectedUser)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-white font-semibold rounded-lg shadow transition-colors text-sm ${
                    selectedUser.status === 'ACTIVE' 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {selectedUser.status === 'ACTIVE' ? (
                    <>
                      <UserX className="w-4 h-4" /> Đình chỉ tài khoản
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" /> Kích hoạt lại tài khoản
                    </>
                  )}
                </button>
              )}
              <button 
                onClick={() => {
                  setFaceScanUser(selectedUser);
                  setScanStep(0);
                }}
                className={`px-4 py-2.5 font-semibold rounded-lg border transition-colors text-sm flex items-center gap-2 ${
                  selectedUser.faceEnrolled
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                    : 'bg-primary/5 text-primary border-primary/20 hover:bg-primary/10'
                }`}
              >
                <Scan className="w-4 h-4" /> {selectedUser.faceEnrolled ? 'Cập nhật khuôn mặt' : 'Quét khuôn mặt'}
              </button>
              <button 
                onClick={() => handleOpenEdit(selectedUser)}
                className="px-4 py-2.5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg border border-gray-300 dark:border-gray-700 transition-colors text-sm"
              >
                <ShieldCheck className="w-4 h-4 inline mr-1" /> Chỉnh sửa hồ sơ
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* CREATE / EDIT USER MODAL */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={formMode === 'create' ? '⚡ Cấp tài khoản đăng nhập mới' : '✏️ Chỉnh sửa thông tin tài khoản & nhân sự'}
        width="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-5">
          {/* Section 1: Thông tin đăng nhập & phân quyền cốt lõi (6-7 trường) */}
          <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-4">
            <h3 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-emerald-200 dark:border-emerald-800 pb-2">
              <Key className="w-4 h-4 text-emerald-600" /> 1. Thông tin tài khoản &amp; Truy cập hệ thống
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Họ và tên nhân viên *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={formData.fullName}
                  onChange={(e) => setFormData(p => ({ ...p, fullName: e.target.value }))}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Email đăng nhập *</label>
                <input
                  type="email"
                  required
                  disabled={formMode === 'edit' && formData.emailAddress === 'admin@system.com'}
                  placeholder="Ví dụ: a.nguyen@retailhub.vn"
                  value={formData.emailAddress}
                  onChange={(e) => {
                    const email = e.target.value;
                    setFormData((p) => ({
                      ...p,
                      emailAddress: email,
                      avatarUrl:
                        formMode === 'create' && (!p.avatarUrl || p.avatarUrl.includes('new-user'))
                          ? buildUserAvatarUrl(email || 'retailhub')
                          : p.avatarUrl,
                    }));
                  }}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 disabled:opacity-55 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Số điện thoại liên lạc *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 0912345678"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData(p => ({ ...p, contactPhone: e.target.value }))}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Chi nhánh làm việc *</label>
                <select
                  required
                  value={formData.branchId}
                  onChange={(e) => {
                    const branchId = e.target.value;
                    const label = branches.find((b) => String(b.id) === String(branchId))?.name ?? branchId;
                    setFormData((p) => ({ ...p, branchId, branchLocation: label }));
                  }}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name} ({b.branchCode || `CN-${b.id}`})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Bộ phận phòng ban *</label>
                <select
                  required
                  value={formData.departmentId}
                  onChange={(e) => setFormData((p) => ({ ...p, departmentId: e.target.value }))}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.departmentName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Vai trò gán quyền (Role) *</label>
                <select
                  value={formData.assignedRole}
                  disabled={formMode === 'edit' && formData.emailAddress === 'admin@system.com'}
                  onChange={(e) => setFormData(p => ({ ...p, assignedRole: e.target.value }))}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 font-bold"
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.roleCode}>{r.roleTitle} ({r.roleCode})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Chức danh công việc *</label>
                <select
                  required
                  value={formData.positionId}
                  onChange={(e) => setFormData((p) => ({ ...p, positionId: e.target.value }))}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {positions.map(pos => (
                    <option key={pos.id} value={pos.id}>{pos.positionTitle}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Trạng thái tài khoản</label>
                <select
                  value={formData.status}
                  disabled={formData.emailAddress === 'admin@system.com'}
                  onChange={(e) => setFormData(p => ({ ...p, status: e.target.value as any }))}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 font-semibold"
                >
                  <option value="ACTIVE">🟢 ĐANG LÀM VIỆC (ACTIVE)</option>
                  <option value="SUSPENDED">🔴 TẠM KHÓA (SUSPENDED)</option>
                  <option value="ON_LEAVE">🟡 NGHỈ PHÉP (ON_LEAVE)</option>
                  <option value="TERMINATED">⚪ ĐÃ NGHỈ VIỆC (TERMINATED)</option>
                </select>
              </div>
            </div>

            {/* Mật khẩu khởi tạo (Chỉ khi tạo mới) */}
            {formMode === 'create' && (
              <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="text-gray-500 font-medium">Mật khẩu khởi tạo:</span>
                  <span className="ml-2 font-semibold text-emerald-700 dark:text-emerald-400">
                    Sẽ được tạo tự động và gửi qua Email đăng ký của nhân viên
                  </span>
                </div>
                <span className="text-[11px] text-gray-400 italic">
                  ✓ Yêu cầu đổi mật khẩu ở lần đăng nhập đầu tiên
                </span>
              </div>
            )}
          </div>

          {/* Section 2: Thông tin nhân sự bổ sung (Tùy chọn mở rộng) */}
          <details className="group border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/60 dark:bg-gray-900/40 p-4 transition-all">
            <summary className="cursor-pointer text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center justify-between select-none">
              <span className="flex items-center gap-1.5">
                <Building className="w-4 h-4 text-gray-500" />
                📁 Mở rộng thông tin hồ sơ nhân sự (CCCD, Ngày sinh, HĐLĐ, Ghi chú...)
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold group-open:rotate-180 transition-transform">
                ▼
              </span>
            </summary>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Số CMND / CCCD</label>
                  <input
                    type="text"
                    placeholder="Số CMND/CCCD"
                    value={formData.identityId || ''}
                    onChange={(e) => setFormData((p) => ({ ...p, identityId: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mã số thuế</label>
                  <input
                    type="text"
                    placeholder="Mã số thuế"
                    value={formData.taxId || ''}
                    onChange={(e) => setFormData((p) => ({ ...p, taxId: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ngày sinh</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth || ''}
                    onChange={(e) => setFormData((p) => ({ ...p, dateOfBirth: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hình thức HĐLĐ</label>
                  <select
                    value={formData.employmentType}
                    onChange={(e) => setFormData(p => ({ ...p, employmentType: e.target.value as any }))}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs"
                  >
                    <option value="FULL_TIME">Chính thức (FULL TIME)</option>
                    <option value="PART_TIME">Bán thời gian (PART TIME)</option>
                    <option value="CONTRACTOR">Nhà thầu ngoài (CONTRACTOR)</option>
                    <option value="SEASONAL">Thử việc/Thời vụ (SEASONAL)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ngày vào làm</label>
                  <input
                    type="date"
                    value={formData.hireDate}
                    onChange={(e) => setFormData((p) => ({ ...p, hireDate: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Quản lý trực tiếp</label>
                  <select
                    value={formData.managerId || ''}
                    onChange={(e) => setFormData((p) => ({ ...p, managerId: e.target.value || undefined }))}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs"
                  >
                    <option value="">-- Không có --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.fullName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ghi chú thêm</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú hồ sơ nhân sự, thỏa thuận thử việc..."
                  value={formData.notes}
                  onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs"
                />
              </div>
            </div>
          </details>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-semibold transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-md transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {formMode === 'create' ? 'Cấp tài khoản ngay' : 'Lưu cập nhật'}
            </button>
          </div>
        </form>
      </Modal>


      <Modal
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        title="Xóa tài khoản nhân sự"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Bạn có chắc chắn muốn xóa tài khoản của <strong>{deletingUser?.fullName}</strong> ({deletingUser?.emailAddress}) khỏi danh bạ hệ thống?</p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={() => setDeletingUser(null)} className="px-4 py-2 border rounded-lg text-sm dark:border-gray-700">Hủy</button>
            <button type="button" onClick={handleDeleteConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold">Đồng ý xóa</button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!errorNotice}
        onClose={() => setErrorNotice(null)}
        title="Thông báo"
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">{errorNotice}</p>
          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={() => setErrorNotice(null)} className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold">Đóng</button>
          </div>
        </div>
      </Modal>

      {/* Modal: Quét & Đăng ký khuôn mặt */}
      <Modal
        isOpen={!!faceScanUser}
        onClose={() => setFaceScanUser(null)}
        title={faceScanUser?.faceEnrolled ? 'Cập nhật nhận diện khuôn mặt' : 'Đăng ký nhận diện khuôn mặt'}
        width="max-w-md"
      >
        {faceScanUser && (
          <div className="space-y-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Thiết lập dữ liệu sinh trắc học khuôn mặt cho nhân viên <strong>{faceScanUser.fullName}</strong>. Dữ liệu này dùng để xác thực điểm danh ca làm việc và ký duyệt quầy quỹ.
            </p>

            {scanStep === 0 && (
              <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-center gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary animate-pulse">
                  <Scan className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">Yêu cầu truy cập Camera</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-[280px]">
                    Hệ thống sẽ kết nối với camera thiết bị để bắt đầu quy trình quét nhận diện 3D.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setScanStep(1);
                    // Giả lập quét mặt trong 3.5 giây
                    setTimeout(() => {
                      setScanStep(2);
                      const updated = {
                        ...faceScanUser,
                        faceEnrolled: true,
                      };
                      updateUser(updated);
                      // Đồng bộ ngay trong drawer nếu được chọn
                      if (selectedUser?.id === faceScanUser.id) {
                        setSelectedUser(updated);
                      }
                      toast.success(`Đăng ký khuôn mặt cho ${faceScanUser.fullName} thành công!`);
                    }, 3500);
                  }}
                  className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
                >
                  Cho phép & Bắt đầu quét
                </button>
              </div>
            )}

            {scanStep === 1 && (
              <div className="relative aspect-square max-w-[260px] mx-auto rounded-full overflow-hidden bg-black border-4 border-primary shadow-lg flex items-center justify-center">
                {/* Giả lập webcam */}
                <div className="absolute inset-0 bg-cover bg-center filter grayscale contrast-125 opacity-70" style={{ backgroundImage: `url(${faceScanUser.avatarUrl})` }} />
                
                {/* Hiệu ứng quét nhận diện */}
                <div className="absolute inset-0 bg-gradient-to-b from-primary/0 via-primary/20 to-primary/0 animate-bounce" />
                <div className="absolute inset-4 rounded-full border-2 border-dashed border-primary/40 animate-spin" />
                
                {/* Khung ngắm diện tích mặt */}
                <div className="absolute w-44 h-44 rounded-full border border-primary/80 flex items-center justify-center">
                  <div className="w-4 h-4 border-t-2 border-l-2 border-primary absolute top-0 left-0" />
                  <div className="w-4 h-4 border-t-2 border-r-2 border-primary absolute top-0 right-0" />
                  <div className="w-4 h-4 border-b-2 border-l-2 border-primary absolute bottom-0 left-0" />
                  <div className="w-4 h-4 border-b-2 border-r-2 border-primary absolute bottom-0 right-0" />
                  
                  <span className="text-[10px] text-primary font-mono tracking-widest uppercase animate-pulse">Scanning...</span>
                </div>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 px-3 py-1 rounded-full text-[11px] text-white font-mono flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                  <span>REC: CAM_01</span>
                </div>
              </div>
            )}

            {scanStep === 2 && (
              <div className="flex flex-col items-center justify-center p-8 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center gap-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-800 dark:text-emerald-400">Đăng ký hoàn tất!</h4>
                  <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1 max-w-[280px]">
                    Dữ liệu sinh trắc học khuôn mặt của nhân viên đã được mã hóa và lưu vào hệ thống bảo mật.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFaceScanUser(null)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
                >
                  Xác nhận & Đóng
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>


      {/* Modal Đổi nhanh Vai trò Bảo mật & Chi nhánh (Quick Role & Branch Modal) */}
      <Modal
        isOpen={!!roleModalUser}
        onClose={() => setRoleModalUser(null)}
        title={roleModalUser ? `Phân gán vai trò & chi nhánh: ${roleModalUser.fullName}` : 'Vai trò & Chi nhánh'}
        width="max-w-md"
      >
        {roleModalUser && (
          <div className="space-y-4 text-sm">
            <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 flex items-center gap-3.5 shadow-xs">
              <UserAvatar name={roleModalUser.fullName} avatarUrl={roleModalUser.avatarUrl} seed={roleModalUser.emailAddress} size="md" />
              <div>
                <p className="font-bold text-gray-900 dark:text-white">{roleModalUser.fullName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{roleModalUser.emailAddress}</p>
                <span className="inline-block text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded mt-1 border border-emerald-200 dark:border-emerald-800">
                  Mã NV: {roleModalUser.userCode}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">
                1. Vai trò Bảo mật (Role) *
              </label>
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 shadow-xs"
              >
                {roles.length > 0 ? (
                  roles.map((r) => (
                    <option key={r.id} value={String(r.id)}>
                      {r.roleTitle || r.roleName} ({r.roleName || r.roleCode})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="1">Quản trị viên tối cao (SUPER_ADMIN)</option>
                    <option value="2">Quản lý cửa hàng (STORE_MANAGER)</option>
                    <option value="3">Thu ngân bán hàng (CASHIER)</option>
                    <option value="4">Nhân viên thông thường (STAFF)</option>
                  </>
                )}
              </select>

            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">
                2. Chi nhánh làm việc (Branch) *
              </label>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 shadow-xs"
              >
                {branches.length > 0 ? (
                  branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.branchCode || `CN-${b.id}`})
                    </option>
                  ))
                ) : (
                  <option value="">-- Chưa có chi nhánh (Vui lòng tạo chi nhánh) --</option>
                )}
              </select>
              <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                Chi nhánh quyết định phạm vi truy cập dữ liệu kho, hóa đơn bán hàng và báo cáo doanh thu của nhân viên.
              </p>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setRoleModalUser(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl text-xs font-bold transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isSavingRole}
                onClick={handleSaveRoleAndBranch}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-1.5"
              >
                {isSavingRole && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Xác nhận lưu
              </button>
            </div>
          </div>
        )}

      </Modal>
    </>
  );
}

