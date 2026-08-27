describe('Bảo vệ Tuyến đường & Phân quyền (Route Guards & Permissions Suite)', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it('TC-GUARD-01: Chặn truy cập trang Kho hàng khi chưa đăng nhập -> Chuyển hướng về /login', () => {
    cy.visit('/inventory/products');
    cy.url().should('include', '/login');
  });

  it('TC-GUARD-02: Chặn truy cập trang Bán hàng POS khi chưa đăng nhập -> Chuyển hướng về /login', () => {
    cy.visit('/pos');
    cy.url().should('include', '/login');
  });

  it('TC-GUARD-03: Chặn truy cập trang Đơn hàng bán khi chưa đăng nhập -> Chuyển hướng về /login', () => {
    cy.visit('/sales/orders');
    cy.url().should('include', '/login');
  });

  it('TC-GUARD-04: Chặn truy cập trang Tài chính dòng tiền khi chưa đăng nhập -> Chuyển hướng về /login', () => {
    cy.visit('/finance/fund-cash');
    cy.url().should('include', '/login');
  });

  it('TC-GUARD-05: Chặn truy cập trang Quản lý khách hàng CRM khi chưa đăng nhập -> Chuyển hướng về /login', () => {
    cy.visit('/crm/customers');
    cy.url().should('include', '/login');
  });

  it('TC-GUARD-06: Đã đăng nhập với SUPER_ADMIN -> Truy cập thành công vào trang Dashboard', () => {
    cy.visitAs('/', 'SUPER_ADMIN');
    cy.url().should('not.include', '/login');
  });

  it('TC-GUARD-07: Đã đăng nhập với STAFF -> Truy cập thành công vào màn hình POS', () => {
    cy.visitAs('/pos', 'STAFF');
    cy.url().should('include', '/pos');
    cy.url().should('not.include', '/login');
  });
});
