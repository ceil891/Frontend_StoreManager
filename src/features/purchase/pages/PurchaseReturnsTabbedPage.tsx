import { PurchaseReturnsUnifiedPage } from './PurchaseReturnsUnifiedPage';
import { RoleGuard } from '@/routes/RoleGuard';

export function PurchaseReturnsTabbedPage() {
  return (
    <RoleGuard requiredPermission="purchase:return-list:view">
      <PurchaseReturnsUnifiedPage />
    </RoleGuard>
  );
}

export default PurchaseReturnsTabbedPage;

