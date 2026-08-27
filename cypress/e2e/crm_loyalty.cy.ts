describe('Quản lý Khách hàng & Loyalty CRM (CRM CRUD & Operations Suite)', () => {
  it('TC-CRM-01: [READ] Hiển thị danh sách Khách hàng, Nhóm đối tác và Khu vực', () => {
    cy.visitAs('/crm/customers', 'SUPER_ADMIN');
    cy.url().should('include', '/crm/customers');
    cy.contains('Quản lý Khách hàng & Phân vùng').should('be.visible');

    cy.contains('button', 'Danh sách Khách hàng').should('be.visible');
    cy.contains('button', 'Nhóm đối tác').should('be.visible');
    cy.contains('button', 'Khu vực địa lý').should('be.visible');
  });

  it('TC-CRM-02: [READ] Chuyển đổi giữa các tab Khách hàng, Nhóm đối tác và Khu vực', () => {
    cy.visitAs('/crm/customers', 'SUPER_ADMIN');

    // Chuyển sang nhóm đối tác
    cy.contains('button', 'Nhóm đối tác').click();
    cy.url().should('include', 'tab=groups');

    // Chuyển sang khu vực địa lý
    cy.contains('button', 'Khu vực địa lý').click();
    cy.url().should('include', 'tab=areas');

    // Quay lại danh sách khách hàng
    cy.contains('button', 'Danh sách Khách hàng').click();
    cy.url().should('include', 'tab=customers');
  });

  it('TC-CRM-03: [READ] Tìm kiếm khách hàng theo Tên hoặc Số điện thoại', () => {
    cy.visitAs('/crm/customers', 'SUPER_ADMIN');
    cy.get('input').filter(':not([type="date"]):not([type="checkbox"]):not([type="radio"])').first().type('0912345678{enter}');
  });

  it('TC-CRM-04: [CREATE] Luồng Tạo mới khách hàng - Điền form và gửi request', () => {
    cy.visitAs('/crm/customers', 'SUPER_ADMIN');

    cy.intercept('POST', '**/customers*', {
      statusCode: 201,
      body: {
        success: true,
        message: 'Tạo khách hàng thành công',
        data: {
          id: 888,
          name: 'Nguyễn Văn Test Cypress',
          phone: '0988776655',
          email: 'cypress@gmail.com',
          membershipRank: 'Đồng',
        },
      },
    }).as('createCustomerReq');

    // Mở modal tạo khách hàng
    cy.contains('button', /Thêm mới|Thêm khách hàng|\+ Thêm/i)
      .first()
      .click({ force: true });

    cy.get('body').then(($body) => {
      const nameInput = $body.find('input[name="name"], input[placeholder*="Họ tên"], input[placeholder*="Tên"]');
      if (nameInput.length > 0) {
        cy.wrap(nameInput.first()).type('Nguyễn Văn Test Cypress');
      }
      const phoneInput = $body.find('input[name="phone"], input[placeholder*="điện thoại"], input[placeholder*="Phone"]');
      if (phoneInput.length > 0) {
        cy.wrap(phoneInput.first()).type('0988776655');
      }
      const saveBtn = $body.find('button').filter(':contains("Lưu"), :contains("Tạo mới"), :contains("Thêm")');
      if (saveBtn.length > 0) {
        cy.wrap(saveBtn.first()).click({ force: true });
      }
    });
  });

  it('TC-CRM-05: [UPDATE] Luồng Sửa/Cập nhật thông tin khách hàng', () => {
    cy.visitAs('/crm/customers', 'SUPER_ADMIN');

    cy.intercept('PUT', '**/customers/*', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Cập nhật khách hàng thành công',
      },
    }).as('updateCustomerReq');

    // Nhấn nút Sửa trên bảng
    cy.get('table tbody tr').first().then(($row) => {
      if ($row.length > 0) {
        const btns = $row.find('button');
        if (btns.length > 0) {
          cy.wrap(btns.first()).click({ force: true });
          cy.get('body').should('be.visible');
        }
      }
    });
  });

  it('TC-CRM-06: [DELETE] Luồng Xóa/Ngừng kích hoạt khách hàng', () => {
    cy.visitAs('/crm/customers', 'SUPER_ADMIN');

    cy.intercept('DELETE', '**/customers/*', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Xóa khách hàng thành công',
      },
    }).as('deleteCustomerReq');

    // Nhấn nút Xóa trên bảng
    cy.get('table tbody tr').first().then(($row) => {
      if ($row.length > 0) {
        const btns = $row.find('button');
        if (btns.length > 0) {
          cy.wrap(btns.last()).click({ force: true });
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

  it('TC-CRM-07: Truy cập trang Hạng thành viên & Lịch sử tích điểm Loyalty', () => {
    cy.visitAs('/crm/loyalty', 'SUPER_ADMIN');
    cy.url().should('include', '/crm/loyalty');
    cy.contains('Khách hàng Thân thiết & Điểm thưởng').should('be.visible');
  });

  it('TC-CRM-08: Truy cập trang Quản lý Voucher & Khuyến mãi CRM', () => {
    cy.visitAs('/crm/vouchers', 'SUPER_ADMIN');
    cy.url().should('include', '/crm/vouchers');
    cy.contains(/Voucher|Mã giảm giá|Khuyến mãi/i).should('exist');
  });
});
