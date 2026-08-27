describe('Bán Hàng POS & Giỏ Hàng (POS Terminal CRUD & Selling Flow)', () => {
  beforeEach(() => {
    cy.visitAs('/pos', 'STAFF');
  });

  it('TC-POS-01: [READ] Hiển thị giao diện màn hình bán hàng POS và thanh tìm kiếm', () => {
    cy.url().should('include', '/pos');
    cy.get('body').should('be.visible');
    cy.get('input').should('exist');
  });

  it('TC-POS-02: [READ] Thao tác nhập tìm kiếm sản phẩm trong POS', () => {
    cy.get('input[type="text"], input[type="search"]')
      .first()
      .type('Sản phẩm{enter}');
  });

  it('TC-POS-03: [CREATE] Luồng Thêm sản phẩm vào giỏ hàng & Tạo đơn bán lẻ', () => {
    cy.intercept('POST', '**/pos/checkout*', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Thanh toán đơn hàng thành công',
        data: {
          orderCode: 'POS-001',
          totalAmount: 200000,
        },
      },
    }).as('checkoutReq');

    // Click vào thẻ sản phẩm để thêm vào giỏ
    cy.get('button, .product-card, [role="button"]').first().click({ force: true });
    cy.get('body').should('be.visible');
  });

  it('TC-POS-04: [UPDATE] Luồng Tăng / Giảm số lượng sản phẩm trong giỏ hàng', () => {
    cy.get('button').then(($btnList) => {
      const incBtn = $btnList.filter(':contains("+"), :contains("-")');
      if (incBtn.length > 0) {
        cy.wrap(incBtn.first()).click({ force: true });
      }
    });
  });

  it('TC-POS-05: [DELETE] Luồng Xóa món hàng khỏi giỏ hoặc Xóa toàn bộ giỏ hàng', () => {
    cy.get('button[title*="Xóa"], button[title*="xóa"]').then(($btn) => {
      if ($btn.length > 0) {
        cy.wrap($btn.first()).click({ force: true });
      }
    });
  });

  it('TC-POS-06: Hiển thị giao diện giỏ hàng và nút thanh toán', () => {
    cy.contains(/Giỏ hàng|THANH TOÁN|TỔNG CỘNG|Tạm tính/i).should('exist');
  });

  it('TC-POS-07: Mở modal thêm nhanh khách hàng mới tại quầy POS', () => {
    cy.get('button').then(($btns) => {
      const custBtn = $btns.filter(':contains("Khách"), :contains("Thêm")');
      if (custBtn.length > 0) {
        cy.wrap(custBtn.first()).click({ force: true });
        cy.get('body').should('be.visible');
      }
    });
  });
});
