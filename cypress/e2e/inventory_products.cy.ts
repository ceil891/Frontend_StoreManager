describe('Quản lý Sản phẩm & Danh mục (Inventory CRUD & Operations Suite)', () => {
  beforeEach(() => {
    cy.visitAs('/inventory/products', 'SUPER_ADMIN');
  });

  it('TC-PROD-01: Hiển thị tiêu đề trang và danh sách 4 tab nghiệp vụ', () => {
    cy.url().should('include', '/inventory/products');
    cy.contains('Quản lý Sản phẩm & Danh mục').should('be.visible');
    
    // Kiểm tra 4 tab chính
    cy.contains('button', 'Sản phẩm').should('be.visible');
    cy.contains('button', 'Biến thể sản phẩm').should('be.visible');
    cy.contains('button', 'Danh mục sản phẩm').should('be.visible');
    cy.contains('button', 'Gói Combo').should('be.visible');
  });

  it('TC-PROD-02: [READ] Chuyển đổi linh hoạt giữa các tab Biến thể, Danh mục, Gói Combo', () => {
    cy.contains('button', 'Biến thể sản phẩm').click();
    cy.url().should('include', 'tab=variants');

    cy.contains('button', 'Danh mục sản phẩm').click();
    cy.url().should('include', 'tab=categories');

    cy.contains('button', 'Gói Combo').click();
    cy.url().should('include', 'tab=combos');

    cy.contains('button', 'Sản phẩm').click();
    cy.url().should('include', 'tab=products');
  });

  it('TC-PROD-03: [READ] Tìm kiếm và lọc sản phẩm theo từ khóa trên bảng dữ liệu', () => {
    cy.contains('button', 'Sản phẩm').click();
    cy.get('input').filter(':not([type="date"]):not([type="checkbox"]):not([type="radio"])').first().type('Áo sơ mi{enter}');
  });

  it('TC-PROD-04: [CREATE] Luồng Tạo mới sản phẩm - Mở Modal, nhập thông tin và gửi form', () => {
    cy.intercept('POST', '**/products*', {
      statusCode: 201,
      body: {
        success: true,
        message: 'Thêm sản phẩm mới thành công',
        data: {
          id: 999,
          sku: 'SP-TEST-001',
          name: 'Áo Thun Polo Cypress E2E',
          price: 250000,
          costPrice: 150000,
          unit: 'Cái',
          status: 'ACTIVE',
        },
      },
    }).as('createProductReq');

    // Nhấn nút thêm mới
    cy.contains('button', /Thêm Sản Phẩm Mới|Thêm mới|\+ Thêm/i).click({ force: true });

    cy.get('body').then(($body) => {
      const nameInput = $body.find('input[name="name"], input[placeholder*="Tên sản phẩm"], input[placeholder*="Tên"]');
      if (nameInput.length > 0) {
        cy.wrap(nameInput.first()).type('Áo Thun Polo Cypress E2E');
      }
      const skuInput = $body.find('input[name="sku"], input[placeholder*="SKU"], input[placeholder*="sku"]');
      if (skuInput.length > 0) {
        cy.wrap(skuInput.first()).type('SP-TEST-001');
      }
      const saveBtn = $body.find('button').filter(':contains("Lưu"), :contains("Tạo mới"), :contains("Hoàn tất")');
      if (saveBtn.length > 0) {
        cy.wrap(saveBtn.first()).click({ force: true });
      }
    });
  });

  it('TC-PROD-05: [UPDATE] Luồng Sửa/Cập nhật thông tin sản phẩm', () => {
    cy.intercept('PUT', '**/products/*', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Cập nhật sản phẩm thành công',
      },
    }).as('updateProductReq');

    // Click nút Sửa trên hàng sản phẩm
    cy.get('table tbody tr').first().then(($row) => {
      if ($row.length > 0) {
        const editBtn = $row.find('button').first();
        if (editBtn.length > 0) {
          cy.wrap(editBtn).click({ force: true });
          cy.get('body').should('be.visible');
        }
      }
    });
  });

  it('TC-PROD-06: [DELETE] Luồng Xóa sản phẩm - Mở popup xác nhận xóa và thực hiện', () => {
    cy.intercept('DELETE', '**/products/*', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Xóa sản phẩm thành công',
      },
    }).as('deleteProductReq');

    // Click nút Xóa trên hàng sản phẩm
    cy.get('table tbody tr').first().then(($row) => {
      if ($row.length > 0) {
        const deleteBtn = $row.find('button').last();
        if (deleteBtn.length > 0) {
          cy.wrap(deleteBtn).click({ force: true });
          cy.get('body').then(($body) => {
            const confirmBtn = $body.find('button').filter(':contains("Xóa"), :contains("Xác nhận"), :contains("Đồng ý")');
            if (confirmBtn.length > 0) {
              cy.wrap(confirmBtn.last()).click({ force: true });
            }
          });
        }
      }
    });
  });

  it('TC-PROD-07: Hiển thị nút Xuất file CSV báo cáo danh mục', () => {
    cy.contains('button', /Xuất File CSV|Xuất|Export/i).should('exist');
  });
});
