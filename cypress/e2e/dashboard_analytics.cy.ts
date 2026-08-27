describe('Dashboard & Báo cáo Quản trị (Dashboard & Analytics Suite)', () => {
  it('TC-DASH-01: Truy cập trang Tổng quan Dashboard và kiểm tra hiển thị KPI', () => {
    cy.visitAs('/', 'SUPER_ADMIN');
    cy.url().should('eq', `${Cypress.config().baseUrl}/`);
    cy.get('body').should('be.visible');
    cy.contains(/Tổng quan|Dashboard|Doanh thu|Bán hàng/i).should('exist');
  });

  it('TC-DASH-02: Truy cập trang Báo cáo Phân tích Bán hàng (Sales Report)', () => {
    cy.visitAs('/reports/sales', 'SUPER_ADMIN');
    cy.url().should('include', '/reports/sales');
    cy.contains(/Báo cáo|Doanh thu|Đơn hàng/i).should('exist');
  });

  it('TC-DASH-03: Truy cập trang Báo cáo Tồn kho & Xuất nhập tồn (Inventory Report)', () => {
    cy.visitAs('/reports/inventory', 'SUPER_ADMIN');
    cy.url().should('include', '/reports/inventory');
    cy.contains(/Báo cáo|Tồn kho|Xuất nhập tồn/i).should('exist');
  });

  it('TC-DASH-04: Truy cập trang Báo cáo Tài chính Dòng tiền (Finance Report)', () => {
    cy.visitAs('/reports/finance', 'SUPER_ADMIN');
    cy.url().should('include', '/reports/finance');
    cy.contains(/Báo cáo|Tài chính|Dòng tiền/i).should('exist');
  });

  it('TC-DASH-05: Truy cập trang Cài đặt tài khoản cá nhân người dùng', () => {
    cy.visitAs('/settings/account', 'SUPER_ADMIN');
    cy.url().should('include', '/settings/account');
    cy.contains(/Tài khoản|Thông tin cá nhân|Cài đặt/i).should('exist');
  });

  it('TC-DASH-06: Điều hướng Sidebar giữa Bán hàng, Kho hàng và Báo cáo', () => {
    cy.visitAs('/', 'SUPER_ADMIN');
    
    // Nhấp vào liên kết kho hàng trên thanh điều hướng
    cy.get('a[href*="/inventory/products"], a[href*="/inventory"]').first().click({ force: true });
    cy.url().should('include', '/inventory');
  });
});
