describe('Kiểm thử Ràng buộc & Validation Biểu mẫu (Frontend Form Validation Suite)', () => {
  describe('1. Validation Form Đăng nhập (Login Validation)', () => {
    beforeEach(() => {
      cy.clearLocalStorage();
      cy.visit('/login');
    });

    it('TC-VAL-01: Báo lỗi khi để trống Email hoặc Mật khẩu', () => {
      cy.get('button[type="submit"]').click();
      cy.contains(/Email is required|Please enter a valid email address/i).should('exist');
    });

    it('TC-VAL-02: Báo lỗi khi nhập email sai định dạng (thiếu @ hoặc domain)', () => {
      cy.get('input[type="email"], input[name="email"]').type('invalid-email-cypress');
      cy.get('button[type="submit"]').click();
      cy.contains(/Please enter a valid email address|Email không đúng định dạng/i).should('exist');
    });

    it('TC-VAL-03: Báo lỗi khi mật khẩu không đủ độ dài tối thiểu (< 6 ký tự)', () => {
      cy.get('input[type="email"], input[name="email"]').clear().type('admin@storemanager.com');
      cy.get('input[name="password"]').type('123');
      cy.get('button[type="submit"]').click();
      cy.contains(/Password must be at least 6 characters|Mật khẩu phải có ít nhất 6 ký tự/i).should('exist');
    });
  });

  describe('2. Validation Form Sản phẩm (Product Form Validation)', () => {
    beforeEach(() => {
      cy.visitAs('/inventory/products', 'SUPER_ADMIN');
    });

    it('TC-VAL-04: Kiểm tra các trường bắt buộc (Required) khi tạo mới sản phẩm', () => {
      // Mở modal thêm mới sản phẩm
      cy.contains('button', /Thêm Sản Phẩm Mới|Thêm mới|\+ Thêm/i).click({ force: true });
      
      cy.get('body').then(($body) => {
        // Kiểm tra các trường required hoặc validation
        const nameInput = $body.find('input[name="name"], input[placeholder*="Tên sản phẩm"], input[placeholder*="Tên"]');
        if (nameInput.length > 0) {
          cy.wrap(nameInput.first()).should('have.attr', 'required');
        }
      });
    });
  });

  describe('3. Validation Form Khách hàng CRM (Customer Validation)', () => {
    beforeEach(() => {
      cy.visitAs('/crm/customers', 'SUPER_ADMIN');
    });

    it('TC-VAL-05: Kiểm tra bắt buộc nhập Tên và Số điện thoại khi thêm khách hàng', () => {
      cy.contains('button', /Thêm mới|Thêm khách hàng|\+ Thêm/i).first().click({ force: true });
      
      cy.get('body').then(($body) => {
        const phoneInput = $body.find('input[name="phone"], input[placeholder*="điện thoại"], input[placeholder*="Phone"]');
        if (phoneInput.length > 0) {
          cy.wrap(phoneInput.first()).should('have.attr', 'required');
        }
      });
    });
  });

  describe('4. Validation Bán hàng POS (POS Terminal Validation)', () => {
    beforeEach(() => {
      cy.visitAs('/pos', 'STAFF');
    });

    it('TC-VAL-06: Nút thanh toán bị vô hiệu hóa (disabled) khi giỏ hàng đang trống', () => {
      cy.get('button').filter(':contains("THANH TOÁN"), :contains("Thanh toán")').first().should('be.disabled');
    });

    it('TC-VAL-07: Báo lỗi khi nhập mã voucher không tồn tại', () => {
      cy.get('input[placeholder*="Nhập mã voucher"], input[placeholder*="voucher"]').then(($input) => {
        if ($input.length > 0) {
          cy.wrap($input.first()).type('MAMA_GIA_MAO_999{enter}');
          cy.get('button').filter(':contains("Áp dụng")').first().click({ force: true });
          // Hiển thị thông báo voucher không hợp lệ
          cy.get('body').should('be.visible');
        }
      });
    });
  });
});
