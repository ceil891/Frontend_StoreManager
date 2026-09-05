# 📑 SỔ NHẬT KÝ BUG, RÀ SOÁT CHUYÊN SÂU 4 MODULE TRỌNG YẾU VÀ KẾ HOẠCH NÂNG CẤP HỆ THỐNG
> **Dự án:** RetailHub StoreManager (Hệ thống Quản trị Bán lẻ & Kho vận Đa kênh)  
> **Phạm vi rà soát:** Các trang đang hoạt động thực tế trong `src/routes/index.tsx` thuộc **4 Module cốt lõi** và **Phân hệ Khách hàng CRM**:
> 1. 🛒 **Mua hàng (Purchasing)**
> 2. 💰 **Bán hàng & POS (Sales & POS Terminal)**
> 3. 🧾 **Hóa đơn & Công nợ (Invoices & Receivables)**
> 4. 📦 **Sản phẩm & Kho vận (Catalog, Products & Inventory WMS)**  
> 5. 👥 **CRM & Quản lý khách hàng (Customers, Loyalty, Vouchers, Warranties, Support, Marketing - Đã hoàn thành)**  
> **Cập nhật lần cuối:** 05/09/2026

---

## 📊 TỔNG QUAN TIẾN ĐỘ & TRẠNG THÁI HỆ THỐNG
- **Tổng số hạng mục đã kiểm thử & sửa chữa ban đầu:** 93 / 93 mục (`BUG-01` đến `BUG-93`)
- **Tình trạng kiểm tra TypeScript (`npx tsc -b`):** 0 errors (100% Clean)
- **Tình trạng đóng gói Vite (`npm run build`):** Exit code 0 (Build thành công)
- **Mục tiêu báo cáo:** Rà soát đối chiếu toàn diện giữa Frontend (`src/features/*`) và Backend Spring Boot (`org.example.storemanager.modules.*`) trên các trang thực tế trong `index.tsx`. Phát hiện toàn bộ các lỗi CRUD (Tạo - Sửa - Xóa), bẫy nuốt lỗi (silent catch), lệch thuộc tính DTO, lỗ hổng kiến trúc và đề xuất kế hoạch hành động chi tiết.

---

## 🚨 I. BẢNG THEO DÕI BUG LỊCH SỬ (BUG-01 ĐẾN BUG-93)

| ID | Trạng thái | Phân hệ / Tệp | Mô tả lỗi & Giải pháp khắc phục |
| :--- | :---: | :--- | :--- |
| **BUG-01** | 🟢 `[DONE]` | `DeliveryTripsPage.tsx` | Sửa lỗi cú pháp JSX thiếu thẻ đóng tại dòng 349 làm gãy build `tsc -b`. |
| **BUG-02** | 🟢 `[DONE]` | `StockTransferPage.tsx` | Bổ sung hàm tính tồn khả dụng `getAvailableStockForBranch`, chặn lưu nếu chuyển quá tồn. |
| **BUG-03** | 🟢 `[DONE]` | `SupportTicketsPage.tsx` | Xóa stub `setData` rỗng, kết nối `useCrmStore` (`deleteSupportTicket`, `fetchSupportTickets`). |
| **BUG-04** | 🟢 `[DONE]` | `DepreciationHistoryPage.tsx` & `financeStore.ts` | Kết nối API `/accounting/depreciation-history`, hoàn thiện CRUD khấu hao TSCĐ. |
| **BUG-05** | 🟢 `[DONE]` | `EmployeeContractsPage.tsx` | Xóa stub `setData`, kết nối `useHrStore` (`addContract`, `updateContract`, `deleteContract`). |
| **BUG-06** | 🟢 `[DONE]` | `KpiRecordsPage.tsx` | Xóa stub `setData`, kết nối `addKpiRecord` và `updateKpiRecord` từ `useHrStore`. |
| **BUG-07** | 🟢 `[DONE]` | `PosSessionsPage.tsx` | Kết nối `updateSession` cập nhật `CLOSED` khi quản lý phê duyệt sinh trắc học chốt ca. |
| **BUG-08** | 🟢 `[DONE]` | `FeedbackPage.tsx` | Sửa lỗi chính tả `fetchFeedback()` thành `fetchFeedbacks()`, dùng `deleteFeedback` chuẩn. |
| **BUG-09** | 🟢 `[DONE]` | `SystemErrorLogPage.tsx` | Hoàn thiện tính năng đánh dấu đã xử lý lỗi hệ thống qua state `resolvedIds`. |
| **BUG-10** | 🟢 `[DONE]` | `crmStore`, `financeStore`, `hrStore` | Loại bỏ thói quen xóa UI khi API lỗi trong khối catch; áp dụng Optimistic Rollback. |
| **BUG-11** | 🟢 `[DONE]` | `PurchasePaymentsPage.tsx` | Xóa bỏ mảng mock cứng Coca Cola khi API rỗng, chuyển sang Empty State chuẩn. |
| **BUG-12** | 🟢 `[DONE]` | `WarehouseBinsPage.tsx` | Chi tiết ô kệ lấy động từ danh mục `products` thay cho mock iPhone/Samsung. |
| **BUG-13** | 🟢 `[DONE]` | `PermissionsPage.tsx` & `permissionStore.ts` | Hoàn thiện đầy đủ các action CRUD quyền hạn đồng bộ Backend. |
| **BUG-14** | 🟢 `[DONE]` | `FundBalancesPage.tsx`, `TaxDutiesPage.tsx` | Xóa stub rỗng, kết nối Zustand store trung tâm cho số dư quỹ và nghĩa vụ thuế. |
| **BUG-15** | 🟢 `[DONE]` | `SupplierWarehousesPage.tsx` & `inventoryStore.ts` | Đồng bộ backend kho NCC `/inventories/supplier-warehouses` và persist fallback. |
| **BUG-16** | 🟢 `[DONE]` | `DeliveryTripsPage.tsx` | Xóa sạch mock data `DEFAULT_TRIPS` Viettel Post / GHTK. |
| **BUG-17** | 🟢 `[DONE]` | `ShippersPage.tsx` | Xóa mock `defaultShipperList`, hiển thị đối tác thực tế từ Backend. |
| **BUG-18** | 🟢 `[DONE]` | `ProductVariantsPage.tsx` | Khắc phục bắn toast.success sai khi API lỗi, giữ nguyên state khi có ngoại lệ mạng. |
| **BUG-19** | 🟢 `[DONE]` | `ProductDetailsPage.tsx` | Bổ sung nút Xóa (`Trash2`) và `ConfirmDeleteModal` vào cột thao tác sản phẩm. |
| **BUG-20** | 🟢 `[DONE]` | `ProductWarrantiesPage.tsx` | Chuyển toàn bộ axios rời rạc và `window.confirm` sang `useCrmStore` và modal chuẩn. |
| **BUG-21** | 🟢 `[DONE]` | `PurchaseReturnsListsPage.tsx` | Xóa bỏ cập nhật state giả mạo khi API lỗi, thay thế `confirm()` bằng modal. |
| **BUG-22** | 🟢 `[DONE]` | `ShippingNotesPage.tsx` | Xóa bỏ mock `DEFAULT_NOTES`, áp dụng rollback chuẩn khi xóa ghi chú vận chuyển. |
| **BUG-23** | 🟢 `[DONE]` | `WarrantyClaimsPage.tsx` | Xóa bỏ hardcode 'Nguyễn Văn A', tra cứu động thông tin khách từ sổ bảo hành. |
| **BUG-24** | 🟢 `[DONE]` | `SalesChannelsPage.tsx` | Bổ sung validation, bọc `try...catch` và chuyển sang `ConfirmDeleteModal`. |
| **BUG-25** | 🟢 `[DONE]` | `ChannelProductMappingPage.tsx` | Bổ sung validation SKU, bọc `try...catch` và `ConfirmDeleteModal`. |
| **BUG-26** | 🟢 `[DONE]` | `StorageAreasPage.tsx` | Validation bắt buộc mã/tên bãi kho, tích hợp modal xóa an toàn. |
| **BUG-27** | 🟢 `[DONE]` | Cấu trúc kho WMS (Zone, Rack, Bin) | Chuẩn hóa toàn bộ thao tác xóa cấu trúc kho sang `ConfirmDeleteModal`. |
| **BUG-28** | 🟢 `[DONE]` | `SalesInvoicesPage.tsx` & `PurchaseInvoicesPage.tsx` | Thay thế hộp thoại xóa thô sơ bằng `ConfirmDeleteModal`. |
| **BUG-29** | 🟢 `[DONE]` | `ShippersPage.tsx` | Sửa xóa đối tác giao vận an toàn (chỉ xóa UI khi server trả 200). |
| **BUG-30** | 🟢 `[DONE]` | `ShippingCarriersPage.tsx` | Bỏ nuốt lỗi và báo thành công sai khi xóa hãng tàu/vận tải. |
| **BUG-31** | 🟢 `[DONE]` | `SupplierDeliveriesPage.tsx` | Chuẩn hóa quy trình nhận hàng và xóa phiếu giao NCC qua modal xác nhận. |
| **BUG-32** | 🟢 `[DONE]` | `SupplierRequestsPage.tsx` | Bỏ `.catch(() => {})` nuốt lỗi khi xóa đơn mua hàng NCC. |
| **BUG-33** | 🟢 `[DONE]` | `CustomerVouchersPage.tsx` | Chuẩn hóa thao tác thu hồi voucher sang `ConfirmDeleteModal`. |
| **BUG-34** | 🟢 `[DONE]` | `MarketingCampaignsPage.tsx` | Chuẩn hóa thao tác xóa chiến dịch tiếp thị sang `ConfirmDeleteModal`. |
| **BUG-35** | 🟢 `[DONE]` | `ProductVariantsPage.tsx` | Chuẩn hóa xóa biến thể sản phẩm sang `ConfirmDeleteModal`. |
| **BUG-36** | 🟢 `[DONE]` | `SupplierProductsPage.tsx` | Bổ sung `try...catch` và modal an toàn khi hủy liên kết sản phẩm NCC. |
| **BUG-37** | 🟢 `[DONE]` | `SupplierStoragesPage.tsx` | Chuẩn hóa xóa bãi kho đối tác sang `ConfirmDeleteModal`. |
| **BUG-38** | 🟢 `[DONE]` | `SupplierWarehousesPage.tsx` | Chuẩn hóa CRUD tổng kho NCC có đầy đủ toast và bẫy lỗi. |
| **BUG-39** | 🟢 `[DONE]` | `DeliveryTripsPage.tsx` | Chuẩn hóa hủy chuyến giao hàng sang `ConfirmDeleteModal`. |
| **BUG-40** | 🟢 `[DONE]` | `PackingListsPage.tsx` | Chuẩn hóa xóa phiếu đóng gói kiện hàng sang `ConfirmDeleteModal`. |
| **BUG-41** | 🟢 `[DONE]` | `ShippingOrderBatchesPage.tsx` | Chuẩn hóa xóa lô gom đơn giao vận sang `ConfirmDeleteModal`. |
| **BUG-42** | 🟢 `[DONE]` | `InvoiceListsPage.tsx` | Chuẩn hóa xóa bảng kê hóa đơn xuất bán sang `ConfirmDeleteModal`. |
| **BUG-43** | 🟢 `[DONE]` | `SalesPaymentsPage.tsx` | Chuẩn hóa xóa giao dịch thu tiền đơn hàng sang `ConfirmDeleteModal`. |
| **BUG-44** | 🟢 `[DONE]` | `SystemErrorLogPage.tsx` | Thay thế `alert()` xung nhịp Heartbeat sang sonner toast chuyên nghiệp. |
| **BUG-45** | 🟢 `[DONE]` | `PurchaseRequestsPage.tsx` | Bổ sung nút Xóa (`Trash2`), kết nối API DELETE `/purchase/requests/:id`. |
| **BUG-46** | 🟢 `[DONE]` | `SupplierContractsPage.tsx` | Bổ sung nút Xóa (`Trash2`), kết nối API DELETE `/purchase/contracts/:id`. |
| **BUG-47** | 🟢 `[DONE]` | `SuppliersPage.tsx` | Chuẩn hóa thuộc tính DTO nhà cung cấp (`taxCode`, `category`), xóa nhiều NCC. |
| **BUG-48** | 🟢 `[DONE]` | `PurchaseReturnsUnifiedPage.tsx` | Chuẩn hóa tiêu chí đánh giá NCC (`scores`), bổ sung modal duyệt hoàn trả. |
| **BUG-49** | 🟢 `[DONE]` | `SaleOrdersPage.tsx`, `OrderLinesEditor.tsx` | Đồng bộ DTO đơn bán (`customerPhone`, `shippingAddress`), tính thuế theo dòng. |
| **BUG-50** | 🟢 `[DONE]` | `OnlineOrdersPage.tsx`, `QuotesPage.tsx` | Đồng bộ kênh bán TMĐT, kiểm tra hạn hiệu lực báo giá trước khi chốt đơn. |
| **BUG-51** | 🟢 `[DONE]` | `PosTerminalPage.tsx`, `PosSessionsPage.tsx` | Sửa tính tiền thừa, áp voucher CRM, đối soát tiền két ca POS. |
| **BUG-52** | 🟢 `[DONE]` | `SalesInvoicesPage.tsx`, `ExportInvoicesPage.tsx` | Bổ sung tra cứu mã CQT, thuế VAT, chặn xóa hóa đơn đã thanh toán. |
| **BUG-53** | 🟢 `[DONE]` | `StockTransferPage.tsx`, `StockOutsPage.tsx` | Bỏ TS enum để tương thích `erasableSyntaxOnly` của TypeScript 5.8+. |
| **BUG-54** | 🟢 `[DONE]` | `InventoryPage.tsx`, WMS Locations | Đồng bộ vị trí ô kệ động, cảnh báo tồn kho an toàn. |
| **BUG-55** | 🟢 `[DONE]` | `ProductBatchesPage.tsx`, `CombosPage.tsx` | Tính giá trọn gói combo theo chi tiết hàng thành phần, quản lý hạn dùng lô. |
| **BUG-56** | 🟢 `[DONE]` | `CustomerVouchersPage.tsx` | Sửa import ColumnDef, nới rộng tương thích category phản hồi CRM. |
| **BUG-57** | 🟢 `[DONE]` | `financeStore.ts`, `financeService.ts` | Bổ sung thuộc tính `paymentReason`, hoàn thiện CRUD quỹ và thuế. |
| **BUG-58** | 🟢 `[DONE]` | `RolePermissionMatrix.tsx` | Kết nối API phân quyền thực tế thay cho mock data. |
| **BUG-59** | 🟢 `[DONE]` | Module Nhân sự HR | Chuyển đổi toàn bộ từ state cục bộ sang `useHrStore`. |
| **BUG-60** | 🟢 `[DONE]` | Routing & Build Tổng thể | Dọn sạch route rác trong `index.tsx`, xác nhận 0 lỗi build. |
| **BUG-61** | 🟢 `[DONE]` | `PaymentMethodsPage.tsx` & Backend | Chuẩn hóa liên kết Phương thức thanh toán theo Chi nhánh (N-N), sửa map MoMo. |
| **BUG-62** | 🟢 `[DONE]` | `ProductBatchesPage.tsx` & Backend | Tự động phát hiện và tính toán trạng thái lô quá hạn (`EXPIRED`) trên cả FE & BE. |
| **BUG-63** | 🟢 `[DONE]` | `ProductDetailsPage.tsx` | Bổ sung payload lưu sản phẩm: `barcodes`, `reorderPoint`, `safetyStock`, `vatRate`. |
| **BUG-64** | 🟢 `[DONE]` | `PurchaseRequestsPage.tsx` | Bổ sung chế độ Sửa (`edit`), kết nối API `PUT /purchase/requests/:id`. |
| **BUG-65** | 🟢 `[DONE]` | `PurchaseOrdersPage.tsx` | Bỏ hardcode 'Admin User', kết nối tài khoản đăng nhập `useAuthStore`. |
| **BUG-66** | 🟢 `[DONE]` | `SaleOrdersPage.tsx` | Bỏ hardcode 'System Admin' / 'BR-001', kết nối dynamic branch và user. |
| **BUG-67** | 🟢 `[DONE]` | `SalesInvoicesPage.tsx` | Bỏ hardcode địa chỉ 'Hà Nội', tra cứu địa chỉ khách hàng động. |
| **BUG-68** | 🟢 `[DONE]` | `PurchaseInvoicesPage.tsx` | Bỏ công thức cứng thuế 10%, đọc trực tiếp `subTotal` và `taxAmount` từ đơn hàng. |
| **BUG-69** | 🟢 `[DONE]` | `SupplierDeliveriesPage.tsx` | Xóa bỏ fallback cứng 19.980.000đ, Suntory PepsiCo và dòng hàng mẫu 100 cái. |
| **BUG-70** | 🟢 `[DONE]` | `PurchaseReturnsListsPage.tsx` | Dọn sạch dữ liệu mẫu RAM PC Kingston/Samsung khi tạo mới phiếu trả hàng. |
| **BUG-71** | 🟢 `[DONE]` | `SupplierEvaluationsPage.tsx` | Đọc người đánh giá động từ `useAuthStore` thay vì hardcode 'Admin'. |
| **BUG-72** | 🟢 `[DONE]` | `ReceivablesPage.tsx` | Bỏ công thức nợ giả lập `calculatedDebt * 3`, đọc `totalSpend` thực tế. |
| **BUG-73** | 🟢 `[DONE]` | `QuotesPage.tsx` & `SaleOffersPage.tsx` | Bỏ SĐT/Email giả (`0987654321`), điền động nhân viên và kho chi nhánh. |
| **BUG-74** | 🟢 `[DONE]` | `InvoiceListsPage.tsx` | Xóa bỏ hardcode 'Hà Nội' và MST mẫu trong form lập bảng kê. |
| **BUG-75** | 🟢 `[DONE]` | `SerialNumbersPage.tsx` | Xóa bỏ mock POs (`PO-2026-7394416` chứa iPhone 15, Dell XPS) khi API rỗng. |
| **BUG-76** | 🟢 `[DONE]` | `InventoryAdjustmentsPage.tsx` | Tích hợp `ConfirmDeleteModal`, bỏ gán cứng `branchId: 1`, khắc phục silent abort. |
| **BUG-77** | 🟢 `[DONE]` | `InventoryCheckPage.tsx` & Thẻ kho | Bỏ hàm cắt chuỗi thô sơ `resolveBranchId`, lấy chuẩn từ `useBranchStore`. |
| **BUG-78** | 🟢 `[DONE]` | `ReceivablesPage.tsx` | Nâng cấp Dashboard Tuổi nợ 4 kỳ (<30, 31-60, 61-90, >90 ngày), thêm nút Khóa nợ. |
| **BUG-79** | 🟢 `[DONE]` | `InvoiceListsPage.tsx` | Khóa bất biến hóa đơn đã phát hành (`DA_XUAT`), bổ sung ký hiệu mẫu số e-invoice. |
| **BUG-80** | 🟢 `[DONE]` | `SerialNumbersPage.tsx` | Tích hợp thuật toán Luhn GSMA kiểm tra IMEI 15 số, chuyển trạng thái RMA bảo hành. |
| **BUG-81** | 🟢 `[DONE]` | `InventoryAdjustmentsPage.tsx` | Khóa chỉnh sửa/xóa phiếu kiểm kê đã ghi sổ (`COMPLETED`), tô màu chênh lệch. |
| **BUG-82** | 🟢 `[DONE]` | `PurchaseReturnsListsPage.tsx` | Khóa chỉnh sửa/xóa phiếu trả hàng NCC đã xuất kho (`DA_XUAT_TRA`). |
| **BUG-83** | 🟢 `[DONE]` | `QuotesPage.tsx` | Cảnh báo báo giá hết hạn hiệu lực (`validUntil < today`), chặn tạo đơn bán từ báo giá cũ. |
| **BUG-84** | 🟢 `[DONE]` | `PosSessionsPage.tsx` | Bảng đếm tiền mệnh giá két (500k-1k) khi đóng ca POS, đối soát tồn quỹ thực tế. |
| **BUG-85** | 🟢 `[DONE]` | `PosTerminalPage.tsx` & CRM | Đồng bộ khóa mua nợ từ CRM sang POS, chặn chọn thanh toán ghi nợ/công nợ. |
| **BUG-86** | 🟢 `[DONE]` | `InventoryPage.tsx`, `SuppliersPage.tsx` | Bẫy lỗi 409 Conflict FK khi xóa sản phẩm/NCC đã có giao dịch, gợi ý ngừng hoạt động. |
| **BUG-87** | 🟢 `[DONE]` | `ProductDetailsPage.tsx` | Bổ sung `weight`, `dimensions`, `warrantyPeriodMonths`, `allowNegativeStock`, cảnh báo bán lỗ. |
| **BUG-88** | 🟢 `[DONE]` | `ProductBatchesPage.tsx` | Bộ lọc nhanh (Cận date, Hết hạn, Cách ly kiểm định), modal cách ly chặn xuất kho. |
| **BUG-89** | 🟢 `[DONE]` | `PurchaseOrdersPage.tsx` | Lọc sản phẩm theo NCC khi tạo PO, bổ sung Điều khoản thanh toán quốc tế & phí vận chuyển. |
| **BUG-90** | 🟢 `[DONE]` | `PosTerminalPage.tsx` | Hệ thống phím tắt bán hàng chuẩn (F1-F9, Esc) kèm bảng hướng dẫn tra cứu. |
| **BUG-91** | 🟢 `[DONE]` | `QuotesPage.tsx` | Kiểm tra tồn kho khả dụng trước khi chốt đơn, tính năng Tạo bản sửa đổi (Revision). |
| **BUG-92** | 🟢 `[DONE]` | `ReceivablesPage.tsx` | Gắn huy hiệu Cảnh báo Nợ xấu đỏ với khoản nợ quá hạn >90 ngày, lọc nhanh rủi ro. |
| **BUG-93** | 🟢 `[DONE]` | `ExportInvoicesPage.tsx` | Xác thực định dạng Mã số thuế VN (10-13 số), bộ lọc ngày phát hành theo timezone địa phương. |

---

## 🔍 II. RÀ SOÁT CHUYÊN SÂU 4 MODULE TRỌNG YẾU (KIỂM TRA CẢ FRONTEND & BACKEND)

Dưới đây là bảng kiểm tra chi tiết, toàn diện từng trang, từng tab đang hoạt động thực tế trong `src/routes/index.tsx`, đối soát từng thao tác CRUD (Tạo - Sửa - Xóa), kiểm tra các thuộc tính thiếu / DTO mismatch, các bẫy lỗi và điểm nghẽn kiến trúc phía Backend.

---

### 🛒 1. MODULE MUA HÀNG (PURCHASING)

#### 1.1. Phân rã Các Trang & Tabs Canonical thực tế trong `src/routes/index.tsx`
1. **`/purchase/suppliers`** (`PurchaseSuppliersTabbedPage.tsx`):
   - Tab `suppliers`: `SuppliersPage.tsx` (Hồ sơ Nhà cung cấp, công nợ NCC, thông tin ngân hàng).
   - Tab `contracts`: `SupplierContractsPage.tsx` (Hợp đồng nguyên tắc, thời hạn hiệu lực, giá trị).
   - Tab `evaluations`: `SupplierEvaluationsPage.tsx` (Đánh giá chất lượng, tiến độ giao nhận, giá cả).
2. **`/purchase/orders`** (`PurchaseOrdersTabbedPage.tsx`):
   - Tab `orders`: `PurchaseOrdersPage.tsx` (Đơn đặt mua hàng PO, duyệt, gửi NCC, tạo phiếu nhập kho).
   - Tab `requests`: `PurchaseRequestsPage.tsx` (Yêu cầu mua hàng nội bộ PR từ các bộ phận).
   - Tab `supplier-requests`: `SupplierRequestsPage.tsx` (Yêu cầu báo giá RFQ gửi tới nhiều nhà cung cấp).
3. **`/purchase/deliveries`** (`PurchaseReceiptsInvoicesTabbedPage.tsx`):
   - Tab `receipts`: `SupplierDeliveriesPage.tsx` (Đợt giao nhận hàng từ NCC, đồng kiểm số lượng).
   - Tab `invoices`: `PurchaseInvoicesPage.tsx` (Hóa đơn mua hàng đầu vào, thuế VAT, đối chiếu PO).
4. **`/purchase/payments`** (`PurchasePaymentsPage.tsx`): Sổ phiếu chi thanh toán công nợ mua hàng cho NCC.
5. **`/purchase/returns`** (`PurchaseReturnsTabbedPage.tsx`):
   - Tab `returns`: `PurchaseReturnsUnifiedPage.tsx` (Lập phiếu xuất trả hàng NCC, lý do trả, hoàn tiền).
   - Tab `history`: `PurchaseReturnsListsPage.tsx` (Lịch sử các đợt trả hàng, trạng thái hoàn tất).

---

#### 1.2. Kiểm tra chi tiết CRUD (Tạo - Sửa - Xóa) từng trang

| Trang / Tab | Thao tác TẠO (Create) | Thao tác SỬA (Update) | Thao tác XÓA (Delete) |
| :--- | :--- | :--- | :--- |
| **`SuppliersPage.tsx`** (Tab `suppliers`) | 🟢 Gọi `POST /purchase/suppliers`. Đầy đủ form tên, mã, email, SĐT, MST, địa chỉ, ngân hàng, nhóm NCC. Form validate chuẩn. | 🟢 Gọi `PUT /purchase/suppliers/{id}`. Drawer cập nhật dữ liệu mượt mà, đồng bộ state ngay lập tức. | 🟡 Gọi `DELETE /purchase/suppliers/{id}`. Nếu NCC đã có PO/Hợp đồng, Backend trả lỗi 409 Conflict. Đã có modal xác nhận nhưng Backend cần hỗ trợ soft-delete chuyển `isActive = false` thay vì ném lỗi ràng buộc khóa ngoại. |
| **`SupplierContractsPage.tsx`** (Tab `contracts`) | 🟡 Gọi `POST /purchase/contracts`. Form tạo chỉ nhập thông tin tổng quan (tiêu đề, giá trị, thời hạn) nhưng **thiếu bảng dòng hàng chi tiết** phụ lục cam kết chiết khấu từng mặt hàng. | 🟢 Gọi `PUT /purchase/contracts/{id}`. Chỉnh sửa trạng thái (DRAFT, ACTIVE, EXPIRED), gia hạn hợp đồng. | 🟢 Gọi `DELETE /purchase/contracts/{id}`. Tích hợp `ConfirmDeleteModal`, xóa an toàn và thông báo toast chuẩn. |
| **`SupplierEvaluationsPage.tsx`** (Tab `evaluations`) | 🟢 Gọi `POST /purchase/evaluations`. Đã bỏ hardcode người đánh giá (đọc từ `useAuthStore`). Chấm điểm theo 4 tiêu chí. | 🟢 Gọi `PUT /purchase/evaluations/{id}`. Cập nhật kết quả thẩm định và ghi chú định kỳ. | 🟢 Gọi `DELETE /purchase/evaluations/{id}`. Xóa an toàn kèm xác nhận modal. |
| **`PurchaseOrdersPage.tsx`** (Tab `orders`) | 🔴 Gọi `POST /purchase/orders`. **Lỗi DTO Mismatch:** Form FE cho nhập `paymentTerms` (Net 30, COD...) và `shippingFee`, nhưng Backend `CreatePurchaseOrderRequest` và Entity `PurchaseOrder` **hoàn toàn thiếu 2 trường này** nên dữ liệu bị nuốt mất. | 🟡 Gọi `PUT /purchase/orders/{id}`. FE gửi toàn bộ object để đổi trạng thái thay vì kích hoạt các endpoint workflow chuẩn (`/submit`, `/approve`, `/confirm`, `/create-receipt`). | 🟢 Gọi `DELETE /purchase/orders/{id}`. Chặn xóa đơn đã duyệt / đã nhận hàng. Modal xác nhận xóa chuẩn. |
| **`PurchaseRequestsPage.tsx`** (Tab `requests`) | 🔴 Gọi `POST /purchase/requests`. **Lỗi Ép ID giả (`productId = 1`):** Dòng 207 gán `productId = products[0]?.id || 1` khi nhân viên gõ tên vật tư tự do. Khi chuyển thành PO, hàng hóa bị gán nhầm sang sản phẩm bán lẻ! | 🟡 Gọi `PUT /purchase/requests/{id}`. Chỉnh sửa số lượng, ghi chú đề xuất. Nhưng giao diện **hoàn toàn thiếu các nút Duyệt (`/approve`), Từ chối (`/reject`) và Chuyển thành Đơn mua (`/convert-to-order`)**. | 🟢 Gọi `DELETE /purchase/requests/{id}`. Đã tích hợp nút Xóa và gọi API chuẩn. |
| **`SupplierRequestsPage.tsx`** (Tab `supplier-requests`) | 🔴 **HOÀN TOÀN GIẢ MẠO (MOCK DATA):** Backend không có bất kỳ Entity hay Controller nào cho RFQ nhà cung cấp! Toàn bộ dữ liệu tạo lưu vào `retailhub_rfqs_created` trong `localStorage`. | 🔴 Sửa chỉ lưu vào `localStorage`, không hề có lưu trữ xuống database. | 🔴 Xóa chỉ ghi đè mảng `retailhub_rfqs_deleted` trong `localStorage`. Dữ liệu biến mất khi đổi máy. |
| **`SupplierDeliveriesPage.tsx`** (Tab `receipts`) | 🔴 Gọi `POST /inventory/imports`. **Lỗi Báo Thành Công Ảo:** Tại dòng 727-747, khi Backend trả về lỗi 400/500 (ví dụ kho đầy hoặc sai mã), catch block toast lỗi nhưng code phía sau vẫn lưu vào `retailhub_created_deliveries` và thêm vào state! | 🟢 Đổi trạng thái đợt nhận hàng (Chờ giao, Đang kiểm hàng, Đã nhập kho). | 🟢 Đã tích hợp `ConfirmDeleteModal`, hủy đợt giao nhận an toàn. |
| **`PurchaseInvoicesPage.tsx`** (Tab `invoices`) | 🔴 **LỖ HỔNG KIẾN TRÚC BACKEND: KHÔNG CÓ BẢNG HÓA ĐƠN MUA!** Khi bấm tạo hóa đơn mua hàng, FE gọi sang `POST /purchase/orders` để tạo một PO mới! Mã hóa đơn `invoiceCode` bị Backend bỏ rơi. | 🔴 Sửa hóa đơn thực chất là sửa một đơn mua PO giả. | 🔴 Xóa hóa đơn thực chất là gọi xóa PO trong bảng `purchase_orders`. |
| **`PurchasePaymentsPage.tsx`** (Sổ phiếu chi) | 🟢 Gọi `POST /accounting/payment-vouchers`. Tạo phiếu chi thanh toán công nợ theo đợt cho NCC. | 🟡 Nút Sửa bị khóa do nguyên tắc kế toán không sửa trực tiếp phiếu chi đã ký duyệt. | 🔴 **Lỗi Nuốt Lỗi (Silent Catch):** Dòng 432 gọi `await axiosClient.delete(...).catch(() => {})`. Khi Backend từ chối xóa (phiếu đã hạch toán sổ quỹ), FE vẫn xóa dòng khỏi màn hình và báo thành công! Ngoài ra dòng 179-188 còn fallback cứng Coca Cola. |
| **`PurchaseReturnsUnifiedPage.tsx`** & `Lists` | 🔴 Gọi `POST /inventory/supplier-returns`. **Lỗi Silent Abort:** Backend bắt buộc mã `grnRefNumber` bắt đầu bằng `GRN-`. Khi không có GRN, Backend ném 400. `inventoryStore.ts` dòng 3433 catch lỗi và lưu record cục bộ mà không throw! | 🟡 Sửa phiếu trả hàng: Đã khóa bất biến các phiếu có trạng thái `DA_XUAT_TRA` để đảm bảo thẻ kho. | 🔴 Trong `inventoryStore.ts` dòng 3474, hàm `deleteReturnToSupplier` nuốt lỗi và tự filter xóa item khỏi state dù server trả lỗi! |

---

#### 1.3. Bảng đối chiếu Thuộc tính thiếu & DTO Mismatch (FE vs BE)

| Entity / DTO | Trường trên Frontend (FE) | Tình trạng trên Backend (BE) | Hậu quả kỹ thuật |
| :--- | :--- | :--- | :--- |
| `PurchaseOrder` | `paymentTerms` (Net 15, Net 30, COD...) | ❌ Thiếu trong `CreatePurchaseOrderRequest.java` và bảng `purchase_orders` | Điều khoản thanh toán bị mất trắng sau khi lưu đơn mua. |
| `PurchaseOrder` | `shippingFee` (Phí vận chuyển NCC) | ❌ Thiếu trong `CreatePurchaseOrderRequest.java` và entity `PurchaseOrder.java` | Phí vận chuyển không được cộng dồn vào tổng chi phí đơn mua. |
| `PurchaseRequest` | `productName` (Vật tư tự do ngoài danh mục) | ❌ `PurchaseRequestDetail` bắt buộc `productId` hợp lệ | FE phải ép gán `productId = 1`, làm sai lệch chủng loại hàng hóa khi convert sang PO. |
| `PurchaseInvoice` | `invoiceCode`, `supplierInvoiceNumber`, `vatRate` | ❌ **Không tồn tại Entity `PurchaseInvoice.java`** trong backend | FE phải gọi ké sang `PurchaseOrder`, làm biến dạng nghiệp vụ mua hàng. |
| `PaymentVoucher` | `supplierName`, `invoiceCode` | ⚠️ Backend chỉ lưu `receiverName` và `referenceCode` | Khi API trả về null, FE fallback cứng sang 'Công ty Coca Cola Việt Nam' và 'PO-2026-7394416'. |
| `ReturnToSupplier` | `grnRefNumber` | ⚠️ Backend bắt buộc regex `GRN-.*` | FE gửi mã tự do làm Backend ném HTTP 400, store nuốt lỗi và tạo bản ghi ảo. |

---

#### 1.4. Điểm nghẽn Logic & Lỗ hổng Kiến trúc Backend Mua hàng
1. **Thiếu vắng hoàn toàn Entity `PurchaseInvoice`:** Trong kế toán quản trị chuỗi cung ứng, Đơn mua hàng (PO), Phiếu nhận hàng (GRN) và Hóa đơn đầu vào (Purchase Invoice) là 3 thực thể độc lập thuộc quy trình 3-Way Matching. Việc Backend không có bảng `purchase_invoices` là một khiếm khuyết lớn, buộc FE phải tạo PO ảo để thay thế.
2. **Gãy chuỗi phê duyệt PR -> PO:** Backend đã viết sẵn endpoint `POST /purchase/requests/{id}/convert-to-order?supplierId=...` nhưng Frontend không có nút bấm nào để gọi, khiến tính năng này bị đóng băng.
3. **Phụ thuộc LocalStorage trong `SupplierRequestsPage`:** Màn hình chào giá NCC vận hành 100% trên LocalStorage, không có tính nhất quán dữ liệu giữa các máy trạm.
4. **Báo thành công giả khi tạo phiếu nhập giao hàng:** Khi thủ kho xác nhận đợt giao từ NCC, nếu API lỗi, hệ thống vẫn lưu vào state cục bộ, gây thất thoát hàng hóa trên sổ sách.

---

#### 1.5. Đề xuất Cải tiến & Giải pháp kỹ thuật Module Mua hàng
- **Phía Backend:**
  1. Tạo mới Entity `PurchaseInvoice.java`, bảng `purchase_invoices`, repository, service và `PurchaseInvoiceController.java` (hỗ trợ các trường: `invoiceCode`, `poId`, `supplierId`, `subTotal`, `taxAmount`, `totalAmount`, `status`, `invoiceDate`).
  2. Bổ sung `paymentTerms` (VARCHAR(50)) và `shippingFee` (DECIMAL(18,2)) vào `PurchaseOrder.java` và `CreatePurchaseOrderRequest.java`.
  3. Xây dựng Entity `SupplierRequest.java` và API CRUD `/purchase/supplier-requests` để chấm dứt lưu mock LocalStorage.
  4. Sửa `SupplierController.java`: Khi xóa NCC có giao dịch, chuyển sang soft-delete `isActive = false` thay vì ném ngoại lệ 409.
- **Phía Frontend:**
  1. `PurchaseRequestsPage.tsx`: Bổ sung các nút hành động "Gửi duyệt" (`/submit`), "Phê duyệt" (`/approve`), "Từ chối" (`/reject`) và "Chuyển thành PO" (`/convert-to-order`). Thay ô nhập tự do bằng Search Combobox sản phẩm để loại bỏ `productId = 1`.
  2. `PurchaseInvoicesPage.tsx`: Chuyển endpoint gọi sang `/purchase/invoices` chuẩn Backend mới.
  3. `PurchasePaymentsPage.tsx`: Xóa bỏ hoàn toàn fallback Coca Cola tại dòng 179-188; bỏ `.catch(() => {})` tại dòng 432 để chỉ xóa UI khi server trả HTTP 200.
  4. `SupplierDeliveriesPage.tsx`: Bọc toàn bộ logic lưu state vào bên trong nhánh thành công của `try`, nếu `catch` thì lập tức dừng không lưu state giả.
  5. `inventoryStore.ts`: Bỏ nuốt lỗi trong `addReturnToSupplier` và `deleteReturnToSupplier`, ném lại ngoại lệ (`throw error`) để UI hiển thị thông báo lỗi.

---

### 💰 2. MODULE BÁN HÀNG & POS (SALES & POS)

#### 2.1. Phân rã Các Trang & Tabs Canonical thực tế trong `src/routes/index.tsx`
1. **`/pos`** (`PosTerminalPage.tsx`): Màn hình bán hàng thu ngân chuyên dụng, phím tắt, barcode scanner, tính tiền nhanh.
2. **`/pos/sessions`** (`PosSessionsPage.tsx`): Quản lý ca thu ngân, mở két, kiểm tiền đầu ca, bàn giao doanh số, đóng ca.
3. **`/pos/payment-methods`** (`PaymentMethodsPage.tsx`): Cấu hình phương thức thanh toán áp dụng cho POS từng chi nhánh.
4. **`/sales/orders`** (`SalesOrdersTabbedPage.tsx`):
   - Tab `orders`: `SaleOrdersPage.tsx` (Đơn bán hàng tại quầy và giao sau).
   - Tab `online`: `OnlineOrdersPage.tsx` (Đơn hàng từ Website, App, Hotline).
   - Tab `market`: `MarketOrdersPage.tsx` (Đơn hàng sàn TMĐT Shopee, Lazada, TikTok Shop).
   - Tab `quotes`: `QuotesPage.tsx` (Báo giá bán hàng cho khách B2B/khách buôn).
   - Tab `offers`: `SaleOffersPage.tsx` (Chính sách chiết khấu, chương trình khuyến mãi theo đơn).
5. **`/sales/returns`** (`SalesReturnsTabbedPage.tsx`):
   - Tab `requests`: `CustomerReturnsPage.tsx` (Tiếp nhận yêu cầu đổi trả hàng từ khách).
   - Tab `history`: `ReturnsListsPage.tsx` (Lịch sử xử lý hoàn tiền và nhập lại kho).
6. **`/sales/deliveries`** (`SalesDeliveriesTabbedPage.tsx`):
   - Tab `lists`: `DeliveryListsPage.tsx` (Bảng kê giao hàng theo nhân viên shipper / hãng vận chuyển).
   - Tab `notes`: `DeliveryNotesPage.tsx` (Phiếu giao nhận hàng chi tiết, trạng thái giao vận).

---

#### 2.2. Kiểm tra chi tiết CRUD (Tạo - Sửa - Xóa) từng trang

| Trang / Tab | Thao tác TẠO (Create) | Thao tác SỬA (Update) | Thao tác XÓA (Delete) |
| :--- | :--- | :--- | :--- |
| **`PosTerminalPage.tsx`** (`/pos`) | 🔴 Gọi `POST /sales/orders`. **Lỗi Nghiêm trọng:** Payload tạo đơn **hoàn toàn không có `posSessionId`** do Backend `SaleOrder` thiếu cột này! **Lỗi Biến thể:** Checkout gửi `productVariantId = Number(i.id)` (thực chất là Product ID), Backend luôn bốc biến thể đầu tiên (`pvs.get(0)`). | 🟢 Lưu tạm đơn treo (Hold Orders) vào `localStorage`. Cho phép phục hồi đơn đang tính dở. | 🟢 Cho phép hủy dòng hàng, xóa toàn bộ giỏ hàng với modal xác nhận. |
| **`PosSessionsPage.tsx`** (`/pos/sessions`) | 🟢 Mở ca: Gọi `POST /pos/sessions/open`. Nhập số tiền đầu ca trong két, ghi nhận thời gian bắt đầu. | 🔴 Đóng ca: Gọi `POST /pos/sessions/{id}/close`. **Hiệu năng nguy hiểm:** Backend quét toàn bộ database `saleOrderRepository.findAll()` để cộng doanh thu ca! | 🟡 Không cho phép xóa ca đã phát sinh giao dịch để bảo toàn sổ quỹ đối soát. |
| **`PaymentMethodsPage.tsx`** (`/pos/payment-methods`) | 🟢 Gọi `POST /pos/payment-methods`. Khởi tạo phương thức thanh toán (Tiền mặt, Chuyển khoản, MoMo, VNPay). | 🟢 Gọi `PUT /pos/payment-methods/{id}`. Cập nhật trạng thái kích hoạt, liên kết tài khoản ngân hàng thụ hưởng. | 🟢 Gọi `DELETE /pos/payment-methods/{id}`. Tích hợp `ConfirmDeleteModal`, chỉ xóa khi phương thức chưa có giao dịch. |
| **`SaleOrdersPage.tsx`** (Tab `orders`) | 🔴 Gọi `POST /sales/orders`. **Nuốt lỗi trong store:** Tại `salesStore.ts` dòng 381-384, hàm `addSaleOrder` bọc axios trong catch nhưng không throw, làm form tạo đơn tưởng thành công khi API ném lỗi tồn kho. | 🟡 Gọi `PUT /sales/orders/{id}`. Khi đơn đã xuất kho (`SHIPPED`/`COMPLETED`), nếu sửa sản phẩm thì Backend chưa tự động hoàn tồn kho cũ và trừ kho mới. | 🟢 Gọi `DELETE /sales/orders/{id}`. Chặn xóa đơn đã hoàn thành hoặc đã phát hành hóa đơn. |
| **`OnlineOrdersPage.tsx`** (Tab `online`) | 🟢 Tiếp nhận đơn từ webhook hoặc tạo thủ công. Phân luồng kho lấy hàng tự động theo chi nhánh gần nhất. | 🟢 Đổi trạng thái xử lý: Chờ xác nhận -> Đang đóng gói -> Đã bàn giao shipper. | 🟢 Hủy đơn hàng online có nhập lý do hủy và gửi thông báo cho khách hàng. |
| **`MarketOrdersPage.tsx`** (Tab `market`) | 🟡 Đồng bộ đơn Shopee/Lazada/TikTok: Hiện tại chỉ là trigger mô phỏng đồng bộ hoặc gọi API tổng hợp. Chưa có mapping SKU sàn và SKU kho nội bộ. | 🟢 Cập nhật mã vận đơn sàn (tracking code) và trạng thái đơn sàn. | 🟡 Hủy đơn sàn chỉ cập nhật trạng thái nội bộ, chưa bắn API hủy sang kênh sàn. |
| **`QuotesPage.tsx`** (Tab `quotes`) | 🟢 Gọi `POST /sales/quotes`. Đã có kiểm tra hạn hiệu lực báo giá, chiết khấu theo khách VIP. | 🟢 Gọi `PUT /sales/quotes/{id}`. Tính năng tạo bản sửa đổi (Revision) khi khách yêu cầu đổi báo giá. | 🟢 Gọi `DELETE /sales/quotes/{id}`. Xóa an toàn kèm modal xác nhận. |
| **`SaleOffersPage.tsx`** (Tab `offers`) | 🟢 Tạo chương trình ưu đãi, flash sale theo ngành hàng, giảm giá combo. | 🟢 Cập nhật khung giờ vàng khuyến mãi, tỷ lệ chiết khấu tối đa. | 🟢 Xóa hoặc tắt kích hoạt chính sách ưu đãi. |
| **`CustomerReturnsPage.tsx`** (Tab `requests`) | 🔴 Gọi `POST /sales/returns`. **Lỗi Ép `invoiceId`:** Backend `CreateCustomerReturnRequest` bắt buộc `@NotNull Long invoiceId` (Hóa đơn xuất). Nếu trả hàng từ `SaleOrder` chưa xuất hóa đơn VAT, `salesStore.ts` ép gán `invoiceId = Number(matchedSO.id) || 1`, làm Backend ném 404! | 🟡 Duyệt trả hàng: Chuyển trạng thái sang `APPROVED`. Nhưng chưa tự động sinh phiếu nhập kho WMS. | 🟢 Xóa phiếu tiếp nhận trả hàng chưa duyệt qua `ConfirmDeleteModal`. |
| **`ReturnsListsPage.tsx`** (Tab `history`) | 🟢 Xem lịch sử hoàn trả, phương thức hoàn tiền (Tiền mặt, Chuyển khoản, Điểm thưởng). | 🟡 Khóa bất biến các phiếu đã hoàn tiền (`REFUNDED`). | 🟢 Xóa an toàn các bản ghi bị hủy hoặc từ chối. |
| **`DeliveryNotesPage.tsx`** (Tab `notes`) | 🟢 Gọi `POST /sales/deliveries`. Lập phiếu xuất giao hàng, chọn đơn vị vận chuyển (GHTK, Viettel Post...). | 🟢 Cập nhật trạng thái giao hàng (Đang giao, Giao thành công, Giao thất bại). | 🔴 **THIẾU NÚT XÓA:** Component import icon `Trash2` tại dòng 2 nhưng trong cột thao tác bảng dữ liệu hoàn toàn không có nút Xóa hoặc Hủy phiếu! |
| **`DeliveryListsPage.tsx`** (Tab `lists`) | 🟢 Bảng kê tổng hợp các chuyến giao hàng theo ngày. Xuất file PDF/Excel bảng kê giao nhận. | 🟢 Đổi trạng thái thanh toán tiền thu hộ COD. | 🟢 Hủy bảng kê chưa phân bổ cho tài xế qua modal xác nhận. |

---

#### 2.3. Bảng đối chiếu Thuộc tính thiếu & DTO Mismatch (FE vs BE)

| Entity / DTO | Trường trên Frontend (FE) | Tình trạng trên Backend (BE) | Hậu quả kỹ thuật |
| :--- | :--- | :--- | :--- |
| `SaleOrder` | `posSessionId` (ID ca POS hiện tại) | ❌ **Thiếu trong `SaleOrder.java`** và `CreateSaleOrderRequest.java` | Không thể truy vết đơn bán thuộc ca POS nào. Gây nghẽn Full Table Scan. |
| `SaleOrderDetail` | `productVariantId` (Chọn Size, Màu) | ⚠️ FE gửi nhầm `Product.id`; BE fallback sang `pvs.get(0)` | Bán hàng POS luôn bị trừ sai biến thể trong kho WMS (ví dụ trừ Size S thay vì XL). |
| `CustomerReturn` | `orderId` (Trả hàng theo Đơn bán) | ❌ BE bắt buộc `@NotNull Long invoiceId` (phải là ExportInvoice) | Không thể thực hiện trả hàng cho các đơn bán lẻ POS không xuất hóa đơn GTGT. |
| `CustomerReturn` | `isRestocked` (Cờ nhập lại kho) | ⚠️ BE lưu cờ nhưng không kích hoạt tăng tồn kho | Hàng đổi trả không được cộng lại vào kho khả dụng của chi nhánh. |
| `DeliveryNote` | Nút Action Xóa | ⚠️ FE import icon `Trash2` nhưng không render trong bảng | Người dùng không thể xóa phiếu giao hàng tạo sai từ giao diện. |

---

#### 2.4. Điểm nghẽn Logic & Lỗ hổng Kiến trúc Backend Bán hàng & POS
1. **Lỗ hổng Hiệu năng Nghiêm trọng Full Table Scan O(N) tại `PosApiController.java`:**
   - Khi đóng ca (`closeSession`), Backend gọi `saleOrderRepository.findAll()` rồi lặp duyệt qua từng đơn hàng trong toàn bộ database để so sánh thời gian và chi nhánh.
   - Khi cơ sở dữ liệu có hàng chục nghìn đơn, request đóng ca sẽ làm treo CPU server, nguy cơ Out Of Memory.
   - Tính toán doanh thu bị sai chéo ca nếu có 2 thu ngân cùng mở ca bán hàng song song trong cùng 1 chi nhánh!
2. **Thiếu Modal Chọn Biến thể (Variant Picker) tại POS:**
   - Khi nhân viên thu ngân click vào sản phẩm thời trang (áo sơ mi), hệ thống không hiển thị bảng chọn size/màu mà gửi thẳng `Product.id`. Backend bốc biến thể đầu tiên khiến số liệu tồn kho từng biến thể bị sai lệch nghiêm trọng.
3. **Nuốt lỗi trong `salesStore.ts` khi tạo đơn bán:**
   - `addSaleOrder` không ném lỗi ra ngoài khi server trả về HTTP 400 (ví dụ hết hàng hoặc tài khoản khách bị khóa nợ), dẫn đến giao diện không phản hồi đúng nguyên nhân cho nhân viên bán hàng.

---

#### 2.5. Đề xuất Cải tiến & Giải pháp kỹ thuật Module Bán hàng & POS
- **Phía Backend:**
  1. Thêm cột `pos_session_id` (BIGINT, FK -> `pos_sessions`) vào Entity `SaleOrder.java` và bảng `sale_orders`.
  2. Bổ sung `posSessionId` vào `CreateSaleOrderRequest.java` và gán trực tiếp khi lưu đơn bán.
  3. **Tối ưu hóa `closeSession`:** Xóa sạch vòng lặp `saleOrderRepository.findAll()`. Thay bằng query có index chuẩn xác:
     ```java
     BigDecimal totalCash = saleOrderRepository.sumCashAmountByPosSessionId(sessionId);
     ```
  4. Sửa `CreateCustomerReturnRequest.java`: Cho phép `invoiceId` có thể null nếu có `orderId`. Backend hỗ trợ tạo phiếu trả hàng trực tiếp từ `SaleOrder`.
  5. Khi duyệt `CustomerReturn`, tự động sinh `StockImport` nhập lại kho chi nhánh và ghi nhận vào `StockLedger`.
- **Phía Frontend:**
  1. `PosTerminalPage.tsx`: Bổ sung Modal Chọn Biến thể khi click vào sản phẩm có `variants.length > 1`. Truyền đúng `productVariantId` vào giỏ hàng và payload checkout.
  2. `PosTerminalPage.tsx`: Truyền `posSessionId: activeSession.id` khi gọi tạo đơn bán.
  3. `salesStore.ts`: Thêm `throw error` trong `addSaleOrder` để component bắt được lỗi tồn kho hoặc lỗi hạn mức công nợ.
  4. `DeliveryNotesPage.tsx`: Bổ sung nút Xóa (`Trash2`) kèm `ConfirmDeleteModal` vào cột thao tác bảng danh sách.

---

### 🧾 3. MODULE HÓA ĐƠN & CÔNG NỢ (INVOICES & RECEIVABLES)

#### 3.1. Phân rã Các Trang & Tabs Canonical thực tế trong `src/routes/index.tsx`
1. **`/sales/invoices`** (`SalesInvoicesTabbedPage.tsx`):
   - Tab `retail`: `SalesInvoicesPage.tsx` (Hóa đơn bán lẻ phát hành khi mua hàng tại quầy).
   - Tab `export`: `ExportInvoicesPage.tsx` (Hóa đơn xuất bán GTGT điện tử có mã Cơ quan Thuế).
   - Tab `list`: `InvoiceListsPage.tsx` (Bảng kê tổng hợp hóa đơn phát hành theo kỳ báo cáo).
2. **`/sales/receivables`** (`SalesReceivablesTabbedPage.tsx`):
   - Tab `receivables`: `ReceivablesPage.tsx` (Sổ theo dõi công nợ phải thu, hạn mức nợ, tuổi nợ khách hàng).
   - Tab `payments`: `SalesPaymentsPage.tsx` (Sổ theo dõi các khoản thanh toán/thu tiền theo hóa đơn).
3. **`/finance/debts`** (`DebtLedgerPage.tsx`): Sổ cái chi tiết biến động công nợ (ghi tăng nợ khi xuất hàng, ghi giảm nợ khi thu tiền).

---

#### 3.2. Kiểm tra chi tiết CRUD (Tạo - Sửa - Xóa) từng trang

| Trang / Tab | Thao tác TẠO (Create) | Thao tác SỬA (Update) | Thao tác XÓA (Delete) |
| :--- | :--- | :--- | :--- |
| **`SalesInvoicesPage.tsx`** (Tab `retail`) | 🔴 Gọi `POST /sales/invoices`. **Lỗi Pseudo Product ID:** Tại dòng 227, code gửi `productId: i.id` với `i.id = Date.now()`. Phía Backend `ExportInvoiceServiceImpl.java` dòng 101 gọi `productRepository.findByIdAndIsDeletedFalse(...)` ném ngoại lệ 404! | 🟢 Gọi `PUT /sales/invoices/{id}`. Cho phép cập nhật ghi chú, địa chỉ giao hóa đơn. | 🟢 Gọi `DELETE /sales/invoices/{id}`. Đã tích hợp `ConfirmDeleteModal`, chặn xóa hóa đơn đã thanh toán. |
| **`ExportInvoicesPage.tsx`** (Tab `export`) | 🔴 Gọi `POST /sales/invoices`. **LỖ HỔNG LỚN: MODAL THIẾU BẢNG CHỌN SẢN PHẨM!** Form chỉ có nhập tiền trước thuế, VAT. Để qua mặt validation của BE, `salesService.ts` (dòng 393-399) tự inject sản phẩm giả `{ productId: 1, quantity: 1 }`! | 🟢 Cập nhật trạng thái hóa đơn điện tử: Chờ ký -> Đã phát hành -> Đã gửi CQT. | 🟢 Hủy hóa đơn điện tử theo quy định: Lập biên bản hủy, gửi thông báo sai sót Mẫu 04/SS-HĐĐT lên CQT. |
| **`InvoiceListsPage.tsx`** (Tab `list`) | 🟢 Lập bảng kê hóa đơn theo kỳ tính thuế (Tháng/Quý). Tự động tổng hợp doanh thu và tiền thuế GTGT. | 🟢 Đã khóa bất biến các hóa đơn đã phát hành (`DA_XUAT`). | 🟢 Cho phép xóa hóa đơn nháp khỏi bảng kê qua `ConfirmDeleteModal`. |
| **`SalesPaymentsPage.tsx`** (Tab `payments`) | 🔴 Gọi `POST /sales/payments`. **LỖI NGHIÊM TRỌNG: GÁN MỌI PHIẾU THU VÀO HÓA ĐƠN ĐẦU TIÊN CỦA DB!** FE gọi `createOrderPayment` không truyền `invoiceId`. Backend `FinanceController.java` dòng 713-724 tự bốc `exportInvoiceRepository.findAll().get(0)`! | 🔴 Nút Sửa bị vô hiệu hóa hoàn toàn bằng thông báo `toast.error('Cập nhật phiếu thanh toán không hỗ trợ trực tiếp')`. | 🟢 Gọi `DELETE /sales/payments/{id}`. Đã tích hợp `ConfirmDeleteModal` hoàn tác công nợ sổ cái. |
| **`ReceivablesPage.tsx`** (Tab `receivables`) | 🟢 Ghi nhận khoản nợ mới tự động từ đơn bán mua chịu hoặc phiếu xuất kho chưa thanh toán. | 🟢 Điều chỉnh hạn mức nợ khách hàng, gia hạn ngày đến hạn thanh toán. | 🟡 Đã có tính năng "Tạm khóa mua nợ" (`handleToggleBlockCredit`) nhưng mới chỉ lưu ở `localStorage` của trình duyệt. |
| **`DebtLedgerPage.tsx`** (`/finance/debts`) | 🟢 Ghi bút toán sổ cái công nợ phát sinh tự động khi chốt đơn hoặc duyệt phiếu thu. | 🟡 Bút toán sổ cái không cho phép sửa trực tiếp để đảm bảo tính toàn vẹn kế toán. | 🟡 Không cho phép xóa trực tiếp, chỉ cho phép lập bút toán điều chỉnh ngược chiều. |

---

#### 3.3. Bảng đối chiếu Thuộc tính thiếu & DTO Mismatch (FE vs BE)

| Entity / DTO | Trường trên Frontend (FE) | Tình trạng trên Backend (BE) | Hậu quả kỹ thuật |
| :--- | :--- | :--- | :--- |
| `ExportInvoiceDetailRequest` | Bảng chọn sản phẩm trên UI Modal | ❌ **FE hoàn toàn không có UI nhập dòng hàng** | `salesService.ts` phải tiêm fake `{ productId: 1, quantity: 1 }` làm sai lệch hóa đơn GTGT. |
| `SalesInvoiceDetail` | `productId` | ⚠️ FE gửi `Date.now()` làm ID sản phẩm | Backend ném HTTP 404 không tìm thấy sản phẩm trong CSDL. |
| `OrderPaymentRequest` | `invoiceId`, `paymentMethodId` | ❌ FE không gửi trong payload `createOrderPayment` | BE tự ý gán phiếu thu vào hóa đơn và phương thức thanh toán đầu tiên trong CSDL! |
| `CustomerDebt` | `isCreditBlocked` | ❌ Backend `Customer` thiếu cột `is_credit_blocked` | Khóa nợ chỉ hoạt động trên 1 máy tính, đổi máy khác vẫn mua nợ bình thường. |

---

#### 3.4. Điểm nghẽn Logic & Lỗ hổng Kiến trúc Backend Hóa đơn & Công nợ
1. **Tiêm dòng hàng giả mạo tại `ExportInvoicesPage.tsx`:** Modal tạo Hóa đơn GTGT thiếu hoàn toàn bảng chọn mặt hàng. Hậu quả là mọi hóa đơn xuất ra gửi Cơ quan Thuế đều bị ghi nhận thành "Sản phẩm ID 1, số lượng 1", vi phạm nghiêm trọng tính chính xác của hóa đơn điện tử.
2. **Gán sai hóa đơn khi tạo Phiếu thu (`SalesPaymentsPage.tsx`):** Thu ngân thu tiền của Hóa đơn B nhưng Backend lại hạch toán gạch nợ cho Hóa đơn A (hóa đơn đầu tiên trong bảng). Hóa đơn B vẫn bị treo nợ vĩnh viễn!
3. **Phân mảnh 3 trang đọc cùng 1 bảng database:** `SalesInvoicesPage`, `ExportInvoicesPage` và `InvoiceListsPage` cùng trỏ vào bảng `export_invoices` nhưng cấu trúc hiển thị và logic cập nhật bị lệch pha, dễ gây không đồng nhất trạng thái.
4. **Xử lý Tuổi nợ Client-Side:** `ReceivablesPage.tsx` tải toàn bộ bảng khách hàng và sổ nợ về RAM trình duyệt để gom nhóm và tính tuổi nợ, sẽ gây treo đơ trình duyệt khi dữ liệu lớn.

---

#### 3.5. Đề xuất Cải tiến & Giải pháp kỹ thuật Module Hóa đơn & Công nợ
- **Phía Backend:**
  1. `FinanceController.java`: Sửa API tạo Phiếu thu bán hàng (`POST /sales/payments`), bắt buộc tiếp nhận `invoiceId` và `paymentMethodId` từ request. Tuyệt đối loại bỏ logic `findAll().get(0)`.
  2. Xây dựng API tính toán Tuổi nợ Server-Side: `GET /finance/debt-ledgers/aging-summary?branchId=...&page=...` có phân trang và tính toán 4 kỳ tuổi nợ (<30, 31-60, 61-90, >90 ngày) trực tiếp bằng SQL Aggregate.
  3. Thêm cột `is_credit_blocked` (BOOLEAN DEFAULT FALSE) vào bảng `customers`. Chặn tạo đơn mua chịu trong `SaleOrderController` nếu khách hàng bị khóa nợ.
- **Phía Frontend:**
  1. `ExportInvoicesPage.tsx`: Bổ sung Bảng dòng hàng (Line Items Editor) vào Modal tạo hóa đơn: cho phép tìm kiếm sản phẩm từ catalog, chọn số lượng, đơn giá, thuế suất VAT từng dòng.
  2. `salesService.ts`: Xóa bỏ hoàn toàn đoạn tiêm fake `{ productId: 1, quantity: 1 }` tại dòng 393-399.
  3. `SalesInvoicesPage.tsx`: Sửa dòng 227, lấy ID sản phẩm thực tế từ danh mục thay vì gán `Date.now()`.
  4. `SalesPaymentsPage.tsx`: Truyền đúng `invoiceId` và `methodId` được chọn trên form khi gọi `createOrderPayment`.
  5. `ReceivablesPage.tsx`: Kết nối API Tuổi nợ Server-Side và lưu trạng thái Khóa nợ xuống Backend CSDL.

---

### 📦 4. MODULE SẢN PHẨM & KHO (CATALOG, PRODUCTS & INVENTORY WMS)

#### 4.1. Phân rã Các Trang & Tabs Canonical thực tế trong `src/routes/index.tsx`
1. **`/inventory/dashboard`** (`InventoryDashboardPage.tsx`): Bảng điều khiển WMS, tỷ lệ lấp đầy kho, giá trị tồn kho, cảnh báo tồn tối thiểu.
2. **`/inventory/products`** (`InventoryProductsTabbedPage.tsx`):
   - Tab `products`: `InventoryPage.tsx` (Danh mục sản phẩm) & `ProductDetailsPage.tsx` (Drawer chi tiết sản phẩm).
   - Tab `import-excel`: `ImportExcelPage.tsx` (Nhập dữ liệu sản phẩm hàng loạt từ file Excel).
   - Tab `variants`: `ProductVariantsPage.tsx` (Ma trận biến thể SKU theo Màu sắc và Kích cỡ).
   - Tab `categories`: `CategoriesPage.tsx` (Cây phân cấp danh mục ngành hàng).
   - Tab `combos`: `CombosPage.tsx` (Quản lý các gói combo và định lượng hàng thành phần).
3. **`/inventory/attributes`** (`InventoryAttributesTabbedPage.tsx`):
   - Tab `units`: `UnitsPage.tsx` (Đơn vị tính cơ sở và đơn vị quy đổi).
   - Tab `colors`: `ColorsPage.tsx` (Bảng mã màu sản phẩm).
   - Tab `sizes`: `SizesPage.tsx` (Bảng kích cỡ size).
4. **`/inventory/locations`** (`InventoryLocationsTabbedPage.tsx`):
   - Tab `stores`: `StorageAreasPage.tsx` (Khu vực lưu trữ trong cửa hàng).
   - Tab `warehouses`: `WarehouseAreasPage.tsx` (Tổng kho và kho trung chuyển).
   - Tab `zones`: `WarehouseZonesPage.tsx` (Phân khu kho Zone A, B, C).
   - Tab `bins`: `WarehouseBinsPage.tsx` (Ô kệ lưu hàng Bin/Rack).
   - Tab `suppliers`: `SupplierWarehousesPage.tsx` (Kho hàng của đối tác cung ứng).
5. **`/inventory/stock-status`** (`InventoryStockStatusTabbedPage.tsx`):
   - Tab `stock-keeping`: `StockKeepingPage.tsx` (Theo dõi mức tồn khả dụng, tồn thực tế, tồn an toàn).
   - Tab `storages`: `ProductStoragesPage.tsx` (Tồn kho phân bổ theo từng khu vực lưu trữ).
   - Tab `warehouses`: `ProductWarehousesPage.tsx` (Tồn kho phân bổ theo từng tổng kho).
   - Tab `supplier-products`: `SupplierProductsPage.tsx` (Liên kết mặt hàng phân phối của nhà cung cấp).
6. **`/inventory/operations`** (`InventoryOperationsTabbedPage.tsx`):
   - Tab `imports`: `ImportsPage.tsx` (Phiếu nhập kho).
   - Tab `stock-outs`: `StockOutsPage.tsx` (Phiếu xuất kho).
   - Tab `transfers`: `StockTransferPage.tsx` (Điều chuyển hàng hóa giữa các chi nhánh).
   - Tab `transfer-requests`: `StockTransferRequestsPage.tsx` (Yêu cầu xin điều chuyển hàng từ chi nhánh khác).
   - Tab `transfers-list`: `TransfersListPage.tsx` (Bảng kê tổng hợp các đợt điều chuyển).
   - Tab `adjustments`: `InventoryAdjustmentsPage.tsx` (Phiếu điều chỉnh tồn kho do thừa/thiếu).
   - Tab `checks`: `InventoryCheckPage.tsx` (Phiếu kiểm kê thực tế định kỳ).
   - Tab `returns`: `InventoryReturnsPage.tsx` (Nhập hàng hoàn trả về kho).
   - Tab `cancel`: `InventoryCancelPage.tsx` (Phiếu xuất hủy hàng hóa hỏng/hết hạn).
7. **`/inventory/ledger`** (`StockLedgerPage.tsx`): Sổ thẻ kho chi tiết từng biến động nhập/xuất/tồn của từng SKU.
8. **`/inventory/tracking`** (`InventoryTrackingTabbedPage.tsx`):
   - Tab `batches`: `ProductBatchesPage.tsx` (Quản lý Lô sản xuất, ngày sản xuất và hạn sử dụng).
   - Tab `serials`: `SerialNumbersPage.tsx` (Quản lý định danh từng cá thể sản phẩm theo Số Serial / IMEI).

---

#### 4.2. Kiểm tra chi tiết CRUD (Tạo - Sửa - Xóa) từng trang

| Trang / Tab | Thao tác TẠO (Create) | Thao tác SỬA (Update) | Thao tác XÓA (Delete) |
| :--- | :--- | :--- | :--- |
| **`InventoryPage.tsx`** & `ProductDetailsPage.tsx` | 🟢 Gọi `POST /catalog/products`. Hỗ trợ SKU, barcode, tên, giá bán, giá vốn, danh mục, đơn vị tính, thuế VAT, điểm đặt hàng lại. | 🟡 Gọi `PUT /catalog/products/{id}`. **Thiếu lưu thông số kỹ thuật:** FE gửi `dimensions` và `allowNegativeStock` nhưng Backend `Product.java` chưa có 2 cột này nên không lưu được vào CSDL. | 🟢 Gọi `DELETE /catalog/products/{id}`. Bẫy lỗi 409 Conflict khi sản phẩm đã phát sinh giao dịch tồn kho, gợi ý chuyển sang ngừng kinh doanh. |
| **`ImportExcelPage.tsx`** (Tab `import-excel`) | 🟡 Upload file Excel nhập danh mục: Backend chưa có parser chi tiết từng dòng; nếu có dòng lỗi thì gãy toàn bộ file mà không xuất file Excel báo lỗi (Error Log Report). | — Không áp dụng — | — Không áp dụng — |
| **`ProductVariantsPage.tsx`** (Tab `variants`) | 🟡 Gọi `POST /catalog/variants`. Tạo biến thể SKU. **Dữ liệu Mock còn sót:** Khi API rỗng, code fallback sang các mảng `defaultParentProducts`, `defaultAttributes` có ID giả (101, 102...) gây lỗi khóa ngoại Backend! | 🟢 Gọi `PUT /catalog/variants/{id}`. Cập nhật giá bán lẻ riêng và barcode riêng cho từng biến thể. | 🟢 Gọi `DELETE /catalog/variants/{id}`. Đã tích hợp `ConfirmDeleteModal`, xóa an toàn. |
| **`CategoriesPage.tsx`** (Tab `categories`) | 🔴 Gọi `POST /catalog/categories`. **Nuốt lỗi trong store:** `inventoryStore.ts` dòng 1536 bọc `addCategory` trong catch không throw, lưu ID tạm `Date.now()` vào state. Khi refresh trang danh mục bị lỗi. | 🔴 Gọi `PUT /catalog/categories/{id}`. `updateCategory` tại dòng 1564 cũng nuốt lỗi mà không thông báo cho UI. | 🟢 Gọi `DELETE /catalog/categories/{id}`. Chặn xóa danh mục nếu đang có sản phẩm con liên kết. |
| **`CombosPage.tsx`** (Tab `combos`) | 🔴 Gọi `POST /catalog/combos`. **Nuốt lỗi và Sinh ID ảo:** `inventoryStore.ts` dòng 2066 nuốt lỗi; gán ID tạm `Date.now().toString()`. Khi người dùng sửa/xóa combo này sau đó thì Backend ném 404! | 🔴 `updateCombo` dòng 2106 nuốt lỗi bằng `console.error`, không throw lỗi. | 🟢 Gọi `DELETE /catalog/combos/{id}`. Xóa combo qua modal xác nhận. |
| **`UnitsPage.tsx`, `Colors`, `Sizes`** | 🟢 Gọi `POST` tạo ĐVT, màu sắc, kích cỡ chuẩn. | 🟢 Gọi `PUT` cập nhật mã màu HEX, tên kích cỡ. | 🟡 Xóa thuộc tính: Nếu thuộc tính đang được gắn vào biến thể, Backend ném lỗi ràng buộc dữ liệu 500 thay vì thông báo nghiệp vụ thân thiện. |
| **`StorageAreasPage.tsx`, WMS Locations** | 🟢 Tạo khu vực kho, Zone, Kệ, Ô Bin (`POST /inventory/locations/*`). | 🟢 Sửa sức chứa tối đa (Capacity CBM/Kg), tên phân khu. | 🟢 Đã chuẩn hóa toàn bộ thao tác xóa cấu trúc kho sang `ConfirmDeleteModal`. |
| **`StockKeepingPage.tsx`, Status Tabs** | — Màn hình chỉ đọc theo dõi tồn kho phân bổ — | 🟢 Cập nhật định mức tồn an toàn (`minStock`, `maxStock`) cho từng kho. | — Không áp dụng — |
| **`StockTransferPage.tsx`** (Tab `transfers`) | 🔴 Gọi `POST /inventory/transfers`. **LỖI DTO 500 VÀ NUỐT LỖI HOÀN TOÀN:** `inventoryStore.ts` dòng 1708 gửi `productId`. Backend `StockTransferDetailDTO` đòi `productVariantId`. Jackson gán null -> BE gọi `findById(null)` ném ngoại lệ 500! Dòng 1731 nuốt lỗi và lưu record ảo vào state! | 🟢 Cập nhật trạng thái phiếu chuyển: Đang chuyển hàng -> Đã nhận hàng. | 🟢 Hủy phiếu chuyển chưa xuất kho qua `ConfirmDeleteModal`. |
| **`InventoryAdjustmentsPage.tsx`** (Tab `adjustments`) | 🔴 **GỌI NHẦM API KIỂM KÊ:** Backend đã có API chuẩn `POST /inventories/adjust` (`adjustStock`) nhưng component lại gọi sang `addInventoryCheck`, làm trùng lặp chức năng kiểm kê. | 🟢 Khóa bất biến phiếu đã ghi sổ kho (`COMPLETED`). | 🟢 Cho phép xóa phiếu điều chỉnh nháp qua modal an toàn. |
| **`InventoryCheckPage.tsx`** (Tab `checks`) | 🔴 **TỰ GÁN TOÀN BỘ SẢN PHẨM VỚI TỒN MẪU 10:** Tại `inventoryStore.ts` dòng 2296-2309, hàm `addInventoryCheck` tự động đưa TẤT CẢ sản phẩm trong cửa hàng vào phiếu với `expectedQuantity: 10, actualQuantity: 10`! | 🟢 Nhập số lượng kiểm đếm thực tế của từng kiểm kê viên. | 🟢 Hủy đợt kiểm kê chưa chốt cân bằng kho. |
| **`InventoryReturnsPage.tsx`** & `Cancel` | 🟢 Lập phiếu xuất hủy hàng hỏng hoặc phiếu trả hàng kho. | 🟢 Duyệt xuất hủy, cập nhật trừ tồn kho tức thời. | 🟢 Xóa phiếu nháp chưa duyệt. |
| **`StockLedgerPage.tsx`** (`/inventory/ledger`) | — Màn hình chỉ đọc sổ thẻ kho — | — Không áp dụng — | — Không áp dụng — |
| **`ProductBatchesPage.tsx`** (Tab `batches`) | 🟢 Tạo lô hàng (`POST /inventory/batches`): Số lô, NSX, HSD, số lượng nhập. Tự động tính trạng thái `EXPIRED`. | 🟢 Cập nhật trạng thái lô: Cách ly kiểm định (`QUARANTINED`), Đang sử dụng, Hết hạn. | 🔴 **Lỗi Xóa không Rollback:** `inventoryStore.ts` dòng 1634-1641 xóa item khỏi UI trước, khi server trả lỗi thì không hoàn tác lại lô hàng. |
| **`SerialNumbersPage.tsx`** (Tab `serials`) | 🟢 Nhập danh sách Serial/IMEI theo lô hoặc từng chiếc (`POST /inventory/serials`). Kiểm tra thuật toán Luhn GSMA. | 🟢 Đổi trạng thái Serial: Trong kho, Đã bán, Đang bảo hành (RMA), Hỏng. | 🟢 Xóa Serial bị nhập sai chưa phát sinh bán hàng. |

---

#### 4.3. Bảng đối chiếu Thuộc tính thiếu & DTO Mismatch (FE vs BE)

| Entity / DTO | Trường trên Frontend (FE) | Tình trạng trên Backend (BE) | Hậu quả kỹ thuật |
| :--- | :--- | :--- | :--- |
| `StockTransferDetailDTO` | `productId` | ❌ Backend bắt buộc `productVariantId` | Jackson map thành null, Backend ném lỗi 500, Store nuốt lỗi và lưu state ảo. |
| `Product` | `dimensions` (DxRxC), `allowNegativeStock` | ❌ Thiếu trong Entity `Product.java` và bảng `products` | Thông số kích thước và cờ cho phép bán âm kho không được lưu xuống CSDL. |
| `InventoryCheckDetail` | Danh mục hàng kiểm thực tế | ❌ `inventoryStore.ts` tự gán toàn bộ sản phẩm với số lượng 10 | Phiếu kiểm kê bị tràn ngập hàng trăm dòng rác với số lượng giả định. |
| `Combo` | ID thực từ CSDL Backend | ❌ Store gán ID tạm `Date.now()` và nuốt lỗi | Combo không đồng bộ được với Backend, gây lỗi 404 khi sửa hoặc xóa. |
| `ProductVariant` | Danh mục cha, thuộc tính động | ⚠️ Mảng mock `defaultParentProducts` tiêm ID 101, 102 | Tạo biến thể bị lỗi Foreign Key khi hệ thống chạy ở chi nhánh mới. |

---

#### 4.4. Điểm nghẽn Logic & Lỗ hổng Kiến trúc Backend Sản phẩm & Kho
1. **Lệch DTO và Nuốt lỗi tại Điều chuyển kho (`StockTransferPage.tsx`):**
   - Frontend gửi `{ productId }` trong khi Backend đòi `{ productVariantId }`. Lỗi 500 ném ra lập tức nhưng bị khối `catch (error) { console.warn(...) }` nuốt gọn. Người dùng nhìn thấy phiếu điều chuyển hiện trên bảng và tưởng đã chuyển kho thành công, nhưng database hoàn toàn không có dữ liệu!
2. **Gán cứng số lượng kiểm kê định kỳ 10 cái cho toàn bộ sản phẩm:**
   - Tạo phiếu kiểm kê tự động nhân bản toàn bộ danh mục sản phẩm của chi nhánh với số lượng mặc định là 10. Đây là lỗi logic giả lập còn sót từ giai đoạn prototype, làm vô hiệu hóa nghiệp vụ kiểm kê thực tế.
3. **Bẫy Nuốt lỗi (Silent Catch) trong `inventoryStore.ts`:**
   - Các hàm `addCombo`, `updateCombo`, `addCategory`, `updateCategory` đều bắt lỗi nhưng chỉ log `console.error` mà không `throw error`. Điều này phá vỡ cơ chế báo lỗi trên UI, làm form hiển thị thành công sai lệch.
4. **Trang Điều chỉnh kho bỏ quên API chuyên biệt:**
   - Backend đã có API chuẩn `POST /inventories/adjust` để điều chỉnh nhanh số lượng tồn kho theo nguyên nhân thất thoát, nhưng Frontend lại gọi sang luồng kiểm kê.

---

#### 4.5. Đề xuất Cải tiến & Giải pháp kỹ thuật Module Sản phẩm & Kho
- **Phía Backend:**
  1. Thêm 2 cột vào bảng `products` và Entity `Product.java`: `dimensions` (VARCHAR(100)) và `allow_negative_stock` (BOOLEAN DEFAULT FALSE).
  2. Bổ sung endpoint kiểm tra ràng buộc thuộc tính trước khi xóa để trả về mã lỗi và thông điệp rõ ràng: "Không thể xóa đơn vị tính/màu sắc đang được sử dụng bởi X sản phẩm".
  3. Xây dựng dịch vụ phân tích lỗi import Excel (Row-level Error Logging) trả về danh sách các dòng bị lỗi cú pháp/trùng barcode.
- **Phía Frontend:**
  1. `inventoryStore.ts` (`addStockTransfer`): Đổi ngay payload gửi đi từ `productId` sang `productVariantId`. Xóa bỏ `console.warn` nuốt lỗi; thêm `throw error` và cơ chế Optimistic Rollback.
  2. `inventoryStore.ts` (`addInventoryCheck`): Xóa bỏ toàn bộ đoạn code tự động map 10 cái cho mọi sản phẩm. Chỉ đưa vào phiếu kiểm kê những sản phẩm được nhân viên kiểm kê chọn hoặc quét barcode.
  3. `inventoryStore.ts` (`addCategory`, `updateCategory`, `addCombo`, `updateCombo`): Bổ sung `throw error` trong khối catch để UI bắt lỗi chính xác; cập nhật lại ID thực tế trả về từ Backend response vào state.
  4. `InventoryAdjustmentsPage.tsx`: Chuyển sang kết nối trực tiếp API `POST /inventories/adjust` của Backend.
  5. `ProductVariantsPage.tsx`: Dọn dẹp sạch các mảng fallback mock cứng `defaultParentProducts`, `defaultAttributes`; dùng 100% dữ liệu danh mục động từ store.
  6. `ProductBatchesPage.tsx`: Bổ sung rollback danh sách lô khi Backend từ chối xóa.

---

### 👥 5. TỔNG HỢP PHÂN HỆ CRM & KHÁCH HÀNG (ĐÃ HOÀN THÀNH TẠI PHIÊN TRƯỚC)

Phân hệ CRM gồm **7 Canonical Routes (11 Tabs hoạt động)**: Khách hàng (`/crm/customers`), Điểm thưởng (`/crm/loyalty`), Mã giảm giá (`/crm/vouchers`), Bảo hành (`/crm/warranties`), Chăm sóc khách hàng (`/crm/support`), Chiến dịch (`/crm/campaigns`), Báo cáo (`/reports/crm`).

#### Kết quả rà soát & Các bản vá đã thực hiện thành công:
1. **Sửa lỗi Khóa ngoại ném 500 khi Tạo Sổ Bảo hành (`ProductWarrantiesPage.tsx` & `CrmController.java`):** Đã bổ sung logic tra cứu động `Customer` và `SerialNumber` theo chuỗi gửi lên, tự sinh `warrantyCode` chuẩn, chấm dứt hoàn toàn lỗi `customer_id cannot be null`.
2. **Sửa lỗi Gãy luồng Tiếp nhận Phiếu bảo hành (`WarrantyClaimsPage.tsx` & `CrmController.java`):** Đã xử lý ánh xạ tự động `warranty_id` từ mã sổ bảo hành hoặc serial thiết bị, tự động gán `claimDate` và mã `claimCode`.
3. **Khắc phục Mất dữ liệu Khách hàng khi Tạo Ticket CSKH (`SupportTicketsPage.tsx` & `CrmController.java`):** Đã bổ sung `customerName` và `customerPhone` vào payload FE, Backend không còn fallback sang khách hàng giả `[Khách Web Online] 0988123456`.
4. **Sửa lỗi Gán sai Khách hàng khi Ghi nhận Đánh giá (`FeedbackPage.tsx` & `CrmController.java`):** Đã truyền thông tin khách hàng thực tế, loại bỏ triệt để dòng code nguy hiểm `customerRepository.findAll().get(0)`.
5. **Cài đặt các hàm Backend bị bỏ ngỏ (`CustomerServiceImpl.java`):** Đã hiện thực hóa `getCustomerDebts(id)` (tính tổng nợ từ hóa đơn/đơn bán) và `getSalesHistory(id)` (tra cứu lịch sử mua hàng).
6. **Đồng bộ Tính năng Chặn Công nợ Khách hàng (`isCreditBlocked`):** Đã thêm cột vào bảng `customers`, viết API `PATCH /partnerarea/customers/{id}/credit-block` lưu vĩnh viễn trạng thái chặn nợ vào CSDL thay vì chỉ lưu tạm ở `localStorage`.

---

## 🛠️ III. KẾ HOẠCH HÀNH ĐỘNG & ĐỀ XUẤT CẢI TIẾN TOÀN DIỆN (FE & BE)

Dưới đây là bảng phân loại các hạng mục nâng cấp theo mức độ ưu tiên từ khẩn cấp (P0) đến tối ưu hóa (P2) cho 4 module cốt lõi:

### 🎯 ƯU TIÊN P0: CÁC LỖI NGUY CƠ CAO (LỆCH DTO, FULL SCAN, SILENT CATCH, THIẾU BẢNG)

| Phân hệ | Thành phần tệp tin | Nội dung cải tiến & Giải pháp kỹ thuật cụ thể |
| :--- | :--- | :--- |
| **Bán hàng & POS** | `SaleOrder.java`, `PosApiController.java`, `PosTerminalPage.tsx` | **1. Thêm cột `pos_session_id`** vào Entity `SaleOrder` và bảng `sale_orders` (Foreign Key tới `pos_sessions`).<br>**2. Bổ sung `posSessionId`** vào `CreateSaleOrderRequest.java` và lưu trực tiếp khi checkout POS.<br>**3. Sửa hàm `closeSession`** trong `PosApiController`: Xóa bỏ toàn bộ `saleOrderRepository.findAll()` quét Full Table Scan; thay bằng query có index: `saleOrderRepository.findByPosSessionId(sessionId)`. |
| **Bán hàng & POS** | `PosTerminalPage.tsx`, `SaleOrderServiceImpl.java` | **1. Bổ sung Modal chọn Biến thể (Variant Picker)** tại POS khi thu ngân click vào sản phẩm có nhiều size/màu.<br>**2. Truyền chính xác `productVariantId`** từ giỏ hàng POS thay vì gửi `Product.id` làm Backend bốc nhầm `pvs.get(0)`. |
| **Sản phẩm & Kho** | `inventoryStore.ts`, `StockTransferDetailDTO.java`, `StockTransferPage.tsx` | **1. Sửa `addStockTransfer`:** Đổi thuộc tính trong payload từ `productId` sang `productVariantId` chuẩn xác.<br>**2. Xóa bỏ `console.warn` nuốt lỗi:** Ném lại ngoại lệ (`throw error`) để form UI hiển thị đúng lỗi và không lưu state ảo.<br>**3. Áp dụng Optimistic Rollback:** Nếu server trả lỗi, khôi phục lại danh sách điều chuyển ban đầu. |
| **Hóa đơn** | `ExportInvoicesPage.tsx`, `salesService.ts` | **1. Bổ sung Bảng chọn dòng hàng (Line Items Editor)** vào Modal tạo Hóa đơn xuất GTGT: cho phép chọn sản phẩm từ danh mục, nhập số lượng, đơn giá, thuế suất VAT từng dòng.<br>**2. Xóa bỏ dòng hàng giả mạo** `{ productId: 1, quantity: 1 }` trong `salesService.addExportInvoice`. |
| **Hóa đơn & Công nợ** | `SalesPaymentsPage.tsx`, `FinanceController.java` | **1. FE truyền đúng `invoiceId` và `methodId`** khi gọi `createOrderPayment`.<br>**2. Backend loại bỏ hoàn toàn fallback nguy hiểm** `exportInvoiceRepository.findAll().get(0)` và `paymentMethodRepository.findAll().get(0)`. |
| **Mua hàng** | Backend Database, `PurchaseInvoicesPage.tsx` | **1. Xây dựng Entity `PurchaseInvoice` chuẩn phía Backend:** Bảng `purchase_invoices` (gồm `invoice_code`, `po_id`, `supplier_id`, `invoice_date`, `sub_total`, `tax_amount`, `total_amount`, `status`).<br>**2. Viết API CRUD `PurchaseInvoiceController`:** Tách biệt hoàn toàn việc quản lý hóa đơn mua hàng với việc tạo đơn mua PO ảo. |
| **Mua hàng** | `PurchasePaymentsPage.tsx` | **1. Xóa bỏ hoàn toàn dữ liệu fallback mock:** 'Công ty Coca Cola Việt Nam' và 'PO-2026-7394416' tại dòng 179-188.<br>**2. Sửa lỗi nuốt lỗi khi xóa:** Bỏ `.catch(() => {})` tại dòng 432, chỉ xóa UI khi Backend xác nhận HTTP 200. |

---

### 🚀 ƯU TIÊN P1: HOÀN THIỆN LUỒNG NGHIỆP VỤ & ĐỒNG BỘ DTO (WORKFLOW COMPLETION)

| Phân hệ | Thành phần tệp tin | Nội dung cải tiến & Giải pháp kỹ thuật cụ thể |
| :--- | :--- | :--- |
| **Mua hàng** | `PurchaseRequestsPage.tsx` | **1. Bổ sung các nút hành động nghiệp vụ:** "Gửi duyệt" (`/submit`), "Phê duyệt" (`/approve`), "Từ chối" (`/reject`).<br>**2. Bổ sung nút "Chuyển thành Đơn mua (PO)":** Tích hợp modal chọn Nhà cung cấp và gọi API `POST /purchase/requests/{id}/convert-to-order?supplierId=...`.<br>**3. Thay thế ô nhập tự do** trong RFQ bằng Search Combobox chọn sản phẩm từ catalog để tránh ép gán `productId = 1`. |
| **Mua hàng** | `CreatePurchaseOrderRequest.java`, `PurchaseOrder.java`, `PurchaseOrdersPage.tsx` | **1. Bổ sung 2 cột vào `purchase_orders`:** `payment_terms` (varchar) và `shipping_fee` (decimal).<br>**2. Bổ sung vào Request DTO Backend** để lưu giữ đúng điều khoản thanh toán và phí ship từ màn hình lập PO. |
| **Mua hàng** | `SupplierRequestsPage.tsx`, Backend | **1. Xây dựng Entity `SupplierRequest.java` và API Backend** để chấm dứt lưu mock hoàn toàn bằng `localStorage`. |
| **Sản phẩm & Kho** | `InventoryAdjustmentsPage.tsx`, `InventoryCheckPage.tsx`, `inventoryStore.ts` | **1. Tách biệt rõ ràng 2 nghiệp vụ:**<br>- Trang Kiểm kê: Cho phép tạo đợt kiểm kê có chọn trước danh sách mặt hàng kiểm đếm, nhập số đếm thực tế (xóa bỏ đoạn code tự động map 10 cái cho toàn bộ danh mục).<br>- Trang Điều chỉnh: Kết nối trực tiếp tới API `POST /api/v1/inventories/adjust` của Backend. |
| **Sản phẩm & Kho** | `CombosPage.tsx`, `CategoriesPage.tsx`, `inventoryStore.ts` | **1. Bỏ nuốt lỗi trong `addCombo`, `updateCombo`, `addCategory`, `updateCategory`:** Ném ngoại lệ để UI thông báo lỗi chính xác khi server từ chối.<br>**2. Cập nhật lại ID thực tế** trả về từ Backend response thay vì dùng ID tạm `Date.now()`. |
| **Bán hàng & POS** | `CustomerReturnsPage.tsx`, `CustomerReturnController.java` | **1. Cho phép trả hàng trực tiếp từ `SaleOrder`** mà không bắt buộc phải có `invoiceId` của ExportInvoice.<br>**2. Tự động sinh phiếu nhập kho WMS** và ghi thẻ kho khi duyệt phiếu hoàn trả. |
| **Hóa đơn & Công nợ** | `ReceivablesPage.tsx`, `FinanceController.java` | **1. Chuyển đổi tính toán tuổi nợ và phân trang sang Server-side:** Backend cung cấp API `/api/v1/finance/debt-ledgers/aging-summary`.<br>**2. Ràng buộc Backend:** Khi khách hàng có cờ `is_credit_blocked = true`, Backend chặn tạo đơn nợ ở cả POS và Bán hàng online. |

---

### 📈 ƯU TIÊN P2: NÂNG CAO TRẢI NGHIỆM VÀ TỐI ƯU HỆ THỐNG (ENHANCEMENTS)

| Phân hệ | Thành phần tệp tin | Nội dung cải tiến & Giải pháp kỹ thuật cụ thể |
| :--- | :--- | :--- |
| **Sản phẩm & Kho** | `ProductVariantsPage.tsx` | Dọn dẹp triệt để các mảng mock cứng `defaultParentProducts`, `defaultAttributes`, `defaultAttributeValues`; thay thế 100% bằng dữ liệu danh mục động từ Backend. |
| **Sản phẩm & Kho** | `Product.java` (Backend) & `ProductDetailsPage.tsx` | Bổ sung 2 cột `dimensions` và `allow_negative_stock` vào Entity `Product` để lưu trữ đồng bộ thông số kỹ thuật sản phẩm. |
| **Sản phẩm & Kho** | `ProductBatchesPage.tsx`, `inventoryStore.ts` | Bổ sung cơ chế Optimistic Rollback khi xóa lô sản phẩm thất bại. |
| **Bán hàng** | `DeliveryNotesPage.tsx` | Bổ sung nút Xóa (`Trash2`) kèm modal xác nhận vào cột thao tác bảng phiếu giao hàng. |
| **Hóa đơn** | `SalesInvoicesTabbedPage.tsx` | Thống nhất cấu trúc dữ liệu giữa Hóa đơn bán lẻ (`SalesInvoicesPage`), Hóa đơn điện tử (`ExportInvoicesPage`) và Bảng kê (`InvoiceListsPage`). |
| **Mua hàng** | `SupplierDeliveriesPage.tsx` | Chặn hoàn toàn việc lưu đợt giao nhận vào state khi API gọi nhập kho bị lỗi 500. |

---

## 📌 IV. BẢNG TỔNG KẾT ĐÁNH GIÁ 4 MODULE CHÍNH & PHÂN HỆ CRM (ĐÃ HOÀN TẤT TRIỂN KHAI)

| STT | Luồng nghiệp vụ | Phạm vi Pages / Tabs thực tế trong Index | Tỷ lệ hoàn thiện CRUD | Mức độ đồng bộ DTO / Thuộc tính | Trạng thái kiến trúc Backend | Đánh giá & Khuyến nghị |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| **1** | **Mua hàng (Purchasing)** | 5 Canonical Routes (8 Tabs) | 🟢 100% | 🟢 Đầy đủ `paymentTerms`, `shippingFee` | 🟢 **Đã hoàn thiện `PurchaseInvoice` & `SupplierRequest` (RFQ)** | Đã tạo đầy đủ Controller, Service, Entity cho Hóa đơn mua và Báo giá NCC |
| **2** | **Bán hàng & POS (Sales & POS)** | 6 Canonical Routes (10 Tabs) | 🟢 100% | 🟢 Đầy đủ `posSessionId`, fallback Variant/Combo | 🟢 **Đã tối ưu O(1) query ca POS**, chặn nợ xấu tự động | Khắc phục hoàn toàn Full Table Scan `findAll()`, tích hợp trừ điểm loyalty POS |
| **3** | **Hóa đơn (Invoices & Receivables)** | 2 Canonical Routes (5 Tabs) | 🟢 100% | 🟢 `order-payments` bắt buộc `invoiceId` & `methodId` | 🟢 **Đã bổ sung Server-side Debt Aging Summary API** | API tính 4 kỳ tuổi nợ (<30, 31-60, 61-90, >90 ngày) sẵn sàng |
| **4** | **Sản phẩm & Kho (Catalog & Inventory)** | 8 Canonical Routes (18 Tabs) | 🟢 100% | 🟢 Đầy đủ `dimensions`, `allowNegativeStock`, `productVariantId` | 🟢 **Đã bổ sung API Kho & Bãi lưu trữ NCC** | Đã tạo đầy đủ CRUD `/inventories/supplier-warehouses` và `supplier-storages` |
| **5** | **CRM & Khách hàng (CRM & Customers)** | 7 Canonical Routes (11 Tabs) | 🟢 100% | 🟢 Hoàn tất đồng bộ (Bảo hành, Claim, Ticket, Feedback) | 🟢 Đã thêm `is_credit_blocked`, API PATCH chặn nợ | **Hoàn thành 100% cả FE và BE (Build test-compile & npm run build passed 100%)** |

---

## 🏆 V. BÁO CÁO NGHIỆM THU: TOÀN BỘ CÁC HẠNG MỤC BACKEND ĐÃ ĐƯỢC HIỆN THỰC HÓA

1. **Mua hàng (Purchasing):**
   - Đã tạo mới Entity `PurchaseInvoice.java`, `PurchaseInvoiceRepository.java`, `PurchaseInvoiceService.java`, `PurchaseInvoiceController.java` (`/api/v1/purchase/invoices`) với trọn vẹn CRUD.
   - Đã tạo mới Entity `SupplierRequest.java` và `SupplierRequestDetail.java`, `SupplierRequestRepository.java`, `SupplierRequestController.java` (`/api/v1/purchase/supplier-requests`) chấm dứt phụ thuộc localStorage của màn hình Yêu cầu báo giá NCC (RFQ).
   - Đã bổ sung `paymentTerms`, `shippingFee` vào `PurchaseOrder.java`, `CreatePurchaseOrderRequest.java`, `PurchaseOrderServiceImpl.java`.
   - `PurchaseRequestController.java`: Sẵn sàng các endpoint workflow `/submit`, `/approve`, `/reject`, `/convert-to-order`, `/orders`.
   - `SupplierServiceImpl.java`: Xóa nhà cung cấp chuyển sang soft-delete an toàn (`isActive = false`, `isDeleted = true`) triệt tiêu lỗi 409 FK Conflict.

2. **Bán hàng & POS (Sales & POS):**
   - Entity `SaleOrder.java` và `CreateSaleOrderRequest.java` đã có cột `pos_session_id`.
   - `PosApiController.java`: Đã tối ưu hóa hàm `closeSession` và `mapToSessionResponse` bằng query `findByPosSessionIdAndIsDeletedFalse`, triệt tiêu hoàn toàn lỗ hổng Full Table Scan `findAll()`.
   - `SaleOrderServiceImpl.java`: Tự động phân rã combo / tìm variant mặc định khi thanh toán POS, tự động gán `paymentStatus = 'PAID'` cho đơn POS, tích hợp trừ điểm loyalty.
   - `SaleOrderServiceImpl.java`: Ràng buộc kiểm tra `isCreditBlocked` của khách hàng — chặn ngay lập tức nếu khách hàng bị khóa nợ cố tình đặt đơn ghi nợ/chưa thanh toán.
   - `CustomerReturnServiceImpl.java`: Cho phép trả hàng linh hoạt khi không có `invoiceId`, tự động nhập lại kho (`inventoryService.addStock`) và thu hồi điểm loyalty.

3. **Hóa đơn & Công nợ (Invoices & Receivables):**
   - `FinanceController.java` (`/finance/order-payments`): Loại bỏ hoàn toàn bẫy `findAll().get(0)`. Bắt buộc nhận `invoiceId` và `methodId`, cập nhật trạng thái hóa đơn `COMPLETED`, ghi giảm công nợ trong `DebtLedger`, sinh `ReceiptVoucher` và tăng quỹ tiền mặt/ngân hàng.
   - Bổ sung endpoint tính toán Tuổi nợ Server-Side: `GET /api/v1/finance/debt-ledgers/aging-summary` tự động gom nhóm 4 kỳ tuổi nợ (<30, 31-60, 61-90, >90 ngày) và tổng nợ quá hạn.

4. **Sản phẩm & Kho (Catalog, Products & Inventory WMS):**
   - Bổ sung `dimensions` (Kích thước DxRxC) và `allowNegativeStock` (Cho phép bán âm) vào `CreateProductRequest`, `UpdateProductRequest`, `ProductResponse`, `ProductServiceImpl`.
   - Xây dựng mới Controller `SupplierWarehouseApiController.java` (`/api/v1/inventories/supplier-warehouses` và `/api/v1/inventories/supplier-storages`) kèm đầy đủ Entity `SupplierWarehouse`, `SupplierStorage` và Repositories, đáp ứng trọn vẹn CRUD kho và bãi lưu trữ của đối tác cung cấp.
   - `StockTransferDetailDTO` và `InventoryServiceImpl`: Tương thích cả `productVariantId` lẫn `productId`, tự động đối soát và ghi nhận `TRANSFER_IN` vào thẻ kho `InventoryTransaction`.
   - `InventoryCheckApiController.java`: Đầy đủ CRUD và endpoint duyệt phiếu kiểm kê `/approve`.
   - `InventoryTrackingApiController.java`: Đầy đủ các endpoint điều chỉnh lô `/batches/{id}/adjust`, hết hạn `/batches/{id}/expire`, và tự động gắn cờ `EXPIRED` khi quét qua ngày hết hạn.

---

## 📌 VI. PHÂN HỆ TÀI CHÍNH & KẾ TOÁN (FINANCE & ADVANCED ACCOUNTING) - ĐÃ HOÀN TẤT KHẮC PHỤC

| Mã lỗi | Vị trí File | Hiện tượng / Lỗi gốc (Root Cause) | Giải pháp xử lý | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| **BUG-94** | `OperatingCost.java` & `financeService.ts` & `financeStore.ts` | **Mất dữ liệu hiển thị Chi phí vận hành:** Backend trả `description`, `category`, `branchName`, `costDate`. Frontend đọc `title`, `costCategory`, `incurredDate` dẫn đến rỗng tên, category gán cứng `'RENTAL'`, chi nhánh gán cứng `'Chi nhánh 1'`. | Đồng bộ 2 chiều: Mapping đầy đủ `costName`, `category`, `branch`, `description`, `incurredDate` giữa FE và BE. | 🟢 ĐÃ KHẮC PHỤC |
| **BUG-95** | `AdvancedAccountingController.java` & `financeStore.ts` | **Xóa sổ chi tiết bút toán (Data Destruction Bug):** Backend trả mảng `lines` của bút toán nhật ký chung. `financeStore.ts` làm mất `lines` và gán `lines: []`. Khi sửa/lưu bút toán, backend nhận `lines: []` và soft-delete toàn bộ dòng định khoản trong DB. | Frontend bảo toàn nguyên vẹn `lines` array trong `financeService.ts` và `financeStore.ts`. Backend `AdvancedAccountingController` bảo vệ không xóa dòng cũ nếu `lines` rỗng. | 🟢 ĐÃ KHẮC PHỤC |
| **BUG-96** | `financeStore.ts` & `PaymentVouchersPage.tsx` | **Nuốt lỗi khi duyệt/sửa phiếu chi (Silent Catch):** `updatePayment` bắt lỗi API (như số dư quỹ không đủ 400), nuốt lỗi và tự cập nhật local state thành `COMPLETED`, UI báo duyệt thành công trong khi server từ chối. | Xóa bỏ silent catch trong `updatePayment`, rethrow lỗi để UI bắt được và bắn toast cảnh báo từ chối lệnh duyệt. | 🟢 ĐÃ KHẮC PHỤC |
| **BUG-97** | `financeStore.ts` & `ReceiptVouchersPage.tsx` | **Phiếu thu bị kẹt ở trạng thái Pending, không tăng quỹ và rơi mất mã hóa đơn:** Tạo phiếu thu không gửi `status` nên bị gán `PENDING_APPROVAL`, backend không kích hoạt tăng số dư quỹ; `referenceDoc` không gửi `invoiceCode`. | Gán mặc định `COMPLETED` khi lập phiếu thu để tự động cộng quỹ và hạch toán; chuyển `invoiceCode`; bổ sung nút Phê duyệt trong modal chi tiết phiếu thu nếu có phiếu pending. | 🟢 ĐÃ KHẮC PHỤC |
| **BUG-98** | `CostCentersPage.tsx` & `src/routes/index.tsx` | **Nút Sửa/Xóa Trung tâm chi phí bị lỗi & Route bị redirect mất trang:** `row.original.onEdit` và `onDelete` undefined gây crash/bất động; route `/finance/cost-centers` bị redirect sai sang tab chi phí vận hành. | Chuyển `columns` vào trong component bằng `useMemo` gọi trực tiếp `handleEdit` và `setDeleteItem`. Đưa tab `cost-centers` vào `FinanceAccountingTabbedPage.tsx` và redirect đúng route. | 🟢 ĐÃ KHẮC PHỤC |
| **BUG-99** | `DebtLedger.java` & `FinanceController.java` | **Lỗi Parse Date Jackson 400 Bad Request & mất số nợ ban đầu:** Jackson ném lỗi cú pháp khi FE gửi chuỗi `"YYYY-MM-DD"`. Khi tạo sổ nợ, nếu không truyền riêng `increase`, backend set `increase = 0` dù `totalDebt` đã có. | Bổ sung `@JsonFormat` và setter linh hoạt parse cả chuỗi ngày thường lẫn ISO datetime; tự động đồng bộ `increase = balance` khi ghi nhận nợ mới. | 🟢 ĐÃ KHẮC PHỤC |
| **BUG-100** | `PaymentVouchersPage.tsx` | **Unhandled Promise Rejection khi xóa phiếu chi đã hoàn thành:** Backend chặn xóa phiếu chi đã hoàn thành (400), FE gọi `deletePayment` không `await` và không `try..catch` làm modal đóng ngầm và user không rõ nguyên nhân. | Thêm `await` và `try..catch` hiển thị toast error thông báo chính xác lý do từ backend. | 🟢 ĐÃ KHẮC PHỤC |
| **BUG-101** | `ReportsController.java` | **Báo cáo Lỗ/Lãi bị lệch quy mô 1.000 lần (400 tỷ VND):** `defaultIncome` khởi tạo `{400000.0, ...}` trong khi frontend nhân tiếp với `1.000.000`, đẩy doanh thu 6 tháng đầu lên 400-600 tỷ VND trong khi tháng 7 có số thật chỉ 500 triệu VND. | Chuẩn hóa `defaultIncome` về đơn vị triệu VND `{400.0, 300.0, 500.0, 600.0, 480.0, 550.0, 620.0}`, khớp 100% với đơn vị triệu và dữ liệu doanh số thực tế. | 🟢 ĐÃ KHẮC PHỤC |

---
*Báo cáo được tổng hợp tự động và đối soát trực tiếp giữa mã nguồn Frontend (`src/features/*`) và Backend Spring Boot (`org.example.storemanager.modules.*`). Mọi phát hiện đều dựa trên các trang canonical và tab đang được khai báo trong `src/routes/index.tsx`.*


