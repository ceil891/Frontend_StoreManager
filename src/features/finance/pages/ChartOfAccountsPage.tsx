// ChartOfAccountsPage.tsx – Trang hệ thống tài khoản kế toán
import React from "react";
import { ReusableDataTable } from "@/shared/components/data-table/ReusableDataTable";
import { Drawer } from "@/shared/components/ui/Drawer";
import { Modal } from "@/shared/components/ui/Modal";
import { ColumnsIcon } from "lucide-react";

const columns = [
  { accessorKey: "account_number", header: "Số hiệu tài khoản" },
  { accessorKey: "account_name", header: "Tên tài khoản" },
  { accessorKey: "account_type", header: "Tính chất tài khoản" },
  { accessorKey: "parent_account", header: "Tài khoản mẹ" },
  { accessorKey: "status", header: "Trạng thái" },
];

const dummyData = [
  {
    account_number: "1111",
    account_name: "Tiền mặt",
    account_type: "Tài sản",
    parent_account: "-",
    status: "HOẠT_ĐỘNG",
  },
];

export default function ChartOfAccountsPage() {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Hệ thống tài khoản kế toán</h1>
      <ReusableDataTable columns={columns} data={dummyData} />
      {/* Drawer và Modal sẽ được triển khai trong tương lai */}
    </div>
  );
}
