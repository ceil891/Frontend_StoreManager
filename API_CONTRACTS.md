# API Contracts — Priority Endpoints

This file contains example request/response contracts for priority endpoints used by the frontend.

---

## 1) Auth — POST /auth/login
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

Successful Response — 200 OK
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

Error Response — 401
```json
{ "code": "INVALID_CREDENTIALS", "message": "Incorrect password" }
```

---

## 2) Auth — POST /auth/refresh
Request

POST /auth/refresh
Content-Type: application/json

Body:
```json
{ "refreshToken": "<refresh-token>" }
```

Successful Response — 200
```json
{
  "accessToken": "new.access.token",
  "refreshToken": "new.refresh.token"
}
```

Error Response — 401
```json
{ "code": "INVALID_REFRESH", "message": "Refresh token invalid or expired" }
```

---

## 3) Products — GET /inventory/products
Request

GET /inventory/products?page=1&pageSize=10&search=nike&category=Th%E1%BB%8B%20trang
Headers: Authorization: Bearer <token>

Successful Response — 200
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

Error — 401 Unauthorized

---

## 4) Products — GET /inventory/products/:id
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

## 5) Products — POST /inventory/products
Request
POST /inventory/products
Headers: Authorization: Bearer <token>
Body (example):
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

Validation Error 400
```json
{ "code": "VALIDATION_ERROR", "message": "sku is required", "fields": { "sku": "required" } }
```

---

## 6) Stock Transfer — POST /inventory/transfers
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

## 7) Stock Ledger — GET /inventory/stock-ledger
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

## Common Error Format
All error responses should follow:
```json
{ "code": "ERROR_CODE", "message": "Human readable message", "details": { ... } }
```

---

## Additional Contracts — Operational Endpoints

### Autocomplete — GET /autocomplete/products
Request
GET /autocomplete/products?q=nike
Headers: Authorization: Bearer <token>

Response 200
```json
{
  "data": [
    { "id": "1", "sku": "NK-AM24", "name": "Nike Air Max 2024", "onHand": 45 }
  ]
}
```

### Reserve stock — POST /inventory/products/:id/reserve
Request
POST /inventory/products/1/reserve
Headers: Authorization: Bearer <token>
Body:
```json
{ "quantity": 3, "orderId": "ORD-901" }
```

Response 200
```json
{ "message": "Reserved", "reserved": 3, "remainingOnHand": 42 }
```

Error 400 if insufficient stock
```json
{ "code": "INSUFFICIENT_STOCK", "message": "Not enough units available" }
```

### Release reserved stock — POST /inventory/products/:id/release
Request Body: `{ "quantity": 3, "orderId": "ORD-901" }`
Response 200 `{ "message": "Released", "remainingOnHand": 45 }`

### Bulk price update — POST /inventory/products/bulk-price-update
Request
POST /inventory/products/bulk-price-update
Body:
```json
{ "items": [ { "id": "1", "price": 2300000 }, { "id": "2", "price": 21990000 } ] }
```

Response 200
```json
{ "updated": 2, "failed": 0 }
```

### Import products CSV — POST /inventory/import
Request: multipart/form-data with `file` field (CSV)

Response 200
```json
{ "imported": 125, "errors": [] }
```

### Receive PO (GRN) — POST /purchase/orders/:id/receive
Request body example:
```json
{
  "items": [ { "sku": "NK-AM24", "quantity": 10, "unitCost": 1500000 } ],
  "receivedBy": "user_001",
  "receivedDate": "2026-06-01"
}
```

Response 201
```json
{ "grnId": "GRN-2026-001", "message": "Received and stocked" }
```

### Inventory adjustment — POST /inventory/adjustments
Request
```json
{ "sku": "NK-AM24", "delta": -2, "reason": "DAMAGED", "reference": "ADJ-2026-55" }
```

Response 201
```json
{ "id": "ADJ-2026-55", "message": "Adjustment recorded" }
```

### Audit start/complete — POST /inventory/audits/:id/start and /complete
Start: no body, Response 200 `{ "message": "Audit started", "status": "IN_PROGRESS" }`
Complete: body `{ "lineItems": [...] }`, Response 200 `{ "message": "Audit complete", "discrepancies": 12 }`

### Returns — POST /inventory/returns
Request example:
```json
{ "orderId": "ORD-901", "items": [ { "sku": "NK-AM24", "quantity": 1, "reason": "DEFECT" } ], "processedBy": "usr_002" }
```

Response 201 `{ "id": "RET-2026-01", "message": "Return processed" }`

### Webhooks — POST /webhooks/register
Request `{ "url": "https://example.com/webhook", "events": ["product.updated","stock.low"] }`
Response 201 `{ "id": "wh_123", "message": "Registered" }`

### Notifications — GET /notifications, POST /notifications/:id/read
GET returns paginated notifications with `{ data: [...], meta: {...} }`.
POST /notifications/:id/read returns 200 `{ "message": "Marked read" }`.


---

## Additional Contracts — Operational Endpoints

### Autocomplete — GET /autocomplete/products
Request
GET /autocomplete/products?q=nike
Headers: Authorization: Bearer <token>

Response 200
```json
{
  "data": [
    { "id": "1", "sku": "NK-AM24", "name": "Nike Air Max 2024", "onHand": 45 }
  ]
}
```

### Reserve stock — POST /inventory/products/:id/reserve
Request
POST /inventory/products/1/reserve
Headers: Authorization: Bearer <token>
Body:
```json
{ "quantity": 3, "orderId": "ORD-901" }
```

Response 200
```json
{ "message": "Reserved", "reserved": 3, "remainingOnHand": 42 }
```

Error 400 if insufficient stock
```json
{ "code": "INSUFFICIENT_STOCK", "message": "Not enough units available" }
```

### Release reserved stock — POST /inventory/products/:id/release
Request Body: `{ "quantity": 3, "orderId": "ORD-901" }`
Response 200 `{ "message": "Released", "remainingOnHand": 45 }`

### Bulk price update — POST /inventory/products/bulk-price-update
Request
POST /inventory/products/bulk-price-update
Body:
```json
{ "items": [ { "id": "1", "price": 2300000 }, { "id": "2", "price": 21990000 } ] }
```

Response 200
```json
{ "updated": 2, "failed": 0 }
```

### Import products CSV — POST /inventory/import
Request: multipart/form-data with `file` field (CSV)

Response 200
```json
{ "imported": 125, "errors": [] }
```

### Receive PO (GRN) — POST /purchase/orders/:id/receive
Request body example:
```json
{
  "items": [ { "sku": "NK-AM24", "quantity": 10, "unitCost": 1500000 } ],
  "receivedBy": "user_001",
  "receivedDate": "2026-06-01"
}
```

Response 201
```json
{ "grnId": "GRN-2026-001", "message": "Received and stocked" }
```

### Inventory adjustment — POST /inventory/adjustments
Request
```json
{ "sku": "NK-AM24", "delta": -2, "reason": "DAMAGED", "reference": "ADJ-2026-55" }
```

Response 201
```json
{ "id": "ADJ-2026-55", "message": "Adjustment recorded" }
```

### Audit start/complete — POST /inventory/audits/:id/start and /complete
Start: no body, Response 200 `{ "message": "Audit started", "status": "IN_PROGRESS" }`
Complete: body `{ "lineItems": [...] }`, Response 200 `{ "message": "Audit complete", "discrepancies": 12 }`

### Returns — POST /inventory/returns
Request example:
```json
{ "orderId": "ORD-901", "items": [ { "sku": "NK-AM24", "quantity": 1, "reason": "DEFECT" } ], "processedBy": "usr_002" }
```

Response 201 `{ "id": "RET-2026-01", "message": "Return processed" }`

### Webhooks — POST /webhooks/register
Request `{ "url": "https://example.com/webhook", "events": ["product.updated","stock.low"] }`
Response 201 `{ "id": "wh_123", "message": "Registered" }`

### Notifications — GET /notifications, POST /notifications/:id/read
GET returns paginated notifications with `{ data: [...], meta: {...} }`.
POST /notifications/:id/read returns 200 `{ "message": "Marked read" }`.



