import React from 'react';
import { Modal } from './Modal';
import { Printer, Download, Building, CheckCircle2, ShieldCheck } from 'lucide-react';

export interface PrintLineItem {
  sku?: string;
  name: string;
  unit?: string;
  quantity: number;
  price: number;
  discount?: number;
  total: number;
}

export interface PrintInvoiceData {
  documentTitle: string; // ví dụ: "HÓA ĐƠN BÁN LẺ VAT", "BÁO GIÁ BÁN HÀNG", "PHIẾU CHUYỂN KHO"
  code: string;
  date: string;
  dueDate?: string;
  customerOrSupplierName: string;
  phone?: string;
  address?: string;
  taxCode?: string;
  branchName?: string;
  createdByName?: string;
  notes?: string;
  items: PrintLineItem[];
  subTotal: number;
  taxAmount?: number;
  discountAmount?: number;
  totalAmount: number;
  statusLabel?: string;
}

interface PrintInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PrintInvoiceData | null;
}

export function PrintInvoiceModal({ isOpen, onClose, data }: PrintInvoiceModalProps) {
  if (!data) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`🖨️ Xem bản in: ${data.code}`}
      width="max-w-4xl"
    >
      <div className="space-y-6 text-gray-900 dark:text-gray-100">
        {/* Actions Bar (Screen only) */}
        <div className="print:hidden flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Bản in chứng từ hợp chuẩn RetailHub ERP System</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
            >
              <Printer className="w-4 h-4" /> In chứng từ (Print/PDF)
            </button>
          </div>
        </div>

        {/* PRINTABLE DOCUMENT AREA */}
        <div id="printable-document" className="p-8 bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 text-xs space-y-6 print:p-0 print:border-none print:shadow-none">
          {/* Header section */}
          <div className="flex justify-between items-start border-b border-gray-200 dark:border-gray-800 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-extrabold text-sm">
                  RH
                </div>
                <span className="text-lg font-extrabold tracking-tight text-gray-900 dark:text-white uppercase">
                  HỆ THỐNG RETAILHUB ERP
                </span>
              </div>
              <p className="text-[11px] text-gray-500">Đơn vị: Công ty Cổ phần Quản lý Bán lẻ RetailHub</p>
              <p className="text-[11px] text-gray-500">Địa chỉ: 123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM</p>
              <p className="text-[11px] text-gray-500">MST: 0316889988 - Hotline: 1900 6868</p>
            </div>
            <div className="text-right space-y-1">
              <h2 className="text-xl font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                {data.documentTitle}
              </h2>
              <p className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300">Số: {data.code}</p>
              <p className="text-[11px] text-gray-500">Ngày lập: {data.date}</p>
              {data.dueDate && <p className="text-[11px] text-gray-500">Hạn thanh toán: {data.dueDate}</p>}
            </div>
          </div>

          {/* Recipient / Partner details */}
          <div className="grid grid-cols-2 gap-6 bg-gray-50 dark:bg-gray-900/60 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Thông tin đối tác / Khách hàng</p>
              <p className="font-bold text-sm text-gray-900 dark:text-white">{data.customerOrSupplierName}</p>
              {data.phone && <p className="text-gray-600 dark:text-gray-400 mt-0.5">Điện thoại: {data.phone}</p>}
              {data.address && <p className="text-gray-600 dark:text-gray-400">Địa chỉ: {data.address}</p>}
              {data.taxCode && <p className="text-gray-600 dark:text-gray-400 font-mono">Mã số thuế: {data.taxCode}</p>}
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Thông tin quản lý chứng từ</p>
              {data.branchName && <p className="text-gray-700 dark:text-gray-300 font-medium">Chi nhánh: {data.branchName}</p>}
              {data.createdByName && <p className="text-gray-700 dark:text-gray-300">Người lập phiếu: {data.createdByName}</p>}
              {data.statusLabel && (
                <p className="mt-1 inline-block px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded font-bold text-[10px] uppercase">
                  {data.statusLabel}
                </p>
              )}
            </div>
          </div>

          {/* Table of Items */}
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-2.5 w-10 text-center">STT</th>
                  <th className="p-2.5">Tên sản phẩm / SKU</th>
                  <th className="p-2.5 w-20 text-center">ĐVT</th>
                  <th className="p-2.5 w-20 text-center">Số lượng</th>
                  <th className="p-2.5 w-28 text-right">Đơn giá</th>
                  <th className="p-2.5 w-24 text-right">Chiết khấu</th>
                  <th className="p-2.5 w-32 text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {data.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-900/40">
                    <td className="p-2.5 text-center text-gray-500">{idx + 1}</td>
                    <td className="p-2.5 font-medium text-gray-900 dark:text-white">
                      {item.name}
                      {item.sku && <span className="block text-[10px] text-gray-400 font-mono">{item.sku}</span>}
                    </td>
                    <td className="p-2.5 text-center text-gray-500">{item.unit || 'Cái'}</td>
                    <td className="p-2.5 text-center font-bold">{item.quantity}</td>
                    <td className="p-2.5 text-right font-mono">{item.price.toLocaleString('vi-VN')} ₫</td>
                    <td className="p-2.5 text-right font-mono text-red-500 font-medium">
                      {item.discount ? `${item.discount.toLocaleString('vi-VN')} ₫` : '-'}
                    </td>
                    <td className="p-2.5 text-right font-bold font-mono text-gray-900 dark:text-white">
                      {item.total.toLocaleString('vi-VN')} ₫
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="flex justify-between items-start pt-2">
            <div className="max-w-md space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase block">Ghi chú chứng từ</span>
              <p className="text-gray-600 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-900 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800">
                {data.notes || 'Không có ghi chú thêm.'}
              </p>
            </div>

            <div className="w-64 space-y-2 text-right">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Tiền hàng (Subtotal):</span>
                <span className="font-mono font-semibold text-gray-900 dark:text-white">{data.subTotal.toLocaleString('vi-VN')} ₫</span>
              </div>
              {data.taxAmount != null && data.taxAmount > 0 && (
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Thuế VAT:</span>
                  <span className="font-mono text-blue-600 font-semibold">+{data.taxAmount.toLocaleString('vi-VN')} ₫</span>
                </div>
              )}
              {data.discountAmount != null && data.discountAmount > 0 && (
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Chiết khấu / Giảm giá:</span>
                  <span className="font-mono text-red-500 font-semibold">-{data.discountAmount.toLocaleString('vi-VN')} ₫</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold border-t border-gray-200 dark:border-gray-700 pt-2 text-emerald-600 dark:text-emerald-400">
                <span>TỔNG CỘNG:</span>
                <span className="font-mono text-base font-black">{data.totalAmount.toLocaleString('vi-VN')} ₫</span>
              </div>
            </div>
          </div>

          {/* Signature Block */}
          <div className="grid grid-cols-3 gap-4 text-center pt-8 border-t border-gray-200 dark:border-gray-800">
            <div>
              <p className="font-bold text-gray-900 dark:text-white uppercase text-[10px]">Người lập phiếu</p>
              <p className="text-[10px] text-gray-400 italic mb-12">(Ký & ghi rõ họ tên)</p>
              <p className="font-medium text-gray-700 dark:text-gray-300">{data.createdByName || 'Thủ kho / Nhân viên'}</p>
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white uppercase text-[10px]">Kế toán trưởng / Duyệt</p>
              <p className="text-[10px] text-gray-400 italic mb-12">(Ký & đóng dấu)</p>
              <p className="font-medium text-gray-700 dark:text-gray-300">Ban Giám Đốc</p>
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white uppercase text-[10px]">Đại diện Khách hàng / NCC</p>
              <p className="text-[10px] text-gray-400 italic mb-12">(Ký nhận & xác nhận)</p>
              <p className="font-medium text-gray-700 dark:text-gray-300">{data.customerOrSupplierName}</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
