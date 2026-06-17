import { useMemo, useState, useEffect } from 'react';
import { Plus, Download, Search, Eye, Tag, Layers, CheckCircle2, FileText, Edit, Trash2, X } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
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
      matchesSearch = (
        item.categoryName.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.department.toLowerCase().includes(q)
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
        department: editingCategory.department || 'General',
        itemsCount: Number(editingCategory.itemsCount) || 0,
        totalValuation: Number(editingCategory.totalValuation) || 0,
        status: editingCategory.status as ProductCategory['status'] || 'ACTIVE',
        description: editingCategory.description || '',
        manager: editingCategory.manager || 'Admin',
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
    if (!deletingCategory) return;
    deleteCategory(deletingCategory.id);
    setDeletingCategory(null);
  };

  const columns = useMemo<ColumnDef<ProductCategory>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Mã danh mục',
        cell: (info) => <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'categoryName',
        header: 'Tên danh mục',
        cell: (info) => <span className="font-medium text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'parentId',
        header: 'Danh mục cha',
        cell: ({ row }) => {
          const parent = data.find((c) => c.id === row.original.parentId);
          return (
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {parent ? parent.categoryName : row.original.parentId ? row.original.parentId : '—'}
            </span>
          );
        },
      },
      {
        accessorKey: 'taxClass',
        header: 'Thuế suất',
        cell: (info) => {
          const tax = info.getValue() as string | undefined;
          const map: Record<string, string> = { VAT_8: 'VAT 8%', VAT_10: 'VAT 10%', EXEMPT: 'Miễn thuế' };
          return <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{tax ? map[tax] || tax : '—'}</span>;
        },
      },
      {
        accessorKey: 'department',
        header: 'Bộ phận / Ngành hàng',
        cell: (info) => <span className="text-sm text-gray-600 dark:text-gray-300">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'itemsCount',
        header: 'Số lượng sản phẩm',
        cell: (info) => <span className="font-bold text-gray-900 dark:text-white">{info.getValue() as number} mục</span>,
      },
      {
        accessorKey: 'totalValuation',
        header: 'Tổng giá trị',
        cell: (info) => <span className="font-bold text-emerald-600 dark:text-emerald-400">${(info.getValue() as number).toFixed(2)}</span>,
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
              {status === 'ACTIVE' ? 'Hoạt động' : 'Lưu trữ'}
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
              className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors shrink-0"
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Phân loại Danh mục Sản phẩm</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tổ chức danh mục sản phẩm, theo dõi số lượng mặt hàng và định giá hàng hóa theo từng ngành hàng. Nhấp vào dòng để xem chi tiết.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm whitespace-nowrap shrink-0">
              <Download className="w-4 h-4" /> Xuất dữ liệu
            </button>
            <button onClick={handleOpenCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm whitespace-nowrap shrink-0">
              <Plus className="w-4 h-4" /> Tạo danh mục
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
                className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm transition-all"
              />
            </div>
          </div>

          {/* Quick Filters Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium">Trạng thái danh mục:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                <option value="INACTIVE">Tạm ngưng (INACTIVE)</option>
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

      <Drawer
        isOpen={!!selectedCategory}
        onClose={() => setSelectedCategory(null)}
        title={selectedCategory ? `Category Card: ${selectedCategory.code}` : 'Category Details'}
        width="max-w-lg"
      >
        {selectedCategory && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-emerald-800 dark:text-emerald-400 font-semibold uppercase tracking-wider">{selectedCategory.department}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedCategory.categoryName}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedCategory.status === 'ACTIVE' ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100' :
                'bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
              }`}>
                {selectedCategory.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Active Products
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">{selectedCategory.itemsCount} SKUs</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Valuation Pool
                </div>
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 truncate">${selectedCategory.totalValuation.toFixed(2)}</p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Assigned Department:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedCategory.department}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Danh mục cha:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {data.find((c) => c.id === selectedCategory.parentId)?.categoryName || '—'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">TK Kho / COGS:</span>
                <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                  {selectedCategory.inventoryGlCode || '—'} / {selectedCategory.cogsGlCode || '—'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Thuế suất mặc định:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {selectedCategory.taxClass === 'VAT_8' ? 'VAT 8%' : selectedCategory.taxClass === 'EXEMPT' ? 'Miễn thuế' : selectedCategory.taxClass === 'VAT_10' ? 'VAT 10%' : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Category Lead Manager:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedCategory.manager}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Average Valuation / Item:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ${selectedCategory.itemsCount > 0 ? (selectedCategory.totalValuation / selectedCategory.itemsCount).toFixed(2) : '0.00'}
                </span>
              </div>

              {selectedCategory.description && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-800 mt-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Category Classification Rules</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">{selectedCategory.description}</p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow transition-colors text-sm">
                <FileText className="w-4 h-4" /> View Associated Products
              </button>
              {selectedCategory.status !== 'ACTIVE' && (
                <button className="px-4 py-2.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-semibold rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/60 transition-colors text-sm">
                  <CheckCircle2 className="w-4 h-4 inline mr-1" /> Restore Active Status
                </button>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Thêm Danh Mục Sản Phẩm' : 'Cập Nhật Danh Mục'}
        width="max-w-xl"
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã danh mục *</label>
              <input
                type="text"
                value={editingCategory.code || ''}
                onChange={(e) => setEditingCategory({ ...editingCategory, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tên danh mục *</label>
              <input
                type="text"
                value={editingCategory.categoryName || ''}
                onChange={(e) => setEditingCategory({ ...editingCategory, categoryName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Danh mục cha (Parent)</label>
              <select
                value={editingCategory.parentId || ''}
                onChange={(e) => setEditingCategory({ ...editingCategory, parentId: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">— Không có (cấp gốc) —</option>
                {data.filter((c) => c.id !== editingCategory.id).map((c) => (
                  <option key={c.id} value={c.id}>{c.categoryName} ({c.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Thuế suất mặc định</label>
              <select
                value={editingCategory.taxClass || 'VAT_10'}
                onChange={(e) => setEditingCategory({ ...editingCategory, taxClass: e.target.value as ProductCategory['taxClass'] })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              >
                <option value="VAT_8">VAT 8%</option>
                <option value="VAT_10">VAT 10%</option>
                <option value="EXEMPT">Miễn thuế</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">TK Kho (inventoryGlCode)</label>
              <input
                type="text"
                value={editingCategory.inventoryGlCode || ''}
                onChange={(e) => setEditingCategory({ ...editingCategory, inventoryGlCode: e.target.value })}
                placeholder="VD: 1561"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">TK Giá vốn (cogsGlCode)</label>
              <input
                type="text"
                value={editingCategory.cogsGlCode || ''}
                onChange={(e) => setEditingCategory({ ...editingCategory, cogsGlCode: e.target.value })}
                placeholder="VD: 6321"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Bộ phận / Ngành hàng</label>
              <input
                type="text"
                value={editingCategory.department || ''}
                onChange={(e) => setEditingCategory({ ...editingCategory, department: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                placeholder="Ví dụ: Fashion, Electronics..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Người quản lý (Lead Manager)</label>
              <input
                type="text"
                value={editingCategory.manager || ''}
                onChange={(e) => setEditingCategory({ ...editingCategory, manager: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Số lượng sản phẩm</label>
              <input
                type="number"
                value={editingCategory.itemsCount || 0}
                onChange={(e) => setEditingCategory({ ...editingCategory, itemsCount: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tổng giá trị lưu kho ($)</label>
              <input
                type="number"
                step="0.01"
                value={editingCategory.totalValuation || 0}
                onChange={(e) => setEditingCategory({ ...editingCategory, totalValuation: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái</label>
            <select
              value={editingCategory.status || 'ACTIVE'}
              onChange={(e) => setEditingCategory({ ...editingCategory, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="ARCHIVED">Lưu trữ (Vô hiệu hóa)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mô tả quy tắc phân loại</label>
            <textarea
              rows={2}
              value={editingCategory.description || ''}
              onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors text-sm"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow transition-colors text-sm"
            >
              {modalMode === 'create' ? 'Tạo danh mục' : 'Lưu thay đổi'}
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
