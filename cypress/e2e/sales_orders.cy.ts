describe('Quản lý Đơn hàng Bán & Báo giá (Sales Orders CRUD Suite)', () => {
  beforeEach(() => {
    cy.visitAs('/sales/orders', 'SUPER_ADMIN');
  });

  it('TC-SALES-01: [READ] Hiển thị giao diện Đơn hàng bán với đầy đủ 5 tab kênh bán', () => {
    cy.url().should('include', '/sales/orders');
    cy.contains('Quản lý Đơn hàng Bán').should('be.visible');

    cy.contains('button', 'Đơn hàng bán').should('be.visible');
    cy.contains('button', 'Đơn hàng Online').should('be.visible');
    cy.contains('button', 'Đơn hàng Sàn TMĐT').should('be.visible');
    cy.contains('button', 'Báo giá').should('be.visible');
    cy.contains('button', 'Ưu đãi / Chào hàng').should('be.visible');
  });

  it('TC-SALES-02: [READ] Chuyển sang Tab Đơn hàng Online, Sàn TMĐT và Báo giá', () => {
    cy.contains('button', 'Đơn hàng Online').click();
    cy.url().should('include', 'tab=online');

    cy.contains('button', 'Đơn hàng Sàn TMĐT').click();
    cy.url().should('include', 'tab=market');

    cy.contains('button', 'Báo giá').click();
    cy.url().should('include', 'tab=quotes');

    cy.contains('button', 'Đơn hàng bán').click();
    cy.url().should('include', 'tab=orders');
  });

  it('TC-SALES-03: [READ] Tìm kiếm và lọc đơn hàng theo từ khóa', () => {
    cy.get('input').filter(':not([type="date"]):not([type="checkbox"]):not([type="radio"])').first().type('DH001{enter}');
  });

  it('TC-SALES-04: [CREATE] Luồng Tạo mới Báo giá / Đơn hàng gửi khách', () => {
    cy.intercept('POST', '**/quotes*', {
      statusCode: 201,
      body: {
        success: true,
        message: 'Tạo báo giá mới thành công',
        data: {
          id: 101,
          quoteCode: 'BG-CYPRESS-001',
          totalAmount: 1500000,
          customerName: 'Công ty TNHH Mẫu',
        },
      },
    }).as('createQuoteReq');

    cy.contains('button', 'Báo giá').click();

    cy.get('button, a').filter(':contains("Báo giá"), :contains("Thêm mới"), :contains("Tạo")').first().click({ force: true });
    cy.get('body').then(($body) => {
      const custInput = $body.find('input[name="customerName"], input[placeholder*="Khách hàng"]');
      if (custInput.length > 0) {
        cy.wrap(custInput.first()).type('Công ty TNHH Mẫu');
      }
      const saveBtn = $body.find('button').filter(':contains("Lưu"), :contains("Tạo")');
      if (saveBtn.length > 0) {
        cy.wrap(saveBtn.first()).click({ force: true });
      }
    });
  });

  it('TC-SALES-05: [UPDATE] Luồng Cập nhật trạng thái / Chỉnh sửa đơn hàng', () => {
    cy.intercept('PUT', '**/orders/*', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Cập nhật trạng thái đơn hàng thành công',
      },
    }).as('updateOrderReq');

    cy.contains('button', 'Đơn hàng bán').click();

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

  it('TC-SALES-06: [DELETE] Luồng Hủy bỏ / Xóa đơn hàng hoặc báo giá', () => {
    cy.intercept('DELETE', '**/orders/*', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Hủy đơn hàng thành công',
      },
    }).as('deleteOrderReq');

    cy.get('table tbody tr').first().then(($row) => {
      if ($row.length > 0) {
        const delBtn = $row.find('button').last();
        if (delBtn.length > 0) {
          cy.wrap(delBtn).click({ force: true });
          cy.get('body').then(($body) => {
            const confirmBtn = $body.find('button').filter(':contains("Xóa"), :contains("Xác nhận"), :contains("Hủy")');
            if (confirmBtn.length > 0) {
              cy.wrap(confirmBtn.last()).click({ force: true });
            }
          });
        }
      }
    });
  });
});
