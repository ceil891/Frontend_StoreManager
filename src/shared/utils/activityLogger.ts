import { useAuthStore } from '@/features/auth/store/authStore';
import { useBranchStore } from '@/features/system/store/branchStore';
import {
  useActivityLogStore,
  type ActivityActionType,
  type ActivityLogRecord,
} from '@/features/hr/store/activityLogStore';

export type RecordActivityInput = {
  actionType: ActivityActionType;
  moduleName: string;
  pageName: string;
  entityType: string;
  entityId: string;
  entityLabel: string;
  description: string;
  status?: ActivityLogRecord['status'];
  changedFields?: string[];
  userCode?: string;
};

/** Ghi nhật ký thao tác CRUD — lấy tên người & tài khoản từ phiên đăng nhập hiện tại. */
export function recordActivity(input: RecordActivityInput) {
  const user = useAuthStore.getState().user;
  const branchId = user?.branchId ?? undefined;
  const branches = useBranchStore.getState().branches;
  const branchName = branchId
    ? (branches.find((b) => b.id === branchId)?.name || `Chi nhánh ${branchId}`)
    : user
      ? 'Toàn hệ thống'
      : undefined;

  useActivityLogStore.getState().addLog({
    userName: user?.name ?? 'Hệ thống',
    userEmail: user?.email ?? 'system@retailhub.vn',
    userCode: input.userCode,
    role: user?.role ?? 'SYSTEM',
    actionType: input.actionType,
    moduleName: input.moduleName,
    pageName: input.pageName,
    entityType: input.entityType,
    entityId: input.entityId,
    entityLabel: input.entityLabel,
    description: input.description,
    branchId: branchId ?? undefined,
    branchName,
    ipAddress: '127.0.0.1',
    status: input.status ?? 'SUCCESS',
    changedFields: input.changedFields,
  });
}
