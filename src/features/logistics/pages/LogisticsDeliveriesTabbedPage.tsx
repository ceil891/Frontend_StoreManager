import { RoleGuard } from '@/routes/RoleGuard';
import { ShipmentsPage } from './ShipmentsPage';

export function LogisticsDeliveriesTabbedPage() {
  return (
    <RoleGuard requiredPermission="logistics:shipment:view">
      <ShipmentsPage />
    </RoleGuard>
  );
}

export default LogisticsDeliveriesTabbedPage;

