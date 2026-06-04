# API Endpoints (Gợi ý)

Tài liệu này liệt kê các endpoint backend được đề xuất cho frontend.

## Xác thực (Auth)
- POST /auth/login — Đăng nhập (body: { email, password })
- POST /auth/refresh — Refresh token (body: { refreshToken })
- POST /auth/logout — Đăng xuất
- GET  /auth/me — Lấy thông tin user hiện tại

## Kho hàng (Sản phẩm)
- GET    /inventory/products — Lấy danh sách sản phẩm
- GET    /inventory/products/:id — Lấy chi tiết sản phẩm
- POST   /inventory/products — Tạo sản phẩm
- PUT    /inventory/products/:id — Cập nhật sản phẩm
- DELETE /inventory/products/:id — Xóa sản phẩm
- DELETE /inventory/products — Xóa hàng loạt (body: { ids: string[] })
- POST   /inventory/products/:id/adjust-stock — Điều chỉnh tồn kho
- POST   /inventory/products/:id/upload-image — Tải ảnh sản phẩm
- GET    /inventory/products/:id/ledger — Sổ chi tiết tồn kho cho sản phẩm

## Danh mục / Đơn vị / Combo / Lô / Serial
- CRUD /inventory/categories
- CRUD /inventory/units
- CRUD /inventory/combos
- CRUD /inventory/batches
- CRUD /inventory/serials
- GET  /inventory/stock-ledger — Sổ tổng hợp tồn kho

## Chuyển kho (Stock Transfers)
- GET    /inventory/transfers
- GET    /inventory/transfers/:id
- POST   /inventory/transfers
- PUT    /inventory/transfers/:id
- DELETE /inventory/transfers/:id
- POST   /inventory/transfers/:id/approve — Duyệt chuyển kho
- POST   /inventory/transfers/:id/reject — Từ chối
- POST   /inventory/transfers/:id/complete — Hoàn tất

## Kiểm kê / Hủy / Phá hàng
- CRUD /inventory/audits
- POST /inventory/audits/:id/submit — Nộp kết quả kiểm kê
- CRUD /inventory/cancel-issues

## CRM
- CRUD /crm/customers
- CRUD /crm/vouchers
- CRUD /crm/loyalty-tiers
- CRUD /crm/support-tickets

## Bán hàng / POS
- POST /sales/orders — Tạo đơn bán
- GET  /sales/orders — Danh sách đơn
- GET  /sales/orders/:id — Chi tiết đơn
- POST /sales/orders/:id/payment — Ghi nhận thanh toán
- POST /sales/returns — Xử lý trả hàng

## Mua hàng / Nhà cung cấp
- CRUD /purchase/orders
- CRUD /purchase/suppliers
- POST /purchase/orders/:id/receive — Ghi nhận nhập kho (GRN)

## Tài chính
- CRUD /finance/bank-accounts
- CRUD /finance/journal-entries
- CRUD /finance/operating-costs
- CRUD /finance/payment-vouchers

## Nhân sự
- CRUD /hr/users
- CRUD /hr/roles
- CRUD /hr/departments
- GET  /hr/activity-logs

## Báo cáo
- GET /reports/sales
- GET /reports/inventory
- GET /reports/ledger
- POST /reports/generate — Tạo job báo cáo

## Tệp tin / Uploads
- POST /uploads — Tải file lên
- DELETE /uploads/:id — Xóa file

*Ghi chú:*
- Tất cả endpoint (ngoại trừ /auth/*) yêu cầu Bearer token.
- Phân trang: `page`, `pageSize` hoặc `limit`/`offset`.
- Lọc: `search`, `category`, `status`, `fromDate`, `toDate`.

## Các endpoint/flow cụ thể bổ sung
- GET /autocomplete/products?q=:query — Tìm nhanh SKU/tên cho typeahead
- POST /inventory/products/:id/reserve — Đặt giữ tồn kho cho đơn hàng (body `{ quantity, orderId }`)
- POST /inventory/products/:id/release — Giải phóng hàng đã đặt giữ (body `{ quantity, orderId }`)
- POST /inventory/products/bulk-price-update — Cập nhật giá hàng loạt (body `{ items: [{ id, price }] }`)
- POST /inventory/import — Import CSV sản phẩm (multipart/form-data)
- POST /purchase/orders/:id/receive — Tạo GRN khi nhận hàng từ PO
- POST /inventory/adjustments — Ghi nhận điều chỉnh tồn kho (body `{ sku, delta, reason, reference }`)
- POST /inventory/audits/:id/start — Bắt đầu phiên kiểm kê
- POST /inventory/audits/:id/complete — Hoàn thành kiểm kê và nộp số liệu
- GET /inventory/stock-take/:id/report — Xuất báo cáo kiểm kê (PDF/CSV)
- POST /inventory/returns — Xử lý trả hàng khách (body gồm items, qty, reason)
- POST /webhooks/register — Đăng ký webhook cho event kho
- GET /notifications — Danh sách thông báo
- POST /notifications/:id/read — Đánh dấu thông báo đã đọc

Những endpoint này hỗ trợ các flow mobile scanner, bulk-edit, import/export, và các thao tác vận hành (nhận hàng, trả hàng, kiểm kê).
