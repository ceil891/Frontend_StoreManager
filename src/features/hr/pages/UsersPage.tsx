import { useMemo, useState, useEffect, useRef } from 'react';
import { Plus, Download, Search, Eye, Mail, Phone, MapPin, Building, Key, KeyRound, EyeOff, Copy, ShieldCheck, UserX, UserCheck, Trash2, X, Edit, Scan, Loader2, CheckCircle2 } from 'lucide-react';
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
import { SearchInput } from '@/shared/components/ui/SearchInput';
import { CreateButton, SecondaryButton, PrimaryButton, DangerButton } from '@/shared/components/ui/Button';

const statusBadgeStyles = {
  ACTIVE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200',
  SUSPENDED: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 animate-pulse',
  ON_LEAVE: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200',
  TERMINATED: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-200',
};

type SearchField = 'all' | 'userCode' | 'fullName' | 'emailAddress' | 'assignedRole' | 'primaryDepartment' | 'branchLocation';

export function UsersPage() {
  const { users, fetchUsers, addUser, updateUser, updateUserRoleAndBranch, deleteUser, resetPassword } = useUserStore();
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  // Quick Role & Branch Change Modal State
  const [roleModalUser, setRoleModalUser] = useState<SystemUserRecord | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('4');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('1');
  const [isSavingRole, setIsSavingRole] = useState(false);

  // Reset Password Modal State
  const [resetPasswordUser, setResetPasswordUser] = useState<SystemUserRecord | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('RetailHub@123');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSubmittingPasswordReset, setIsSubmittingPasswordReset] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pwd = 'RH@';
    for (let i = 0; i < 8; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPasswordInput(pwd);
  };

  const handleOpenResetPassword = (user: SystemUserRecord) => {
    setResetPasswordUser(user);
    setNewPasswordInput('RetailHub@123');
    setShowNewPassword(false);
    setCopiedPassword(false);
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUser) return;
    if (!newPasswordInput || newPasswordInput.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }

    try {
      setIsSubmittingPasswordReset(true);
      await resetPassword(resetPasswordUser.id, newPasswordInput);
      toast.success(`Đã cấp lại mật khẩu cho tài khoản ${resetPasswordUser.fullName} (${resetPasswordUser.userCode}) thành công!`);
      setResetPasswordUser(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi cấp lại mật khẩu');
    } finally {
      setIsSubmittingPasswordReset(false);
    }
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(newPasswordInput);
    setCopiedPassword(true);
    toast.success('Đã sao chép mật khẩu vào clipboard!');
    setTimeout(() => setCopiedPassword(false), 2000);
  };

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
    avatarUrl: '',
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
      avatarUrl: '',
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

    const avatarUrl = formData.avatarUrl?.trim() || '';
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
              onClick={() => {
                setFaceScanUser(row.original);
                setScanStep(0);
              }}
              className={`p-1.5 rounded-lg transition-colors border ${
                row.original.faceEnrolled
                  ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/40'
                  : 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 border-amber-200/60 dark:border-amber-800/40'
              }`}
              title={row.original.faceEnrolled ? 'Cập nhật khuôn mặt sinh trắc học' : 'Đăng ký quét khuôn mặt sinh trắc học'}
            >
              <Scan className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenResetPassword(row.original)}
              className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition-colors"
              title="Cấp lại mật khẩu đăng nhập"
            >
              <KeyRound className="w-4 h-4" />
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Danh bạ tài khoản & nhân sự doanh nghiệp</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quản lý cấp phát tài khoản, phân gán vai trò bảo mật RBAC chi tiết và theo dõi lịch sử hoạt động đăng nhập của nhân sự.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-none shrink-0">
            <SecondaryButton 
              onClick={handleExportCSV}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Xuất danh sách nhân sự
            </SecondaryButton>
            <CreateButton 
              onClick={handleOpenCreate}
            >
              Cấp tài khoản mới
            </CreateButton>
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

            <SearchInput
              value={search}
              onValueChange={setSearch}
              placeholder={searchPlaceholder}
              containerClassName="flex-1 w-full"
            />
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
        title={selectedUser ? `Hồ sơ tài khoản & Nhân sự: ${selectedUser.fullName} (${selectedUser.userCode})` : 'Hồ sơ nhân sự'}
        width="max-w-4xl"
      >
        {selectedUser && (
          <div className="space-y-6">
            {/* Top Profile Header Card */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5 p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/40 to-blue-50/30 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-gray-900 border border-emerald-200/80 dark:border-emerald-800/60 shadow-sm">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                <div className="relative shrink-0">
                  <UserAvatar
                    name={selectedUser.fullName}
                    avatarUrl={selectedUser.avatarUrl}
                    seed={selectedUser.emailAddress}
                    size="xl"
                  />
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${
                    selectedUser.status === 'ACTIVE' ? 'bg-emerald-500' : selectedUser.status === 'ON_LEAVE' ? 'bg-amber-500' : 'bg-red-500'
                  }`} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedUser.fullName}</h3>
                    <span className="px-2.5 py-0.5 rounded-md font-mono text-xs font-bold bg-white/80 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 shadow-xs">
                      {selectedUser.userCode}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mt-1">
                    {positions.find(p => String(p.id) === String(selectedUser.positionId))?.positionTitle || selectedUser.positionId || 'Nhân viên hệ thống'}
                  </p>
                  <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-0.5">
                    Mã tài khoản hệ thống: {selectedUser.authUserId || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Status Badges Group */}
              <div className="flex flex-col items-center sm:items-end gap-2 shrink-0">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  selectedUser.status === 'ACTIVE' ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100' :
                  selectedUser.status === 'ON_LEAVE' ? 'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100' :
                  'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    selectedUser.status === 'ACTIVE' ? 'bg-emerald-600 animate-pulse' :
                    selectedUser.status === 'ON_LEAVE' ? 'bg-amber-600' : 'bg-red-600'
                  }`} />
                  {selectedUser.status === 'ACTIVE' ? 'ĐANG LÀM VIỆC' : selectedUser.status === 'ON_LEAVE' ? 'NGHỈ PHÉP' : selectedUser.status === 'SUSPENDED' ? 'BỊ ĐÌNH CHỈ' : 'ĐÃ NGHỈ VIỆC'}
                </span>

                {selectedUser.faceEnrolled ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Nhận diện khuôn mặt (Đã đăng ký)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Nhận diện khuôn mặt (Chưa thiết lập)
                  </span>
                )}
              </div>
            </div>

            {/* Main Content Grid: 2 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left Column: Quyền hạn & Bảo mật tài khoản */}
              <div className="space-y-4">
                {/* Role Card */}
                <div className={`flex items-center justify-between p-4 rounded-xl border ${
                  selectedUser.status === 'ACTIVE'
                    ? 'bg-emerald-50/60 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                    : selectedUser.status === 'ON_LEAVE'
                    ? 'bg-amber-50/60 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                    : 'bg-red-50/60 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold shadow-sm ${
                      selectedUser.status === 'ACTIVE' ? 'bg-emerald-600' : selectedUser.status === 'ON_LEAVE' ? 'bg-amber-600' : 'bg-red-600'
                    }`}>
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Vai trò phân quyền</p>
                      <p className="text-base font-bold font-mono text-gray-900 dark:text-white mt-0.5">
                        {roles.find(r => r.roleCode === selectedUser.assignedRole || r.roleName === selectedUser.assignedRole || r.roleTitle === selectedUser.assignedRole || String(r.id) === selectedUser.assignedRole)?.roleTitle || roles.find(r => r.roleCode === selectedUser.assignedRole || r.roleName === selectedUser.assignedRole)?.roleName || selectedUser.assignedRole}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Account Details */}
                <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 pb-2">
                    Thông tin truy cập &amp; Bảo mật
                  </h4>
                  <div>
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      <Mail className="w-4 h-4 text-emerald-600" /> Email tài khoản
                    </div>
                    <p className="text-sm font-mono font-bold text-gray-900 dark:text-white break-all">{selectedUser.emailAddress}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      <Key className="w-4 h-4 text-emerald-600" /> Xác thực bảo mật hai lớp (2FA)
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold font-mono ${
                      selectedUser.mfaEnabled
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    }`}>
                      {selectedUser.mfaEnabled ? '✓ ĐÃ BẬT XÁC THỰC 2FA' : '⚠ CHƯA KÍCH HOẠT 2FA'}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Đăng nhập gần nhất:</span>
                    <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">{selectedUser.lastLoginTimestamp || 'Chưa ghi nhận'}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Mật khẩu đăng nhập:</span>
                    <button
                      type="button"
                      onClick={() => handleOpenResetPassword(selectedUser)}
                      className="text-amber-600 hover:text-amber-700 dark:text-amber-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" /> Cấp lại mật khẩu
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Công việc & Tổ chức */}
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-3 text-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 pb-2">
                    Hồ sơ công tác &amp; Phòng ban
                  </h4>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Loại hợp đồng:</span>
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-2.5 py-0.5 rounded font-mono font-bold border border-gray-200 dark:border-gray-700">
                      {selectedUser.employmentType === 'FULL_TIME' ? 'Chính thức' : selectedUser.employmentType === 'PART_TIME' ? 'Bán thời gian' : selectedUser.employmentType === 'CONTRACTOR' ? 'Hợp đồng ngoài' : 'Thời vụ'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Ngày vào làm:</span>
                    <span className="font-mono text-xs font-semibold text-gray-800 dark:text-gray-200">{selectedUser.hireDate || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400" /> Số điện thoại:</span>
                    <span className="font-mono text-xs font-semibold text-gray-900 dark:text-white">{selectedUser.contactPhone || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-gray-400" /> Bộ phận / Phòng:</span>
                    <span className="font-semibold text-xs text-gray-900 dark:text-white">{departments.find(d => String(d.id) === String(selectedUser.departmentId))?.departmentName || selectedUser.departmentId || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5 text-gray-400" /> Quản lý trực tiếp:</span>
                    <span className="font-semibold text-xs text-gray-900 dark:text-white">{selectedUser.managerId ? users.find(u => u.id === selectedUser.managerId)?.fullName : 'Không có'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-gray-400" /> Chi nhánh:</span>
                    <span className="font-semibold text-xs text-gray-900 dark:text-white text-right">
                      {branches.find(b => String(b.id) === String(selectedUser.branchId))?.name || selectedUser.branchLocation || '—'}
                    </span>
                  </div>
                </div>

                {selectedUser.notes && (
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-xs">
                    <span className="font-bold text-gray-500 uppercase tracking-wider block mb-1">Ghi chú quản lý nhân sự</span>
                    <p className="text-gray-700 dark:text-gray-300 italic leading-relaxed">{selectedUser.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex flex-wrap gap-3">
              {selectedUser.emailAddress !== 'admin@system.com' && (
                <button 
                  onClick={() => toggleUserSuspension(selectedUser)}
                  className={`flex-1 min-w-[180px] flex items-center justify-center gap-2 py-2.5 text-white font-semibold rounded-xl shadow-xs transition-colors text-sm ${
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
                className={`px-4 py-2.5 font-semibold rounded-xl border transition-colors text-sm flex items-center gap-2 ${
                  selectedUser.faceEnrolled
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                    : 'bg-primary/5 text-primary border-primary/20 hover:bg-primary/10'
                }`}
              >
                <Scan className="w-4 h-4" /> {selectedUser.faceEnrolled ? 'Cập nhật khuôn mặt' : 'Quét khuôn mặt'}
              </button>
              <button 
                onClick={() => handleOpenResetPassword(selectedUser)}
                className="px-4 py-2.5 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-semibold rounded-xl border border-amber-300 dark:border-amber-800 transition-colors text-sm flex items-center gap-2"
              >
                <KeyRound className="w-4 h-4" /> Cấp lại mật khẩu
              </button>
              <button 
                onClick={() => handleOpenEdit(selectedUser)}
                className="px-4 py-2.5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl border border-gray-300 dark:border-gray-700 transition-colors text-sm flex items-center gap-2"
              >
                <Edit className="w-4 h-4" /> Chỉnh sửa hồ sơ
              </button>
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-colors text-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* CREATE / EDIT USER MODAL */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={formMode === 'create' ? 'Cấp tài khoản đăng nhập mới' : 'Chỉnh sửa thông tin tài khoản & nhân sự'}
        width="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-5">
          {/* Section 1: Thông tin đăng nhập & phân quyền cốt lõi (6-7 trường) */}
          <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-4">
            <h3 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider border-b border-emerald-200 dark:border-emerald-800 pb-2">
              1. Thông tin tài khoản &amp; Truy cập hệ thống
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
                    const label = branchId === 'ALL' ? 'Tất cả chi nhánh' : (branches.find((b) => String(b.id) === String(branchId))?.name ?? branchId);
                    setFormData((p) => ({ ...p, branchId, branchLocation: label }));
                  }}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="ALL">Tất cả chi nhánh (Toàn hệ thống)</option>
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
                  onChange={(e) => {
                    const deptId = e.target.value;
                    const childPos = positions.filter(p => String(p.departmentId) === String(deptId));
                    setFormData((p) => ({
                      ...p,
                      departmentId: deptId,
                      positionId: childPos[0]?.id || (positions[0]?.id ?? p.positionId),
                    }));
                  }}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.departmentName} ({dept.departmentCode})</option>
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
                    <option key={r.id} value={r.roleCode}>
                      {r.roleTitle || r.roleName} ({r.roleCode || r.roleName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Chức danh công việc (Con của phòng ban) *</label>
                <select
                  required
                  value={formData.positionId}
                  onChange={(e) => setFormData((p) => ({ ...p, positionId: e.target.value }))}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {(() => {
                    const deptId = String(formData.departmentId);
                    const childPos = positions.filter(p => String(p.departmentId) === deptId);
                    const displayList = childPos.length > 0 ? childPos : positions;

                    return displayList.map(pos => (
                      <option key={pos.id} value={pos.id}>
                        {pos.positionTitle || pos.positionCode} {pos.departmentName ? `— (${pos.departmentName})` : ''}
                      </option>
                    ));
                  })()}
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
                  <option value="ACTIVE">Đang làm việc (ACTIVE)</option>
                  <option value="SUSPENDED">Tạm khóa (SUSPENDED)</option>
                  <option value="ON_LEAVE">Nghỉ phép (ON_LEAVE)</option>
                  <option value="TERMINATED">Đã nghỉ việc (TERMINATED)</option>
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
                Mở rộng thông tin hồ sơ nhân sự (CCCD, Ngày sinh, HĐLĐ, Ghi chú...)
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
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-md transition-colors"
            >
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
        onClose={() => {
          stopCameraStream();
          setFaceScanUser(null);
        }}
        title={faceScanUser?.faceEnrolled ? 'Cập nhật nhận diện khuôn mặt sinh trắc học' : 'Đăng ký nhận diện khuôn mặt sinh trắc học'}
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
                  onClick={async () => {
                    setScanStep(1);
                    try {
                      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                        const stream = await navigator.mediaDevices.getUserMedia({
                          video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 480 } }
                        });
                        streamRef.current = stream;
                        if (videoRef.current) {
                          videoRef.current.srcObject = stream;
                          videoRef.current.play().catch(() => {});
                        }
                      }
                    } catch (e) {
                      console.warn('Camera stream fallback:', e);
                    }

                    setTimeout(() => {
                      stopCameraStream();
                      setScanStep(2);
                      const updated = {
                        ...faceScanUser,
                        faceEnrolled: true,
                      };
                      updateUser(updated);
                      if (selectedUser?.id === faceScanUser.id) {
                        setSelectedUser(updated);
                      }
                      toast.success(`Đăng ký khuôn mặt cho ${faceScanUser.fullName} thành công!`);
                    }, 3500);
                  }}
                  className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2"
                >
                  <Scan className="w-4 h-4" /> Cho phép & Bắt đầu quét
                </button>
              </div>
            )}

            {scanStep === 1 && (
              <div className="relative aspect-square max-w-[260px] mx-auto rounded-full overflow-hidden bg-black border-4 border-primary shadow-xl flex items-center justify-center">
                {/* Live video feed */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div
                  className="absolute inset-0 bg-cover bg-center filter grayscale contrast-125 opacity-40 -z-10"
                  style={{ backgroundImage: `url(${faceScanUser.avatarUrl})` }}
                />
                
                {/* Hiệu ứng quét nhận diện */}
                <div className="absolute inset-0 bg-gradient-to-b from-primary/0 via-primary/20 to-primary/0 animate-bounce pointer-events-none" />
                <div className="absolute inset-3 rounded-full border-2 border-dashed border-primary/40 animate-spin pointer-events-none" />
                
                {/* Khung ngắm diện tích mặt 3D */}
                <div className="absolute w-44 h-44 rounded-full border border-primary/80 flex items-center justify-center pointer-events-none">
                  <div className="w-4 h-4 border-t-2 border-l-2 border-primary absolute top-0 left-0" />
                  <div className="w-4 h-4 border-t-2 border-r-2 border-primary absolute top-0 right-0" />
                  <div className="w-4 h-4 border-b-2 border-l-2 border-primary absolute bottom-0 left-0" />
                  <div className="w-4 h-4 border-b-2 border-r-2 border-primary absolute bottom-0 right-0" />
                  
                  <span className="text-[10px] text-primary font-mono tracking-widest uppercase bg-black/60 px-2 py-0.5 rounded border border-primary/40 animate-pulse">
                    Scanning 3D Face...
                  </span>
                </div>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 px-3 py-1 rounded-full text-[11px] text-white font-mono flex items-center gap-1.5 shadow-md">
                  <div className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                  <span>REC: BIOMETRIC_CAM</span>
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
                  onClick={() => {
                    stopCameraStream();
                    setFaceScanUser(null);
                  }}
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
                <option value="ALL">Tất cả chi nhánh (Toàn hệ thống)</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.branchCode || `CN-${b.id}`})
                  </option>
                ))}
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

      {/* RESET PASSWORD MODAL */}
      {resetPasswordUser && (
        <Modal
          isOpen={Boolean(resetPasswordUser)}
          onClose={() => setResetPasswordUser(null)}
          title={`Cấp lại mật khẩu: ${resetPasswordUser.fullName} (${resetPasswordUser.userCode})`}
          width="max-w-md"
        >
          <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-300">
              <p className="font-bold flex items-center gap-1.5 mb-1.5 text-sm">
                <KeyRound className="w-4 h-4 text-amber-600 shrink-0" /> Cấp lại mật khẩu đăng nhập
              </p>
              <p className="leading-relaxed">
                Mật khẩu mới sẽ được cập nhật cho tài khoản <strong>{resetPasswordUser.fullName}</strong> ({resetPasswordUser.emailAddress || resetPasswordUser.userCode}).
                Toàn bộ phiên làm việc cũ (Refresh Tokens) trên các thiết bị khác sẽ được tự động thu hồi ngay lập tức để bảo vệ tài khoản.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Mật khẩu mới *
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)..."
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl font-mono font-bold text-gray-900 dark:text-white pr-20"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className="p-1.5 text-gray-400 hover:text-emerald-600 rounded transition-colors"
                    title={copiedPassword ? 'Đã sao chép!' : 'Sao chép mật khẩu'}
                  >
                    {copiedPassword ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded transition-colors"
                    title={showNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[11px] text-gray-400 font-mono">Tối thiểu 6 ký tự</span>
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5" /> Tạo ngẫu nhiên
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setResetPasswordUser(null)}
                className="px-4 py-2.5 text-xs text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 rounded-xl font-semibold transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSubmittingPasswordReset}
                className="px-4 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md shadow-amber-600/20 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isSubmittingPasswordReset ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Đang cập nhật...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" /> Xác nhận cấp lại
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

