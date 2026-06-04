# Hợp đồng API — Các endpoint ưu tiên

Tệp này chứa ví dụ request/response cho các endpoint ưu tiên mà frontend sử dụng.

---

## 1) Xác thực — POST /auth/login
Request

POST /auth/login
Content-Type: application/json

Body:
```json
{
  "email": "admin@system.com",
  "password": "123456"
}
```

Response thành công — 200 OK
```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "usr_001",
    "name": "Nguyễn Minh Quân",
    "email": "admin@system.com",
    "role": "SUPER_ADMIN",
    "branchId": null,
    "avatar": "https://.../avatar.png"
  }
}
```

Lỗi — 401
```json
{ "code": "INVALID_CREDENTIALS", "message": "Sai email hoặc mật khẩu" }
```

---

## 2) Xác thực — POST /auth/refresh
Request

POST /auth/refresh
Content-Type: application/json

Body:
```json
{ "refreshToken": "<refresh-token>" }
```

Response thành công — 200
```json
{
  "accessToken": "new.access.token",
  "refreshToken": "new.refresh.token"
}
```

Lỗi — 401
```json
{ "code": "INVALID_REFRESH", "message": "Refresh token không hợp lệ hoặc đã hết hạn" }
```

---

## 3) Sản phẩm — GET /inventory/products
Request

GET /inventory/products?page=1&pageSize=10&search=nike&category=Th%E1%BB%8B%20trang
Headers: Authorization: Bearer <token>

Response thành công — 200
```json
{
  "data": [
    {
      "id": "1",
      "sku": "NK-AM24",
      "name": "Nike Air Max 2024",
      "category": "Thời trang & May mặc",
      "price": 2500000,
      "costPrice": 1500000,
      "brand": "Nike",
      "unit": "Đôi",
      "onHand": 45,
      "status": "ACTIVE",
      "lastUpdated": "2024-05-15 14:30",
      "mainImage": "https://...",
      "units": [{ "id":"u1","unitCode":"Thùng","conversionFactor":10, "price":22000000 }]
    }
  ],
  "meta": { "total": 125, "page": 1, "pageSize": 10 }
}
```

Lỗi — 401 Unauthorized

---

## 4) Sản phẩm — GET /inventory/products/:id
Request
GET /inventory/products/1
Headers: Authorization: Bearer <token>

Response 200
```json
{
  "id": "1",
  "sku": "NK-AM24",
  "name": "Nike Air Max 2024",
  "category": "Thời trang & May mặc",
  "price": 2500000,
  "costPrice": 1500000,
  "brand": "Nike",
  "unit": "Đôi",
  "onHand": 45,
  "status": "ACTIVE",
  "lastUpdated": "2024-05-15 14:30",
  "mainImage": "https://...",
  "galleryImages": ["https://...","https://..."],
  "barcodes": ["8934673312345"],
  "units": [ { "id": "u1", "unitCode": "Thùng", "conversionFactor": 10, "barcode": "893NKAM24BOX", "price": 22000000 } ]
}
```

---

## 5) Sản phẩm — POST /inventory/products
Request
POST /inventory/products
Headers: Authorization: Bearer <token>
Body (ví dụ):
```json
{
  "sku": "NK-NEW-01",
  "name": "New Shoe",
  "category": "Thời trang & May mặc",
  "price": 1200000,
  "costPrice": 800000,
  "brand": "BrandX",
  "unit": "Đôi",
  "onHand": 100,
  "status": "ACTIVE",
  "mainImage": "https://...",
  "units": []
}
```
Response 201 Created
```json
{ "id": "1234", "message": "Product created" }
```

Lỗi validation 400
```json
{ "code": "VALIDATION_ERROR", "message": "sku là trường bắt buộc", "fields": { "sku": "required" } }
```

---

## 6) Chuyển kho — POST /inventory/transfers
Request
POST /inventory/transfers
Headers: Authorization: Bearer <token>
Body:
```json
{
  "transferNumber": "TF-2026-001",
  "sourceHub": "WH-CENTRAL",
  "destinationHub": "STORE-NORTHSIDE",
  "dispatchDate": "2026-06-01",
  "estArrivalDate": "2026-06-02",
  "totalUnits": 50,
  "totalValuation": 4500000,
  "status": "DRAFT",
  "logisticsPartner": "FastShip",
  "details": [ { "sku": "NK-AM24", "quantity": 10 }, { "sku": "SS-S24", "quantity": 5 } ]
}
```

Response 201
```json
{ "id": "TRF-1234", "message": "Transfer created", "transferNumber": "TF-2026-001" }
```

Approve (POST /inventory/transfers/:id/approve)
Response 200
```json
{ "message": "Transfer approved", "status": "PENDING_APPROVAL" }
```

---

## 7) Sổ tồn (Ledger) — GET /inventory/stock-ledger
Request
GET /inventory/stock-ledger?sku=NK-AM24&from=2024-01-01&to=2024-12-31&page=1&pageSize=20
Headers: Authorization: Bearer <token>

Response 200
```json
{
  "data": [
    { "id": "1", "transactionCode": "TRX-2024-901", "sku": "NK-AM24", "type": "STOCK_IN", "quantityChange": 25, "runningBalance": 125, "unitPrice": 850, "totalValuation": 21250, "timestamp": "2024-05-17 14:30" }
  ],
  "meta": { "total": 45, "page": 1, "pageSize": 20 }
}
```

---

## Định dạng lỗi chung
Tất cả lỗi trả về nên theo định dạng:
```json
{ "code": "ERROR_CODE", "message": "Thông báo dễ hiểu", "details": { ... } }
```

---

## Các hợp đồng bổ sung — Endpoint vận hành
(Autocomplete, reserve/release, bulk price update, import, GRN, adjustment, audit, returns, webhooks, notifications)

### Autocomplete — GET /autocomplete/products
Request: `GET /autocomplete/products?q=nike`
Response 200
```json
{ "data": [ { "id": "1", "sku": "NK-AM24", "name": "Nike Air Max 2024", "onHand": 45 } ] }
```

### Đặt giữ tồn kho — POST /inventory/products/:id/reserve
Request body:
```json
{ "quantity": 3, "orderId": "ORD-901" }
```
Response 200
```json
{ "message": "Reserved", "reserved": 3, "remainingOnHand": 42 }
```
Lỗi 400 nếu không đủ hàng:
```json
{ "code": "INSUFFICIENT_STOCK", "message": "Không đủ tồn kho" }
```

### Giải phóng đặt giữ — POST /inventory/products/:id/release
Request body: `{ "quantity": 3, "orderId": "ORD-901" }`
Response 200 `{ "message": "Released", "remainingOnHand": 45 }`

### Cập nhật giá hàng loạt — POST /inventory/products/bulk-price-update
Request body:
```json
{ "items": [ { "id": "1", "price": 2300000 }, { "id": "2", "price": 21990000 } ] }
```
Response 200
```json
{ "updated": 2, "failed": 0 }
```

### Import CSV — POST /inventory/import
Request: multipart/form-data với field `file` (CSV)
Response 200 `{ "imported": 125, "errors": [] }`

### Ghi nhận nhập hàng (GRN) — POST /purchase/orders/:id/receive
Request body ví dụ:
```json
{
  "items": [ { "sku": "NK-AM24", "quantity": 10, "unitCost": 1500000 } ],
  "receivedBy": "user_001",
  "receivedDate": "2026-06-01"
}
```
Response 201 `{ "grnId": "GRN-2026-001", "message": "Received and stocked" }`

### Điều chỉnh tồn kho — POST /inventory/adjustments
Request body:
```json
{ "sku": "NK-AM24", "delta": -2, "reason": "DAMAGED", "reference": "ADJ-2026-55" }
```
Response 201 `{ "id": "ADJ-2026-55", "message": "Adjustment recorded" }`

### Audit — POST /inventory/audits/:id/start và /complete
Start: không body, Response 200 `{ "message": "Audit started", "status": "IN_PROGRESS" }`
Complete: body `{ "lineItems": [...] }`, Response 200 `{ "message": "Audit complete", "discrepancies": 12 }`

### Returns — POST /inventory/returns
Request ví dụ:
```json
{ "orderId": "ORD-901", "items": [ { "sku": "NK-AM24", "quantity": 1, "reason": "DEFECT" } ], "processedBy": "usr_002" }
```
Response 201 `{ "id": "RET-2026-01", "message": "Return processed" }`

### Webhooks — POST /webhooks/register
Request `{ "url": "https://example.com/webhook", "events": ["product.updated","stock.low"] }`
Response 201 `{ "id": "wh_123", "message": "Registered" }`

### Notifications — GET /notifications, POST /notifications/:id/read
GET trả về phân trang `{ data: [...], meta: {...} }`.
POST /notifications/:id/read trả về 200 `{ "message": "Marked read" }`.
