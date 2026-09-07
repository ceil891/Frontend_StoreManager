import { RoleGuard } from '@/routes/RoleGuard';
import { SuppliersPage } from './SuppliersPage';

export function PurchaseSuppliersTabbedPage() {
  return (
    <RoleGuard requiredPermission="purchase:supplier:view">
      <SuppliersPage />
    </RoleGuard>
  );
}

export default PurchaseSuppliersTabbedPage;

