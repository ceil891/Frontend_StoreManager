import { Modal } from '@/shared/components/ui/Modal';
import { useMemo, useState, useEffect } from 'react';
import { Plus, Download, Search, Eye, Tag, Layers, CheckCircle2, FileText, Edit, Trash2, X } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { TreeSelect } from '@/shared/components/ui/TreeSelect';
import { CurrencyInput } from '@/shared/components/ui/CurrencyInput';
import { FileDropzone } from '@/shared/components/ui/FileDropzone';
import type { ColumnDef } from '@tanstack/react-table';
import { useInventoryStore, type ProductCategory } from '../store/inventoryStore';

export function CategoriesPage() {
  const { categories: data, addCategory, updateCategory, deleteCategory, fetchCategories } = useInventoryStore();

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingCategory, setEditingCategory] = useState<Partial<ProductCategory>>({});
  const [deletingCategory, setDeletingCategory] = useState<ProductCategory | null>(null);

  const filtered = data.filter((item) => {
    // 1. Text search
    let matchesSearch = true;
    const q = search.toLowerCase();
    if (q) {
      const deptStr = typeof item.department === 'string' ? item.department : (item.department as any)?.deptName || '';
      matchesSearch = (
        item.categoryName.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        deptStr.toLowerCase().includes(q) ||
        item.status.toLowerCase().includes(q)
      );
    }

    // 2. Status filter
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingCategory({
      code: `CAT-${Math.floor(100 + Math.random() * 900)}`,
      categoryName: '',
      parentId: '',
      department: '',
      itemsCount: 0,
      totalValuation: 0,
      status: 'ACTIVE',
      description: '',
      manager: '',
      inventoryGlCode: '',
      cogsGlCode: '',
      taxClass: 'VAT_10',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: ProductCategory) => {
    setModalMode('edit');
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory.code || !editingCategory.categoryName) return;

    if (modalMode === 'create') {
      const newCategory: Omit<ProductCategory, 'id'> = {
        code: editingCategory.code,
        categoryName: editingCategory.categoryName,
        parentId: editingCategory.parentId || undefined,
        department: editingCategory.department || 'Chung',
        itemsCount: Number(editingCategory.itemsCount) || 0,
        totalValuation: Number(editingCategory.totalValuation) || 0,
        status: editingCategory.status as ProductCategory['status'] || 'ACTIVE',
        description: editingCategory.description || '',
        manager: editingCategory.manager || 'Quản trị viên',
        inventoryGlCode: editingCategory.inventoryGlCode,
        cogsGlCode: editingCategory.cogsGlCode,
        taxClass: editingCategory.taxClass,
      };
      addCategory(newCategory);
    } else if (editingCategory.id) {
      updateCategory(editingCategory.id, editingCategory);
    }
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (deletingCategory) {
      deleteCategory(deletingCategory.id);
      setDeletingCategory(null);
      if (selectedCategory?.id === deletingCategory.id) {
        setSelectedCategory(null);
      }
    }
  };

  const treeNodes = useMemo(() => {
    return data.map((c) => ({
      id: c.id,
      label: c.categoryName,
      value: c.id,
      parentId: c.parentId,
    }));
  }, [data]);

  const columns = useMemo<ColumnDef<ProductCategory>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Mã danh mục',
        cell: (info) => <span className="font-mono font-semibold text-primary">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'categoryName',
        header: 'Tên danh mục',
        cell: (info) => <span className="font-semibold text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'parentId',
        header: 'Danh mục cha',
        cell: (info) => {
          const pId = info.getValue() as string;
          if (!pId) return <span className="text-gray-400 dark:text-gray-500">— Gốc</span>;
          const parent = data.find((c) => c.id === pId);
          return <span className="text-gray-700 dark:text-gray-300 font-medium">{parent ? parent.categoryName : pId}</span>;
        },
      },
      {
        accessorKey: 'taxClass',
        header: 'Thuế suất',
        cell: (info) => {
          const tax = info.getValue() as string;
          const label = tax === 'VAT_8' ? 'VAT 8%' : tax === 'VAT_10' ? 'VAT 10%' : tax === 'EXEMPT' ? 'Miễn VAT' : tax || 'VAT 10%';
          return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700">{label}</span>;
        }
      },
      {
        accessorKey: 'department',
        header: 'Phòng ban / Nhóm',
        cell: (info) => {
          const val = info.getValue();
          const dept = typeof val === 'string' ? val : (val as any)?.deptName;
          return <span className="text-gray-600 dark:text-gray-400">{dept || 'Chưa phân bổ'}</span>;
        },
      },
      {
        accessorKey: 'itemsCount',
        header: 'Số lượng sản phẩm',
        cell: (info) => <span className="font-medium text-gray-900 dark:text-white">{((info.getValue() as number) || 0).toLocaleString('vi-VN')}</span>,
      },
      {
        accessorKey: 'totalValuation',
        header: 'Tổng giá trị',
        cell: (info) => <span className="font-bold text-primary">{((info.getValue() as number) || 0).toLocaleString('vi-VN')} đ</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
              'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            }`}>
              {status === 'ACTIVE' ? 'Đang hoạt động' : 'Lưu trữ'}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedCategory(row.original); }}
              title="Xem chi tiết"
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors shrink-0"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleOpenEdit(row.original); }}
              title="Chỉnh sửa"
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors shrink-0"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setDeletingCategory(row.original); }}
              title="Xóa"
              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors shrink-0"
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
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Phân loại danh mục sản phẩm</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tổ chức danh mục sản phẩm, theo dõi số lượng mặt hàng và định giá theo từng ngành hàng</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm whitespace-nowrap shrink-0">
              <Download className="w-4 h-4" /> Xuất Excel
            </button>
            <button onClick={handleOpenCreate} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors text-sm font-medium shadow-sm whitespace-nowrap shrink-0">
              <Plus className="w-4 h-4" /> Thêm mới danh mục
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm theo tên danh mục, mã hoặc bộ phận..."
                className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all"
              />
            </div>
          </div>

          {/* Quick Filters Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Trạng thái danh mục:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary text-xs cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="INACTIVE">Tạm ngừng</option>
              </select>
            </div>

            {(statusFilter !== 'all' || search) && (
              <button
                onClick={() => { setStatusFilter('all'); setSearch(''); }}
                className="text-xs text-red-500 hover:text-red-600 font-semibold flex items-center gap-1 ml-auto transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedCategory(row)} />
      </div>

      <Modal
        isOpen={!!selectedCategory}
        onClose={() => setSelectedCategory(null)}
        title={selectedCategory ? `Thẻ danh mục: ${selectedCategory.code}` : 'Chi tiết danh mục'}
        width="max-w-lg"
      >
        {selectedCategory && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-primary/10 rounded-xl border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-primary font-semibold uppercase tracking-wider">
                    {typeof selectedCategory.department === 'string' ? selectedCategory.department : (selectedCategory.department as any)?.deptName}
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedCategory.categoryName}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedCategory.status === 'ACTIVE' ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100' :
                'bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
              }`}>
                {selectedCategory.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã lưu trữ'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Layers className="w-4 h-4 text-primary" />
                  Mặt hàng đăng ký
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(selectedCategory.itemsCount || 0).toLocaleString('vi-VN')}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  Tổng giá trị tồn
                </div>
                <p className="text-2xl font-bold text-primary">
                  {(selectedCategory.totalValuation || 0).toLocaleString('vi-VN')} đ
                </p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-sm">
              <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">Danh mục cha</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {selectedCategory.parentId ? (data.find(c => c.id === selectedCategory.parentId)?.categoryName || selectedCategory.parentId) : 'Không có (gốc)'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">Thuế suất áp dụng</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {selectedCategory.taxClass === 'VAT_8' ? 'VAT 8%' : selectedCategory.taxClass === 'VAT_10' ? 'VAT 10%' : selectedCategory.taxClass === 'EXEMPT' ? 'Miễn VAT' : selectedCategory.taxClass || 'VAT 10%'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">Tài khoản hàng tồn kho</span>
                <span className="font-mono text-gray-900 dark:text-white">{selectedCategory.inventoryGlCode || '1561'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">Tài khoản giá vốn</span>
                <span className="font-mono text-gray-900 dark:text-white">{selectedCategory.cogsGlCode || '6321'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500 dark:text-gray-400">Người quản lý</span>
                <span className="font-medium text-gray-900 dark:text-white">{selectedCategory.manager || 'Chưa cập nhật'}</span>
              </div>
            </div>

            {selectedCategory.description && (
              <div>
                <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Mô tả & quy tắc</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                  {selectedCategory.description}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors text-sm"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  const cat = selectedCategory;
                  setSelectedCategory(null);
                  handleOpenEdit(cat);
                }}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg shadow transition-colors text-sm flex items-center gap-1.5"
              >
                <Edit className="w-4 h-4" /> Chỉnh sửa
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Thêm mới danh mục sản phẩm' : 'Cập nhật danh mục'}
        size="erp"
      >
        <form onSubmit={handleSaveCategory} className="space-y-6">
          <div className="erp-form-body">
            {/* Section 1: Định danh danh mục */}
            <div className="erp-form-section space-y-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">Định danh danh mục</h3>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã danh mục *</label>
                <input
                  type="text"
                  required
                  value={editingCategory.code || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tên danh mục *</label>
                <input
                  type="text"
                  required
                  value={editingCategory.categoryName || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, categoryName: e.target.value })}
                  placeholder="Ví dụ: Điện thoại, Bánh kẹo..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Danh mục cấp cha</label>
                <TreeSelect
                  data={treeNodes}
                  value={editingCategory.parentId}
                  onChange={(val) => setEditingCategory({ ...editingCategory, parentId: val })}
                  placeholder="Chọn danh mục cha (để trống nếu là gốc)..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái</label>
                <select
                  value={editingCategory.status || 'ACTIVE'}
                  onChange={(e) => setEditingCategory({ ...editingCategory, status: e.target.value as ProductCategory['status'] })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                >
                  <option value="ACTIVE">Đang hoạt động</option>
                  <option value="INACTIVE">Tạm ngừng</option>
                </select>
              </div>
            </div>

            {/* Section 2: Thuế & Kế toán */}
            <div className="erp-form-section space-y-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">Thuế & kế toán</h3>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nhóm thuế suất VAT</label>
                <select
                  value={editingCategory.taxClass || 'VAT_10'}
                  onChange={(e) => setEditingCategory({ ...editingCategory, taxClass: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                >
                  <option value="VAT_8">VAT 8% (Ưu đãi)</option>
                  <option value="VAT_10">VAT 10% (Chuẩn)</option>
                  <option value="EXEMPT">Miễn thuế VAT</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tài khoản hàng tồn kho (GL Code)</label>
                  <input
                    type="text"
                    value={editingCategory.inventoryGlCode || ''}
                    onChange={(e) => setEditingCategory({ ...editingCategory, inventoryGlCode: e.target.value })}
                    placeholder="Ví dụ: 1561"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tài khoản giá vốn (COGS Code)</label>
                  <input
                    type="text"
                    value={editingCategory.cogsGlCode || ''}
                    onChange={(e) => setEditingCategory({ ...editingCategory, cogsGlCode: e.target.value })}
                    placeholder="Ví dụ: 6321"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Số lượng SKU đăng ký</label>
                  <input
                    type="number"
                    value={editingCategory.itemsCount || 0}
                    onChange={(e) => setEditingCategory({ ...editingCategory, itemsCount: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tổng định giá kho (đ)</label>
                  <CurrencyInput
                    value={editingCategory.totalValuation || 0}
                    onChange={(val) => setEditingCategory(prev => ({ ...prev, totalValuation: val }))}
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <FileDropzone
                  accept=".png,.jpg,.jpeg,.svg"
                  label="Biểu tượng icon danh mục & tài liệu định mức"
                />
              </div>
            </div>

            {/* Section 3: Phân loại & Mô tả */}
            <div className="erp-form-section space-y-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">Phân loại & mô tả</h3>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Bộ phận / Ngành hàng</label>
                <input
                  type="text"
                  value={editingCategory.department || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                  placeholder="Ví dụ: Thời trang, Điện tử..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Người quản lý</label>
                <input
                  type="text"
                  value={editingCategory.manager || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, manager: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mô tả quy tắc phân loại</label>
                <textarea
                  rows={4}
                  value={editingCategory.description || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            </div>
          </div>

          <div className="erp-form-footer border-t border-gray-200 dark:border-gray-700 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors text-sm"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg shadow transition-colors text-sm"
            >
              {modalMode === 'create' ? 'Tạo mới' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        title="Xác nhận xóa danh mục"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Bạn có chắc chắn muốn xóa danh mục <strong className="text-gray-900 dark:text-white">{deletingCategory?.categoryName}</strong> không? Hành động này có thể ảnh hưởng đến các sản phẩm thuộc danh mục này.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setDeletingCategory(null)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors text-sm"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow transition-colors text-sm"
            >
              Đồng ý xóa
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
