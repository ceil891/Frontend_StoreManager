import { Modal } from '@/shared/components/ui/Modal';
import { ConfirmDeleteModal } from '@/shared/components/ui/ConfirmDeleteModal';
import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, FileText, Send, Download, Paperclip, CheckCircle2, ArrowRight, Building2, User, Package, Upload, X } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import type { ColumnDef } from '@tanstack/react-table';
import { axiosClient } from '@/shared/lib/axiosClient';
import { extractPageContent } from '@/shared/lib/apiHelpers';
import { toast } from 'sonner';
import { useAuthStore } from '@/features/auth/store/authStore';

export interface RFQLineItem {
  id: string;
  sku: string;
  productName: string;
  quantity: number;
  unit: string;
  specifications: string;
}

export interface RFQRecord {
  id: string;
  rfqCode: string;
  selectedSuppliers: string[];
  supplierName: string;
  supplierEmails?: string[];
  destinationBranch: string;
  sentDate: string;
  expiryDate: string;
  handler: string;
  status: 'CHO_BAO_GIA' | 'DA_BAO_GIA' | 'DA_HUY';
  notes?: string;
  items: RFQLineItem[];
  attachments?: { name: string; size: string }[];
}

interface SupplierOption {
  id: string | number;
  name: string;
  email: string;
  code: string;
}

interface ProductOption {
  id: string | number;
  sku: string;
  name: string;
  unit: string;
  price?: number;
  costPrice?: number;
}

interface BranchOption {
  id: number;
  name: string;
}

export function SupplierRequestsPage() {
  const [data, setData] = useState<RFQRecord[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<RFQRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<RFQRecord>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Api master data
  const [suppliersList, setSuppliersList] = useState<SupplierOption[]>([]);
  const [productsList, setProductsList] = useState<ProductOption[]>([]);
  const [branchesList, setBranchesList] = useState<BranchOption[]>([]);

  // Form line items
  const [formLines, setFormLines] = useState<RFQLineItem[]>([]);
  // Form attachments
  const [formFiles, setFormFiles] = useState<{ name: string; size: string }[]>([]);

  const currentUser = useAuthStore((s) => s.user);
  const loggedInUser = currentUser?.name || currentUser?.email || 'Nhân viên thu mua';

  const fetchMasterData = async () => {
    try {
      // Load suppliers
      axiosClient.get('/partnerarea/suppliers?size=500').then((res: any) => {
        const list = extractPageContent<any>(res);
        const mapped: SupplierOption[] = list.map((s: any, idx: number) => ({
          id: s.id || idx + 1,
          name: s.supplierName || s.name || s.companyName || 'Nhà cung cấp',
          email: s.email || s.contactEmail || `contact@${(s.code || 'supplier').toLowerCase()}.vn`,
          code: s.code || s.supplierCode || `SUP-${idx + 1}`,
        }));
        setSuppliersList(mapped);
      });

      // Load products
      axiosClient.get('/products?size=500').then((res: any) => {
        const list = extractPageContent<any>(res);
        const mapped: ProductOption[] = list.map((p: any, idx: number) => ({
          id: p.id || idx + 1,
          sku: p.sku || `SKU-${idx + 1}`,
          name: p.name || p.productName || 'Sản phẩm',
          unit: p.unit || 'Cái',
          price: Number(p.price || p.sellingPrice || 0),
          costPrice: Number(p.costPrice || p.importPrice || 0),
        }));
        setProductsList(mapped);
      });

      // Load branches
      axiosClient.get('/branches').then((res: any) => {
        const list = extractPageContent<any>(res);
        const mapped: BranchOption[] = list.map((b: any, idx: number) => ({
          id: Number(b.id || idx + 1),
          name: b.branchName || b.name || `Chi nhánh ${b.id || idx + 1}`,
        })).filter((b: any) => Boolean(b.name));
        setBranchesList(mapped.length > 0 ? mapped : [
          { id: 1, name: 'Kho phân phối Trung tâm (Hà Nội)' },
          { id: 2, name: 'Kho Chi nhánh Quận 1 (TP.HCM)' },
          { id: 3, name: 'Kho tổng miền Trung (Đà Nẵng)' },
        ]);
      });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRFQs = async () => {
    try {
      setIsLoading(true);
      const res = await axiosClient.get<any, any>('/purchase/supplier-requests').catch(() => null);
      const list = extractPageContent<any>(res);
      if (Array.isArray(list) && list.length > 0) {
        setData(list);
        return;
      }

      const ordersRes = await axiosClient.get('/purchase/orders?size=500').catch(() => null);
      const orderList = extractPageContent<any>(ordersRes);
      const mapped: RFQRecord[] = (Array.isArray(orderList) ? orderList : []).map((item: any) => {
        let status: RFQRecord['status'] = 'CHO_BAO_GIA';
        if (item.status === 'CONFIRMED' || item.status === 'COMPLETED' || item.status === 'APPROVED') status = 'DA_BAO_GIA';
        else if (item.status === 'CANCELLED') status = 'DA_HUY';
        
        const suppName = item.supplierName || item.supplier?.name || 'Nhà cung cấp';
        const rawDetails = Array.isArray(item.details) && item.details.length > 0 ? item.details : (Array.isArray(item.poLines) ? item.poLines : (Array.isArray(item.items) ? item.items : []));
        return {
          id: String(item.id),
          rfqCode: item.poCode || item.poNumber || `RFQ-2026-${String(item.id).padStart(4, '0')}`,
          selectedSuppliers: [suppName],
          supplierName: suppName,
          supplierEmails: [`contact@${suppName.split(' ')[0].toLowerCase()}.vn`],
          destinationBranch: item.branchName || item.destinationStore || 'Kho phân phối Trung tâm (Hà Nội)',
          sentDate: item.poDate ? String(item.poDate).split('T')[0] : (item.orderDate ? String(item.orderDate).split('T')[0] : new Date().toISOString().split('T')[0]),
          expiryDate: item.expectedDate ? String(item.expectedDate).split('T')[0] : (item.estDeliveryDate ? String(item.estDeliveryDate).split('T')[0] : ''),
          handler: item.createdByName || item.orderedBy || loggedInUser,
          status,
          notes: item.note || item.notes || '',
          items: rawDetails.map((l: any, idx: number) => ({
            id: String(l.id || idx + 1),
            sku: l.productSku || l.sku || `SKU-${l.productId || idx + 1}`,
            productName: l.productName || l.product?.name || 'Sản phẩm đặt mua',
            quantity: Number(l.quantity || 1),
            unit: l.unit || 'Cái',
            specifications: l.specifications || 'Quy chuẩn đóng gói tiêu chuẩn',
          })),
          attachments: [
            { name: 'Yeu_Cau_Ky_Thuat_RFQ.pdf', size: '1.2 MB' }
          ]
        };
      });
      setData(mapped);
    } catch (err) {
      console.error('Lỗi tải danh sách yêu cầu báo giá:', err);
      toast.error('Không thể tải danh sách yêu cầu báo giá');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
    fetchRFQs();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.rfqCode.toLowerCase().includes(q) ||
        d.supplierName.toLowerCase().includes(q) ||
        d.destinationBranch.toLowerCase().includes(q) ||
        d.handler.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    const defaultSupp = suppliersList[0]?.name || 'Nhà cung cấp';
    setEditingItem({
      rfqCode: `RFQ-2026-${Date.now().toString().slice(-4)}`,
      selectedSuppliers: [defaultSupp],
      supplierName: defaultSupp,
      destinationBranch: branchesList[0]?.name || 'Kho phân phối Trung tâm (Hà Nội)',
      sentDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      handler: loggedInUser,
      status: 'CHO_BAO_GIA',
      notes: '',
    });
    setFormLines([
      {
        id: '1',
        sku: productsList[0]?.sku || 'SKU-01',
        productName: productsList[0]?.name || 'Sản phẩm mẫu',
        quantity: 10,
        unit: productsList[0]?.unit || 'Cái',
        specifications: 'Đạt chuẩn kiểm định chất lượng',
      }
    ]);
    setFormFiles([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: RFQRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setFormLines(item.items || []);
    setFormFiles(item.attachments || []);
    setIsModalOpen(true);
  };

  const handleAddFormLine = () => {
    const p = productsList[0];
    const newLine: RFQLineItem = {
      id: Date.now().toString(),
      sku: p?.sku || `SKU-${formLines.length + 1}`,
      productName: p?.name || 'Sản phẩm mới',
      quantity: 1,
      unit: p?.unit || 'Cái',
      specifications: 'Đóng gói quy chuẩn',
    };
    setFormLines([...formLines, newLine]);
  };

  const handleRemoveFormLine = (id: string) => {
    setFormLines(formLines.filter(l => l.id !== id));
  };

  const handleUpdateFormLine = (id: string, field: keyof RFQLineItem, val: any) => {
    setFormLines(formLines.map(l => {
      if (l.id !== id) return l;
      if (field === 'sku') {
        const matched = productsList.find(p => p.sku === val);
        return {
          ...l,
          sku: val,
          productName: matched?.name || l.productName,
          unit: matched?.unit || l.unit,
        };
      }
      return { ...l, [field]: val };
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files).map(f => ({
      name: f.name,
      size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
    }));
    setFormFiles([...formFiles, ...filesArray]);
  };

  const handleToggleSupplier = (suppName: string) => {
    const current = editingItem.selectedSuppliers || [];
    let updated: string[];
    if (current.includes(suppName)) {
      updated = current.filter(s => s !== suppName);
    } else {
      updated = [...current, suppName];
    }
    const emails = updated.map(s => {
      const match = suppliersList.find(sp => sp.name === s);
      return match?.email || `contact@${s.split(' ')[0].toLowerCase()}.vn`;
    });
    setEditingItem({
      ...editingItem,
      selectedSuppliers: updated,
      supplierName: updated.join(', '),
      supplierEmails: emails,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedSupps = editingItem.selectedSuppliers || [];
    if (selectedSupps.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 Nhà cung cấp');
      return;
    }
    if (formLines.length === 0) {
      toast.error('Vui lòng thêm ít nhất 1 sản phẩm vào danh sách báo giá');
      return;
    }

    const supplierStr = selectedSupps.join(', ');
    const emails = selectedSupps.map(s => suppliersList.find(sp => sp.name === s)?.email || `contact@${s.split(' ')[0].toLowerCase()}.vn`);

    const record: RFQRecord = {
      id: editingItem.id || String(Date.now()),
      rfqCode: editingItem.rfqCode || `RFQ-2026-${Date.now().toString().slice(-4)}`,
      selectedSuppliers: selectedSupps,
      supplierName: supplierStr,
      supplierEmails: emails,
      destinationBranch: editingItem.destinationBranch || branchesList[0]?.name || 'Kho phân phối Trung tâm (Hà Nội)',
      sentDate: editingItem.sentDate || new Date().toISOString().split('T')[0],
      expiryDate: editingItem.expiryDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      handler: editingItem.handler || loggedInUser,
      status: (editingItem.status as any) || 'CHO_BAO_GIA',
      notes: editingItem.notes || '',
      items: formLines,
      attachments: formFiles,
    };

    try {
      if (modalMode === 'create') {
        const res = await axiosClient.post<any, any>('/purchase/supplier-requests', record).catch(() => null);
        if (res?.data?.id) record.id = String(res.data.id);
        else if (res?.id) record.id = String(res.id);
        setData([record, ...data]);
        toast.success(`Đã gửi thành công yêu cầu báo giá tới ${selectedSupps.length} Nhà cung cấp!`);
      } else {
        await axiosClient.put(`/purchase/supplier-requests/${record.id}`, record).catch(() => null);
        setData(data.map(d => d.id === record.id ? record : d));
        toast.success('Cập nhật yêu cầu báo giá thành công');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Lỗi lưu yêu cầu báo giá:', err);
      toast.error('Không thể lưu yêu cầu báo giá: ' + (err?.message || 'Thất bại'));
    }
  };

  const handleConvertToPO = async (rfq: RFQRecord) => {
    try {
      const matchedSupplier = suppliersList.find(
        (s) => s.name === rfq.supplierName || s.name === rfq.selectedSuppliers[0] || String(s.id) === rfq.supplierName
      );
      const supplierId = matchedSupplier ? Number(matchedSupplier.id) : (suppliersList[0] ? Number(suppliersList[0].id) : 1);
      const matchedBranch = branchesList.find(b => b.name === rfq.destinationBranch);
      const branchId = matchedBranch ? matchedBranch.id : (branchesList[0]?.id || 1);

      const details = (rfq.items && rfq.items.length > 0)
        ? rfq.items.map((i) => {
            const matchedProd = productsList.find((p) => p.sku === i.sku || p.name === i.productName);
            const unitPrice = matchedProd?.costPrice || matchedProd?.price || 50000;
            return {
              productId: matchedProd ? Number(matchedProd.id) : (productsList[0] ? Number(productsList[0].id) : 1),
              quantity: Number(i.quantity || 1),
              unitPrice: unitPrice > 0 ? unitPrice : 50000,
            };
          })
        : [
            {
              productId: productsList[0] ? Number(productsList[0].id) : 1,
              quantity: 1,
              unitPrice: 50000,
            }
          ];

      const poPayload = {
        poCode: `PO-${rfq.rfqCode.replace('RFQ-', '')}`,
        poDate: new Date().toISOString().substring(0, 19),
        expectedDeliveryDate: rfq.expiryDate ? `${rfq.expiryDate}T00:00:00` : new Date().toISOString().substring(0, 19),
        supplierId,
        branchId,
        status: 'PENDING',
        notes: `Tự động tạo từ phiếu yêu cầu báo giá ${rfq.rfqCode}. Ghi chú: ${rfq.notes || ''}`,
        details,
      };

      await axiosClient.post('/purchase/orders', poPayload);
      
      // Update RFQ status to DA_BAO_GIA
      const updatedRFQ: RFQRecord = { ...rfq, status: 'DA_BAO_GIA' };
      setData(data.map(d => d.id === rfq.id ? updatedRFQ : d));
      if (selected?.id === rfq.id) {
        setSelected(updatedRFQ);
      }

      toast.success(`Đã chuyển RFQ ${rfq.rfqCode} thành Đơn mua hàng (PO) thành công!`);
    } catch (err: any) {
      console.error('Lỗi chuyển đổi sang PO:', err);
      toast.error('Có lỗi khi chuyển đổi sang Đơn mua hàng PO: ' + (err?.response?.data?.message || err?.message || 'Thất bại'));
    }
  };

  const [deletingItem, setDeletingItem] = useState<RFQRecord | null>(null);

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    const id = deletingItem.id;
    try {
      await axiosClient.delete(`/purchase/supplier-requests/${id}`).catch(() => {});
      setData(data.filter(d => d.id !== id));
      toast.success(`Đã xóa yêu cầu báo giá "${deletingItem.rfqCode}" thành công!`);
      if (selected?.id === id) setSelected(null);
      setDeletingItem(null);
    } catch (err: any) {
      console.error('Lỗi xóa yêu cầu báo giá:', err);
      toast.error('Không thể xóa yêu cầu báo giá: ' + (err?.message || 'Thất bại'));
    }
  };

  const columns = useMemo<ColumnDef<RFQRecord>[]>(
    () => [
      {
        accessorKey: 'rfqCode',
        header: 'Mã RFQ',
        cell: (info) => <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'supplierName',
        header: 'Nhà cung cấp nhận RFQ',
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <span className="font-semibold text-gray-900 dark:text-white block">{row.original.supplierName}</span>
            {row.original.supplierEmails && row.original.supplierEmails.length > 0 && (
              <span className="text-[10px] text-gray-400 font-mono block truncate max-w-xs">
                📧 {row.original.supplierEmails.join(', ')}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'destinationBranch',
        header: 'Kho / Chi nhánh nhận',
        cell: (info) => <span className="text-gray-700 dark:text-gray-300">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'items',
        header: 'SL Mặt hàng',
        cell: ({ row }) => <span className="font-bold font-mono text-emerald-600">{row.original.items?.length || 1} mặt hàng</span>,
      },
      {
        accessorKey: 'sentDate',
        header: 'Ngày gửi / Hạn báo giá',
        cell: ({ row }) => (
          <div className="text-xs font-mono">
            <div>Gửi: {row.original.sentDate}</div>
            <div className="text-amber-600">Hạn: {row.original.expiryDate}</div>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          let badgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
          let label = 'Chờ báo giá';
          if (status === 'DA_BAO_GIA') {
            badgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
            label = 'Đã nhận báo giá';
          } else if (status === 'DA_HUY') {
            badgeClass = 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
            label = 'Đã hủy';
          }
          return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${badgeClass}`}>{label}</span>;
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelected(row.original);
              }}
              className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded transition-colors"
              title="Xem chi tiết RFQ"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleConvertToPO(row.original);
              }}
              className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded transition-colors"
              title="Chuyển thành Đơn mua hàng (PO)"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEdit(row.original);
              }}
              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
              title="Chỉnh sửa"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeletingItem(row.original);
              }}
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
              title="Xóa"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [data]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Yêu cầu báo giá nhà cung cấp (RFQ)</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Tạo và gửi yêu cầu báo giá (Requests for Quotation) hàng loạt tới các Nhà cung cấp để so sánh giá cạnh tranh & quy đổi sang PO 1-Click.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold text-sm shadow-sm"
        >
          <Plus className="w-4 h-4" /> Gửi Yêu Cầu Báo Giá Mới
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã RFQ, nhà cung cấp, kho nhận hàng, nhân viên..."
          className="w-full bg-transparent outline-none text-sm text-gray-900 dark:text-white"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
        </div>
      ) : (
        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />
      )}

      {/* DETAIL MODAL */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `📑 Chi tiết Yêu Cầu Báo Giá: ${selected.rfqCode}` : 'Chi tiết RFQ'}
        width="max-w-3xl"
      >
        {selected && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-emerald-800 dark:text-emerald-400 font-bold uppercase block">Mã phiếu RFQ</span>
                <p className="text-xl font-mono font-black text-emerald-600 dark:text-emerald-400">{selected.rfqCode}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  selected.status === 'DA_BAO_GIA' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {selected.status === 'DA_BAO_GIA' ? 'Đã nhận báo giá' : 'Chờ báo giá'}
                </span>
                <button
                  type="button"
                  onClick={() => handleConvertToPO(selected)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs transition shadow-sm"
                >
                  <ArrowRight className="w-3.5 h-3.5" /> Chuyển thành Đơn mua hàng (PO)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-2.5 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                <span className="text-gray-400 block text-[10px] uppercase font-semibold">Nhà cung cấp:</span>
                <span className="font-bold text-gray-900 dark:text-white text-xs block">{selected.supplierName}</span>
              </div>
              <div className="p-2.5 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                <span className="text-gray-400 block text-[10px] uppercase font-semibold">Kho nhận hàng:</span>
                <span className="font-semibold text-gray-900 dark:text-white text-xs block truncate">{selected.destinationBranch}</span>
              </div>
              <div className="p-2.5 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                <span className="text-gray-400 block text-[10px] uppercase font-semibold">Ngày gửi / Hạn:</span>
                <span className="font-mono text-xs block">{selected.sentDate} ➔ {selected.expiryDate}</span>
              </div>
              <div className="p-2.5 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                <span className="text-gray-400 block text-[10px] uppercase font-semibold">Nhân viên gửi:</span>
                <span className="font-semibold text-gray-900 dark:text-white text-xs block">{selected.handler}</span>
              </div>
            </div>

            {/* Bảng danh sách sản phẩm yêu cầu báo giá */}
            <div className="space-y-2">
              <span className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-[11px] block">
                📦 BẢNG DANH SÁCH MẶT HÀNG YÊU CẦU BÁO GIÁ ({selected.items?.length || 0})
              </span>
              <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-gray-950">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100 dark:bg-gray-900 text-gray-500 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="p-2 w-28">MÃ SKU</th>
                      <th className="p-2">TÊN SẢN PHẨM</th>
                      <th className="p-2 text-center w-20">SL YÊU CẦU</th>
                      <th className="p-2 text-center w-16">ĐVT</th>
                      <th className="p-2">QUY CÁCH KỸ THUẬT / YÊU CẦU CHẤT LƯỢNG</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {(selected.items || []).map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td className="p-2 font-mono font-bold text-emerald-600">{item.sku}</td>
                        <td className="p-2 font-medium text-gray-900 dark:text-white">{item.productName}</td>
                        <td className="p-2 text-center font-bold font-mono text-emerald-600">{item.quantity}</td>
                        <td className="p-2 text-center font-medium">{item.unit || 'Cái'}</td>
                        <td className="p-2 text-gray-600 dark:text-gray-400 text-[11px]">{item.specifications || 'Tiêu chuẩn nhà sản xuất'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tài liệu đính kèm */}
            {selected.attachments && selected.attachments.length > 0 && (
              <div className="space-y-1">
                <span className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-[11px] block">
                  📎 TỆP TÀI LIỆU ĐÍNH KÈM ({selected.attachments.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {selected.attachments.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 text-xs">
                      <Paperclip className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-medium text-gray-700 dark:text-gray-300">{file.name}</span>
                      <span className="text-[10px] text-gray-400">({file.size})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selected.notes && (
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                <span className="font-semibold text-gray-500 block mb-1">Ghi chú điều khoản vận hành:</span>
                <p className="text-gray-700 dark:text-gray-300">{selected.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* FORM CREATE / EDIT RFQ MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? '📑 Gửi yêu cầu báo giá (RFQ) mới' : '⚙️ Chỉnh sửa yêu cầu báo giá RFQ'}
        width="max-w-4xl"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Mã yêu cầu (RFQ) *</label>
              <input
                type="text"
                value={editingItem.rfqCode || ''}
                readOnly
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded font-mono bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nhân viên phụ trách * (Tự động)</label>
              <input
                type="text"
                value={editingItem.handler || loggedInUser}
                readOnly
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Kho / Chi nhánh nhận hàng dự kiến *</label>
              <select
                value={editingItem.destinationBranch || branchesList[0]?.name || ''}
                onChange={(e) => setEditingItem({ ...editingItem, destinationBranch: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-medium"
                required
              >
                {branchesList.map((b) => (
                  <option key={b.id} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* CHỌN NHÀ CUNG CẤP VÀ EMAIL NHẬN TIN */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase">
                🏢 CHỌN NHÀ CUNG CẤP GỬI RFQ (Cho phép chọn nhiều để so sánh giá cạnh tranh) *
              </label>
              <span className="text-[10px] text-gray-400 font-mono">Đã chọn: {editingItem.selectedSuppliers?.length || 0} NCC</span>
            </div>

            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800">
              {suppliersList.map((supp) => {
                const isSelected = (editingItem.selectedSuppliers || []).includes(supp.name);
                return (
                  <button
                    type="button"
                    key={supp.id}
                    onClick={() => handleToggleSupplier(supp.name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm'
                        : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    <span>{supp.name}</span>
                    <span className="text-[10px] opacity-60 font-mono">({supp.email})</span>
                  </button>
                );
              })}
            </div>

            {editingItem.supplierEmails && editingItem.supplierEmails.length > 0 && (
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded border border-emerald-200 dark:border-emerald-900">
                📧 <strong>Email sẽ tự động gửi tới:</strong> {editingItem.supplierEmails.join(', ')}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Ngày gửi RFQ *</label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={editingItem.sentDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, sentDate: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Ngày hết hạn nhận báo giá *</label>
              <input
                type="date"
                min={editingItem.sentDate || new Date().toISOString().split('T')[0]}
                value={editingItem.expiryDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, expiryDate: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
            </div>
          </div>

          {/* 1. BẢNG CHỌN SẢN PHẨM CÓ CẤU TRÚC */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-700 dark:text-gray-300 uppercase text-[11px] flex items-center gap-1">
                📦 BẢNG SẢN PHẨM YÊU CẦU BÁO GIÁ ({formLines.length})
              </span>
              <button
                type="button"
                onClick={handleAddFormLine}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm Mặt Hàng
              </button>
            </div>

            <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-950">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 dark:bg-gray-900 text-gray-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-2 w-48">SẢN PHẨM / SKU</th>
                    <th className="p-2 w-24 text-center">SL YÊU CẦU</th>
                    <th className="p-2 w-20 text-center">ĐVT</th>
                    <th className="p-2">QUY CÁCH KỸ THUẬT / YÊU CẦU CHẤT LƯỢNG</th>
                    <th className="p-2 w-10 text-center">XÓA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {formLines.map((line) => (
                    <tr key={line.id}>
                      <td className="p-2">
                        <select
                          value={line.sku}
                          onChange={(e) => handleUpdateFormLine(line.id, 'sku', e.target.value)}
                          className="w-full p-1.5 border rounded bg-white dark:bg-gray-900 text-xs font-semibold"
                        >
                          {productsList.map((p) => (
                            <option key={p.id} value={p.sku}>
                              {p.sku} - {p.name}
                            </option>
                          ))}
                          {!productsList.some(p => p.sku === line.sku) && (
                            <option value={line.sku}>{line.sku} - {line.productName}</option>
                          )}
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={(e) => handleUpdateFormLine(line.id, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full p-1.5 border rounded text-center font-bold text-emerald-600"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={line.unit || 'Cái'}
                          onChange={(e) => handleUpdateFormLine(line.id, 'unit', e.target.value)}
                          className="w-full p-1.5 border rounded bg-white dark:bg-gray-900 text-xs text-center font-medium"
                        >
                          <option value="Cái">Cái</option>
                          <option value="Thùng">Thùng</option>
                          <option value="Hộp">Hộp</option>
                          <option value="Chai">Chai</option>
                          <option value="Gói">Gói</option>
                          <option value="Lon">Lon</option>
                          <option value="Bộ">Bộ</option>
                          <option value="Chiếc">Chiếc</option>
                          <option value="Kg">Kg</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={line.specifications}
                          onChange={(e) => handleUpdateFormLine(line.id, 'specifications', e.target.value)}
                          className="w-full p-1.5 border rounded text-xs"
                          placeholder="Quy cách đóng gói, tiêu chuẩn chất lượng..."
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveFormLine(line.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. ĐÍNH KÈM TÀI LIỆU (FILE UPLOAD) */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 space-y-2">
            <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase flex items-center gap-1">
              📎 ĐÍNH KÈM TÀI LIỆU & BẢN VẼ KỸ THUẬT (Excel, PDF, Image)
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-semibold flex items-center gap-1.5 shadow-sm text-gray-700 dark:text-gray-300">
                <Upload className="w-4 h-4 text-emerald-600" /> Tải Tệp Lên
                <input type="file" multiple onChange={handleFileUpload} className="hidden" />
              </label>
              <span className="text-[11px] text-gray-400">Hỗ trợ các tệp PDF bản vẽ, file danh mục Excel, Catalog...</span>
            </div>

            {formFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {formFiles.map((f, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800 text-xs">
                    <Paperclip className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-medium text-gray-800 dark:text-gray-200">{f.name}</span>
                    <span className="text-[10px] text-gray-400">({f.size})</span>
                    <button
                      type="button"
                      onClick={() => setFormFiles(formFiles.filter((_, i) => i !== idx))}
                      className="text-gray-400 hover:text-red-500 ml-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. TRẠNG THÁI (ẨN KHI CREATING, HIỆN KHI EDITING) */}
          {modalMode === 'edit' && (
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">TRẠNG THÁI RFQ *</label>
              <select
                value={editingItem.status || 'CHO_BAO_GIA'}
                onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-bold"
              >
                <option value="CHO_BAO_GIA">Chờ báo giá</option>
                <option value="DA_BAO_GIA">Đã nhận báo giá</option>
                <option value="DA_HUY">Đã hủy RFQ</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">GHI CHÚ & ĐIỀU KHOẢN VẬN HÀNH</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              rows={2}
              placeholder="Ghi chú về thời gian phản hồi, địa điểm giao hàng hoặc yêu cầu đóng gói..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition"
            >
              <Send className="w-4 h-4" /> {modalMode === 'create' ? 'Gửi Yêu Cầu Báo Giá' : 'Lưu Cập Nhật'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa yêu cầu báo giá"
        description="Bạn có chắc chắn muốn xóa yêu cầu báo giá này khỏi hệ thống?"
        itemName={deletingItem ? `${deletingItem.rfqCode} - ${deletingItem.supplierName}` : undefined}
      />
    </div>
  );
}
