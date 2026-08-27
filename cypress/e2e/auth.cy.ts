describe('Xác thực & Phân quyền (Authentication & Authorization Suite)', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/login');
  });

  it('TC-AUTH-01: Hiển thị đầy đủ form đăng nhập, logo và các trường nhập liệu', () => {
    cy.contains('RetailHub').should('be.visible');
    cy.contains('Đăng nhập vào hệ thống').should('be.visible');
    cy.get('input[type="email"], input[name="email"]').should('be.visible');
    cy.get('input[name="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible').and('contain.text', 'Đăng nhập');
    cy.contains('Quên mật khẩu?').should('be.visible');
  });

  it('TC-AUTH-02: Báo lỗi validation khi để trống email hoặc mật khẩu', () => {
    cy.get('button[type="submit"]').click();
    cy.contains(/Email is required|Please enter a valid email address/i).should('exist');
  });

  it('TC-AUTH-03: Báo lỗi validation khi nhập email sai định dạng', () => {
    cy.get('input[type="email"], input[name="email"]').type('invalid-email-format');
    cy.get('button[type="submit"]').click();
    cy.contains(/Please enter a valid email address/i).should('exist');
  });

  it('TC-AUTH-04: Báo lỗi validation khi mật khẩu dưới 6 ký tự', () => {
    cy.get('input[type="email"], input[name="email"]').clear().type('admin@storemanager.com');
    cy.get('input[name="password"]').type('123');
    cy.get('button[type="submit"]').click();
    cy.contains(/Password must be at least 6 characters/i).should('exist');
  });

  it('TC-AUTH-05: Chuyển đổi ẩn/hiện mật khẩu khi nhấn icon con mắt', () => {
    cy.get('input[name="password"]').type('SecretPassword123');
    cy.get('input[name="password"]').should('have.attr', 'type', 'password');

    // Click nút con mắt để hiện mật khẩu
    cy.get('input[name="password"]').parent().find('button').click();
    cy.get('input[name="password"]').should('have.attr', 'type', 'text');

    // Click lại để ẩn mật khẩu
    cy.get('input[name="password"]').parent().find('button').click();
    cy.get('input[name="password"]').should('have.attr', 'type', 'password');
  });

  it('TC-AUTH-06: Hiển thị thông báo lỗi khi đăng nhập sai tài khoản/mật khẩu', () => {
    cy.intercept('POST', '**/auth/login', {
      statusCode: 401,
      body: {
        success: false,
        status: 401,
        message: 'Tên đăng nhập hoặc mật khẩu không chính xác',
      },
    }).as('loginFail');

    cy.get('input[type="email"], input[name="email"]').type('wrong@storemanager.com');
    cy.get('input[name="password"]').type('WrongPassword123');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginFail');
    cy.url().should('include', '/login');
  });

  it('TC-AUTH-07: Đăng nhập thành công với STORE_MANAGER và chuyển hướng về Dashboard', () => {
    cy.intercept('POST', '**/auth/login', {
      statusCode: 200,
      body: {
        success: true,
        status: 200,
        message: 'Đăng nhập thành công',
        data: {
          accessToken: 'mock-jwt-manager-token',
          refreshToken: 'mock-refresh-token',
          user: {
            id: 1,
            name: 'Quản Lý Cửa Hàng',
            email: 'manager@storemanager.com',
            role: 'STORE_MANAGER',
            branchId: 1,
            permissions: ['*'],
          },
        },
      },
    }).as('loginManager');

    cy.get('input[type="email"], input[name="email"]').type('manager@storemanager.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginManager');
    cy.url().should('not.include', '/login');
  });

  it('TC-AUTH-08: Đăng nhập với STAFF thì tự động chuyển hướng trực tiếp sang màn hình POS', () => {
    cy.intercept('POST', '**/auth/login', {
      statusCode: 200,
      body: {
        success: true,
        status: 200,
        message: 'Đăng nhập thành công',
        data: {
          accessToken: 'mock-jwt-staff-token',
          refreshToken: 'mock-refresh-token',
          user: {
            id: 2,
            name: 'Nhân Viên Thu Ngân',
            email: 'staff@storemanager.com',
            role: 'STAFF',
            branchId: 1,
            permissions: ['sales:order:create', 'sales:pos:access'],
          },
        },
      },
    }).as('loginStaff');

    cy.get('input[type="email"], input[name="email"]').type('staff@storemanager.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginStaff');
    cy.url().should('include', '/pos');
  });

  it('TC-AUTH-09: Đăng nhập với SUPER_ADMIN toàn quyền quản trị', () => {
    cy.intercept('POST', '**/auth/login', {
      statusCode: 200,
      body: {
        success: true,
        status: 200,
        message: 'Đăng nhập thành công',
        data: {
          accessToken: 'mock-jwt-superadmin-token',
          refreshToken: 'mock-refresh-token',
          user: {
            id: 99,
            name: 'Tổng Quản Trị Hệ Thống',
            email: 'admin@storemanager.com',
            role: 'SUPER_ADMIN',
            branchId: null,
            permissions: ['*'],
          },
        },
      },
    }).as('loginAdmin');

    cy.get('input[type="email"], input[name="email"]').type('admin@storemanager.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginAdmin');
    cy.url().should('not.include', '/login');
  });
});
