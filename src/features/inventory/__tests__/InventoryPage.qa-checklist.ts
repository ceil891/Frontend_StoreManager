/**
 * QA/TESTER DOCUMENTATION - INVENTORY PAGE FIXES
 * 
 * File: InventoryPage.tsx
 * Purpose: Comprehensive QA checklist for all 9 fixes
 * Status: Ready for testing
 */

export const QA_TESTER_CHECKLIST = {
  // ============================================
  // FIX #1: Format Tiền tệ
  // ============================================
  fix_01_currency_format: {
    title: "✅ Fix #1: Format Tiền tệ ($ → VNĐ + phân cách hàng nghìn)",
    issue: "Giá tiền đang hiển thị $2500000.00 và $22990000.00 - sai ký hiệu và không có phân cách",
    files_changed: ["InventoryPage.tsx - line 274"],
    implementation: {
      before: "<span>{value}</span>",
      after: "<span>{value.toLocaleString('vi-VN')}₫</span>",
      description: "Sử dụng toLocaleString('vi-VN') để format chuẩn Việt Nam + ký hiệu ₫"
    },
    test_cases: [
      {
        case: "TC_01_001",
        title: "Format số nhỏ",
        given: "Giá = 500",
        expected: "500₫",
        actual: "Check in Table"
      },
      {
        case: "TC_01_002",
        title: "Format số lớn",
        given: "Giá = 2500000",
        expected: "2.500.000₫",
        actual: "Check in Table"
      },
      {
        case: "TC_01_003",
        title: "Format số rất lớn",
        given: "Giá = 22990000",
        expected: "22.990.000₫",
        actual: "Check in Table"
      },
      {
        case: "TC_01_004",
        title: "Decimal places",
        given: "Giá = 1234.56",
        expected: "1.234,56₫ hoặc 1.235₫ (rounded)",
        note: "Kiểm tra xem có làm tròn hay giữ decimal không"
      }
    ],
    acceptance_criteria: [
      "✓ Ký hiệu $ phải thay bằng ₫",
      "✓ Phải có dấu phân cách hàng nghìn (dấu chấm)",
      "✓ Màu sắc phù hợp (xanh emerald cho giá bán)",
      "✓ Cột 'Giá Bán lẻ' trong Drawer phải cùng format"
    ]
  },

  // ============================================
  // FIX #2: Căn phải (Right-align)
  // ============================================
  fix_02_right_align: {
    title: "✅ Fix #2: Căn phải (right-align) cho các cột số",
    issue: "Cột 'Giá bán lẻ' và 'Tồn kho' đang căn giữa/trái, khó so sánh",
    files_changed: ["InventoryPage.tsx - line 274, 295"],
    implementation: {
      column_1: "Price column: text-right class + `meta: { align: 'right' }`",
      column_2: "OnHand column: <div className='text-right'>",
      description: "Số liệu nên căn phải để dễ so sánh độ dài"
    },
    test_cases: [
      {
        case: "TC_02_001",
        title: "Giá bán lẻ - căn phải",
        given: "3 sản phẩm có giá: 100, 10000, 1000000",
        expected: "Tất cả căn phải\n       100₫\n    10.000₫\n 1.000.000₫",
        actual: "Visual check in table"
      },
      {
        case: "TC_02_002",
        title: "Tồn kho - căn phải",
        given: "3 sản phẩm có tồn: 5, 150, 1000",
        expected: "Tất cả căn phải\n     5 Cái\n   150 Cái\n 1.000 Cái",
        actual: "Visual check in table"
      }
    ],
    acceptance_criteria: [
      "✓ Cột 'Giá Bán lẻ' phải căn phải (decimal points align)",
      "✓ Cột 'Tồn kho' phải căn phải",
      "✓ Không được căn trái hoặc căn giữa",
      "✓ Dễ dàng so sánh giá/tồn kho giữa các dòng"
    ]
  },

  // ============================================
  // FIX #3: UI Component Tag nhất quán
  // ============================================
  fix_03_consistent_tags: {
    title: "✅ Fix #3: Nhất quán UI Component Tag/Badge cho đơn vị",
    issue: "Dòng 1 dùng Tag badge 'Thùng = 10 Đôi', dòng 2 chỉ text 'Chỉ có Cái'",
    files_changed: ["InventoryPage.tsx - line 289-300"],
    implementation: {
      before: `if (alternateUnits.length === 0) return <span>Chỉ có {baseUnit}</span>`,
      after: `return <span className="...badge...">Chỉ {baseUnit}</span>`,
      description: "Cả trường hợp 'Chỉ có ...' và 'Thùng = ...' đều dùng Badge style"
    },
    test_cases: [
      {
        case: "TC_03_001",
        title: "Sản phẩm có quy đổi",
        given: "Sản phẩm có units = ['Thùng = 10 Đôi']",
        expected: "Badge xanh emerald: '1 Thùng = 10 Đôi'",
        actual: "Check in table"
      },
      {
        case: "TC_03_002",
        title: "Sản phẩm không có quy đổi",
        given: "Sản phẩm units = []",
        expected: "Badge xám: 'Chỉ Cái' (không phải text thường)",
        actual: "Check in table"
      },
      {
        case: "TC_03_003",
        title: "So sánh visual",
        given: "2 sản phẩm - 1 có quy đổi, 1 không",
        expected: "Cả 2 đều dùng badge, khác nhau là color (xanh vs xám)",
        actual: "Visual consistency check"
      }
    ],
    acceptance_criteria: [
      "✓ 'Chỉ {baseUnit}' phải là Badge (không phải text thường)",
      "✓ Badge 'Chỉ ...' phải màu xám/neutral",
      "✓ Badge 'Quy đổi' vẫn màu xanh emerald",
      "✓ Nhất quán visual style"
    ]
  },

  // ============================================
  // FIX #4: Responsive Design (Horizontal Scroll + Fixed Columns)
  // ============================================
  fix_04_responsive: {
    title: "✅ Fix #4: Responsive Design - Scroll ngang + Fixed Columns",
    issue: "Bảng có 10 cột, vỡ trên màn hình nhỏ (13' laptop, tablet)",
    files_changed: ["ReusableDataTable.tsx - thead & tbody", "InventoryPage.tsx - wrapper"],
    implementation: {
      method: "Fixed column technique",
      column_1: "SKU/Tên SP (cột đầu) - sticky left-0",
      column_last: "Thao tác (cột cuối) - sticky right-0",
      description: "Cột đầu và cuối fixed, còn lại scroll horizontal"
    },
    test_cases: [
      {
        case: "TC_04_001",
        title: "Desktop 1920px",
        given: "Mở trên màn hình 1920px",
        expected: "Toàn bộ 10 cột hiển thị, không scroll",
        environment: "Desktop 1920x1080"
      },
      {
        case: "TC_04_002",
        title: "Laptop 1366px",
        given: "Mở trên màn hình 1366px",
        expected: "Cột SKU & Thao tác fixed, scroll horizontal để xem Giá/Tồn kho",
        environment: "Laptop 1366x768"
      },
      {
        case: "TC_04_003",
        title: "Tablet 768px",
        given: "Mở trên iPad hoặc tablet 768px",
        expected: "Scroll horizontal, cột SKU & Thao tác luôn visible",
        environment: "Tablet 768x1024"
      },
      {
        case: "TC_04_004",
        title: "Mobile 375px",
        given: "Mở trên mobile 375px",
        expected: "Kích hoạt horizontal scroll, cột đầu/cuối fixed",
        note: "Trên mobile nên chuyển sang Card view (nice to have)"
      },
      {
        case: "TC_04_005",
        title: "Scroll performance",
        given: "Cuộn ngang trên bảng 100+ rows",
        expected: "Mượt 60fps, không bị lag",
        performance: "Check DevTools Performance"
      }
    ],
    acceptance_criteria: [
      "✓ Horizontal scroll phải hoạt động trên màn hình nhỏ",
      "✓ Cột SKU/Tên SP cố định bên trái (sticky left-0)",
      "✓ Cột Thao tác cố định bên phải (sticky right-0)",
      "✓ Không bị vỡ layout trên tablet/mobile",
      "✓ Fixed column có background color để phân biệt"
    ]
  },

  // ============================================
  // FIX #5: Delete/Disable chức năng rõ ràng
  // ============================================
  fix_05_delete_clear: {
    title: "✅ Fix #5: Thêm chức năng Delete/Disable rõ ràng",
    issue: "Cột 'Thao tác' chỉ có View & Edit, chưa rõ cách xóa/disable",
    files_changed: ["InventoryPage.tsx - actions column"],
    implementation: {
      action_1: "Edit (Bút) - onClick handleOpenEdit",
      action_2: "Delete (Trash) - onClick setDeletingProduct",
      action_3: "View (Mắt) - onClick setSelectedProduct",
      confirmation: "Modal xác nhận trước khi xóa"
    },
    test_cases: [
      {
        case: "TC_05_001",
        title: "Delete button hiển thị",
        given: "Nhìn cột 'Thao tác'",
        expected: "Có button Trash (xóa) bên cạnh Edit & View",
        actual: "Visual check"
      },
      {
        case: "TC_05_002",
        title: "Delete confirmation",
        given: "Click button Trash",
        expected: "Hiển thị Modal xác nhận: 'Bạn chắc chắn muốn xóa?'",
        actual: "Click & check modal"
      },
      {
        case: "TC_05_003",
        title: "Delete single product",
        given: "Confirm xóa 1 sản phẩm",
        expected: "Sản phẩm bị xóa, toast 'Đã xóa sản phẩm X'",
        actual: "Confirm & verify"
      },
      {
        case: "TC_05_004",
        title: "Bulk delete",
        given: "Chọn 3 items, click 'Xóa đã chọn'",
        expected: "Modal xác nhận: 'Xóa 3 sản phẩm?', toast xác nhận",
        actual: "Multi-select & delete"
      }
    ],
    acceptance_criteria: [
      "✓ Button Delete phải rõ ràng trong cột Thao tác",
      "✓ Phải có Modal xác nhận trước khi xóa",
      "✓ Toast message thông báo kết quả",
      "✓ Bulk delete phải có option"
    ]
  },

  // ============================================
  // FIX #6: Threshold Cảnh báo Tồn kho (Config)
  // ============================================
  fix_06_threshold_config: {
    title: "✅ Fix #6: Định nghĩa logic cảnh báo tồn kho (threshold)",
    issue: "Threshold fix cứng <= 5, cần config để quản trị viên tùy chỉnh",
    files_changed: ["settingsStore.ts (new)", "InventoryPage.tsx", "InventorySettingsPanel.tsx (new)"],
    implementation: {
      store: "useSettingsStore() - Zustand store with localStorage persist",
      default_value: "lowStockThreshold: 10",
      getter: "getLowStockThreshold()",
      setter: "setLowStockThreshold(value)",
      persistence: "Lưu vào localStorage"
    },
    features: [
      "Admin có thể thay đổi threshold trong Settings Panel",
      "Threshold được lưu vào localStorage (persist across refreshes)",
      "Tất cả cảnh báo trong page dùng config này"
    ],
    test_cases: [
      {
        case: "TC_06_001",
        title: "Default threshold = 10",
        given: "Mở page lần đầu",
        expected: "Sản phẩm có tồn kho ≤ 10 được cảnh báo",
        actual: "Check in table"
      },
      {
        case: "TC_06_002",
        title: "Change threshold via Settings",
        given: "Thay đổi threshold = 20 trong Settings Panel",
        expected: "Lưu vào localStorage, cảnh báo cập nhật ngay",
        actual: "Change & verify"
      },
      {
        case: "TC_06_003",
        title: "Persist after refresh",
        given: "Set threshold = 20, F5 refresh",
        expected: "Threshold vẫn = 20 (không reset)",
        actual: "Refresh & check"
      },
      {
        case: "TC_06_004",
        title: "Validation - negative input",
        given: "Cố gắng nhập -5",
        expected: "Không cho phép, toast error 'Threshold không thể âm'",
        actual: "Try to input & verify"
      },
      {
        case: "TC_06_005",
        title: "Preview in settings",
        given: "Xem preview trong Settings Panel",
        expected: "Preview 3 ví dụ (5, 10, 20) với status ⚠️/✓",
        actual: "Visual check"
      }
    ],
    acceptance_criteria: [
      "✓ Settings Store phải có getLowStockThreshold() method",
      "✓ Default threshold = 10",
      "✓ Lưu vào localStorage (persist)",
      "✓ InventoryPage sử dụng config này (không hardcode)",
      "✓ Settings Panel để admin tùy chỉnh",
      "✓ Toast notification khi save"
    ]
  },

  // ============================================
  // FIX #7: Placeholder Ngày tháng (dd/mm/yyyy)
  // ============================================
  fix_07_date_placeholder: {
    title: "✅ Fix #7: Fix placeholder ngày tháng (dd/mm/yyyy)",
    issue: "Placeholder ghi 'nn/mm/yyyy' thay vì 'dd/mm/yyyy' chuẩn Việt",
    files_changed: ["InventoryPage.tsx - label fix"],
    implementation: {
      before: "Placeholder 'nn/mm/yyyy'",
      after: "Label 'Cập nhật từ (dd/mm/yyyy):'",
      method: "HTML5 input type='date' tự động format theo locale"
    },
    test_cases: [
      {
        case: "TC_07_001",
        title: "Label text rõ ràng",
        given: "Nhìn filter Date",
        expected: "Label ghi '(dd/mm/yyyy)' - rõ ràng",
        actual: "Visual check"
      },
      {
        case: "TC_07_002",
        title: "Date picker input",
        given: "Click vào date input",
        expected: "Calendar picker mở, format dd/mm/yyyy",
        actual: "Click & verify"
      },
      {
        case: "TC_07_003",
        title: "Browser locale support",
        given: "Test trên chrome (Việt Nam)",
        expected: "Date format tự động theo browser locale",
        actual: "Test on different browsers"
      }
    ],
    acceptance_criteria: [
      "✓ Label phải ghi '(dd/mm/yyyy)' - chuẩn Việt",
      "✓ Input type='date' phải support calendar picker",
      "✓ Format phải dd/mm/yyyy (không nn/mm/yyyy)"
    ]
  },

  // ============================================
  // FIX #8: Pagination Test Cases
  // ============================================
  fix_08_pagination: {
    title: "✅ Fix #8: Test Pagination boundary cases",
    issue: "Tester cần test ranh giới: 0 items, 10 items, 11 items, etc.",
    files_created: ["InventoryPage.pagination.test-cases.ts"],
    test_cases_file: "See InventoryPage.pagination.test-cases.ts for full 10 test cases",
    summary: [
      "TC_001: Empty database (0 items)",
      "TC_002: Exact 10 items (1 page)",
      "TC_003: 11 items (2 pages)",
      "TC_004: 25 items (3 pages)",
      "TC_005: Change page size",
      "TC_006: Rapid navigation edge case",
      "TC_007: Filter impact on pagination",
      "TC_008: Bulk delete updates count",
      "TC_009: Large dataset (1000+ items)",
      "TC_010: Selection persist across pages"
    ],
    acceptance_criteria: [
      "✓ Số dòng ghi: 'Đã chọn X / Y dòng' phải đúng",
      "✓ Nút disable/enable logic: Prev disable ở T1, Next disable ở Tcuối",
      "✓ Mỗi trang hiển thị đúng số items (default 10)",
      "✓ Filter reset pagination về Trang 1",
      "✓ Xóa item cập nhật pagination real-time",
      "✓ Selection persist khi chuyển trang"
    ]
  },

  // ============================================
  // FIX #9: Empty State
  // ============================================
  fix_09_empty_state: {
    title: "✅ Fix #9: Thiết kế Empty State (không có dữ liệu)",
    issue: "Hiện tại chỉ show 'Không có dữ liệu' text, UX chưa tốt",
    files_changed: ["InventoryPage.tsx - line 390-410"],
    implementation: {
      components: [
        "Package2 icon",
        "Tiêu đề 'Không có sản phẩm'",
        "Mô tả phụ 'Hãy thêm sản phẩm...'",
        "Nút CTA 'thêm sản phẩm mới'"
      ]
    },
    test_cases: [
      {
        case: "TC_09_001",
        title: "Empty state khi 0 sản phẩm",
        given: "Database trống (0 items)",
        expected: "Hiển thị: Icon package + Tiêu đề + Mô tả + Nút Thêm",
        actual: "Visual check"
      },
      {
        case: "TC_09_002",
        title: "Empty state khi filter không có kết quả",
        given: "Filter: Trạng thái = 'Ngừng KD' nhưng 0 kết quả",
        expected: "Hiển thị: 'Không tìm thấy sản phẩm phù hợp'",
        actual: "Apply filter & check"
      },
      {
        case: "TC_09_003",
        title: "CTA button hoạt động",
        given: "Click 'thêm sản phẩm mới'",
        expected: "Modal Add Product mở",
        actual: "Click & verify modal"
      },
      {
        case: "TC_09_004",
        title: "Empty state styling",
        given: "Nhìn empty state UI",
        expected: "Có icon, centered, spacing đúng, responsive trên mobile",
        actual: "Visual & responsive check"
      }
    ],
    acceptance_criteria: [
      "✓ Phải có icon minh họa (Package2)",
      "✓ Phải có tiêu đề + mô tả chi tiết",
      "✓ Phải có nút CTA 'Thêm Sản Phẩm Mới'",
      "✓ UI phải centered, có proper spacing",
      "✓ Responsive trên mobile/tablet",
      "✓ 2 message khác nhau: 'Chưa có SP' vs 'Không tìm thấy'"
    ]
  }
};

// ============================================
// SUMMARY QA EXECUTION PLAN
// ============================================
export const QA_EXECUTION_PLAN = `
📋 QA EXECUTION PLAN - INVENTORY PAGE

🔴 PRIORITY FIXES (Làm trước):
1. TC_01: Currency Format ✓
2. TC_02: Right Align ✓
3. TC_03: Consistent Tags ✓
4. TC_06: Threshold Config ✓

🟡 SECONDARY FIXES (Làm sau):
5. TC_04: Responsive (Fixed Columns) ✓
6. TC_07: Date Placeholder ✓
7. TC_05: Delete Clear ✓

🟢 COMPREHENSIVE TESTING:
8. TC_08: Pagination (10 test cases)
9. TC_09: Empty State

📊 TOTAL TEST CASES: ~35 cases
⏱️ Estimated Time: 3-4 hours for full QA cycle

🎯 ACCEPTANCE CRITERIA:
- Format tiền tệ: 100% VNĐ format
- Right-align: All numeric columns aligned right
- Tags: Consistent badge styling
- Responsive: Fixed columns work on all screen sizes
- Threshold: Config persists in localStorage
- Date: Clear label (dd/mm/yyyy)
- Delete: Modal confirmation works
- Pagination: All 10 boundary cases pass
- Empty State: Shows icon + CTA
`;
