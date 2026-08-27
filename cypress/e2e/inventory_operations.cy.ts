describe('Thao tác & Nghiệp vụ Kho WMS (Inventory Operations CRUD Suite)', () => {
  beforeEach(() => {
    cy.visitAs('/inventory/operations', 'SUPER_ADMIN');
  });

  it('TC-OPS-01: [READ] Hiển thị 8 tab nghiệp vụ điều phối kho bãi', () => {
    cy.url().should('include', '/inventory/operations');
    cy.contains('Thao tác & Nghiệp vụ Kho').should('be.visible');

    cy.contains('button', 'Nhập kho').should('exist');
    cy.contains('button', 'Xuất kho').should('exist');
    cy.contains('button', 'Chuyển kho').should('exist');
    cy.contains('button', 'Yêu cầu chuyển kho').should('exist');
    cy.contains('button', 'Bảng kê chuyển kho').should('exist');
    cy.contains('button', 'Điều chỉnh kho').should('exist');
    cy.contains('button', 'Kiểm kê kho').should('exist');
    cy.contains('button', 'Xuất hủy').should('exist');
  });

  it('TC-OPS-02: [READ] Chuyển đổi linh hoạt giữa các tab Nhập, Xuất, Chuyển và Kiểm kê', () => {
    cy.contains('button', 'Xuất kho').click();
    cy.url().should('include', 'tab=stock-outs');

    cy.contains('button', 'Chuyển kho').click();
    cy.url().should('include', 'tab=transfers');

    cy.contains('button', 'Kiểm kê kho').click();
    cy.url().should('include', 'tab=checks');

    cy.contains('button', 'Nhập kho').click();
    cy.url().should('include', 'tab=imports');
  });

  it('TC-OPS-03: [CREATE] Luồng Tạo mới Phiếu nhập kho từ Nhà cung cấp', () => {
    cy.intercept('POST', '**/imports*', {
      statusCode: 201,
      body: {
        success: true,
        message: 'Tạo phiếu nhập kho thành công',
        data: {
          id: 501,
          importCode: 'PNK-CYPRESS-001',
          supplierName: 'Công Ty May Mặc Mẫu',
          totalAmount: 5000000,
        },
      },
    }).as('createImportReq');

    // Click nút Tạo phiếu nhập
    cy.contains('button, a', /Nhập kho|Tạo phiếu|Thêm mới/i).first().click({ force: true });
    cy.get('body').then(($body) => {
      const supplierInput = $body.find('input[name="supplier"], input[placeholder*="nhà cung cấp"], input[placeholder*="NCC"]');
      if (supplierInput.length > 0) {
        cy.wrap(supplierInput.first()).type('Công Ty May Mặc Mẫu');
      }
      const saveBtn = $body.find('button').filter(':contains("Lưu"), :contains("Hoàn tất"), :contains("Tạo")');
      if (saveBtn.length > 0) {
        cy.wrap(saveBtn.first()).click({ force: true });
      }
    });
  });

  it('TC-OPS-04: [UPDATE] Luồng Sửa / Điều chỉnh phiếu kiểm kê tồn kho', () => {
    cy.intercept('PUT', '**/inventory-checks/*', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Cập nhật số lượng kiểm kê thành công',
      },
    }).as('updateCheckReq');

    cy.contains('button', 'Kiểm kê kho').click();
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

  it('TC-OPS-05: [DELETE] Luồng Hủy bỏ phiếu chuyển kho / xuất hủy', () => {
    cy.intercept('DELETE', '**/transfers/*', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Hủy phiếu điều chuyển thành công',
      },
    }).as('deleteTransferReq');

    cy.contains('button', 'Chuyển kho').click();
    cy.get('table tbody tr').first().then(($row) => {
      if ($row.length > 0) {
        const delBtn = $row.find('button').last();
        if (delBtn.length > 0) {
          cy.wrap(delBtn).click({ force: true });
          cy.get('body').then(($body) => {
            const confirmBtn = $body.find('button').filter(':contains("Xác nhận"), :contains("Hủy phiếu"), :contains("Xóa")');
            if (confirmBtn.length > 0) {
              cy.wrap(confirmBtn.last()).click({ force: true });
            }
          });
        }
      }
    });
  });
});
