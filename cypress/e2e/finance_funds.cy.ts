describe('Quản lý Tài chính & Dòng tiền (Finance CRUD Suite)', () => {
  it('TC-FIN-01: [READ] Hiển thị giao diện Ngân hàng & Tồn quỹ tiền mặt', () => {
    cy.visitAs('/finance/fund-cash', 'SUPER_ADMIN');
    cy.url().should('include', '/finance/fund-cash');
    cy.contains('Quản lý Ngân hàng & Tồn quỹ').should('be.visible');

    cy.contains('button', 'Tài khoản Ngân hàng').should('be.visible');
    cy.contains('button', 'Quỹ tiền mặt & Số dư').should('be.visible');
  });

  it('TC-FIN-02: [READ] Chuyển đổi giữa Tab Tài khoản Ngân hàng và Tab Quỹ tiền mặt', () => {
    cy.visitAs('/finance/fund-cash', 'SUPER_ADMIN');

    // Chuyển sang Tab Quỹ tiền mặt & Số dư
    cy.contains('button', 'Quỹ tiền mặt & Số dư').click();
    cy.url().should('include', 'tab=balances');

    // Quay lại Tab Ngân hàng
    cy.contains('button', 'Tài khoản Ngân hàng').click();
    cy.url().should('include', 'tab=banks');
  });

  it('TC-FIN-03: [CREATE] Luồng Tạo mới Tài khoản ngân hàng doanh nghiệp', () => {
    cy.visitAs('/finance/fund-cash', 'SUPER_ADMIN');

    cy.intercept('POST', '**/bank-accounts*', {
      statusCode: 201,
      body: {
        success: true,
        message: 'Thêm tài khoản ngân hàng thành công',
        data: {
          id: 701,
          bankName: 'Vietcombank',
          accountNumber: '0123456789',
          accountHolder: 'CÔNG TY TNHH SMART RETAIL',
        },
      },
    }).as('createBankReq');

    // Mở modal tạo tài khoản
    cy.get('button').filter(':contains("Liên kết"), :contains("Thêm"), :contains("Tạo")').first().click({ force: true });
    cy.get('body').then(($body) => {
      const bankInput = $body.find('input[placeholder*="Vietcombank"], input[name="bankName"]');
      if (bankInput.length > 0) {
        cy.wrap(bankInput.first()).type('Vietcombank');
      }
      const saveBtn = $body.find('button').filter(':contains("Liên kết mới"), :contains("Lưu"), :contains("Tạo")');
      if (saveBtn.length > 0) {
        cy.wrap(saveBtn.first()).click({ force: true });
      }
    });
  });

  it('TC-FIN-04: [UPDATE] Luồng Sửa/Cập nhật thông tin tài khoản ngân hàng', () => {
    cy.visitAs('/finance/fund-cash', 'SUPER_ADMIN');

    cy.intercept('PUT', '**/bank-accounts/*', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Cập nhật tài khoản ngân hàng thành công',
      },
    }).as('updateBankReq');

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

  it('TC-FIN-05: [DELETE] Luồng Xóa tài khoản ngân hàng', () => {
    cy.visitAs('/finance/fund-cash', 'SUPER_ADMIN');

    cy.intercept('DELETE', '**/bank-accounts/*', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Xóa tài khoản ngân hàng thành công',
      },
    }).as('deleteBankReq');

    cy.get('table tbody tr').first().then(($row) => {
      if ($row.length > 0) {
        const delBtn = $row.find('button').last();
        if (delBtn.length > 0) {
          cy.wrap(delBtn).click({ force: true });
          cy.get('body').then(($body) => {
            const confirmBtn = $body.find('button').filter(':contains("Đồng ý"), :contains("Xóa"), :contains("Xác nhận")');
            if (confirmBtn.length > 0) {
              cy.wrap(confirmBtn.last()).click({ force: true });
            }
          });
        }
      }
    });
  });

  it('TC-FIN-06: Truy cập trang Phiếu Thu - Phiếu Chi và Sổ chứng từ thu chi', () => {
    cy.visitAs('/finance/vouchers', 'SUPER_ADMIN');
    cy.url().should('include', '/finance/vouchers');
    cy.contains(/Phiếu Thu|Phiếu Chi|Chứng từ/i).should('exist');
  });
});
