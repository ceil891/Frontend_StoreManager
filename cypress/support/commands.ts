/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to log in via UI
     * @example cy.login('admin@storemanager.com', 'admin123')
     */
    login(email?: string, password?: string): Chainable<void>;

    /**
     * Custom command to select DOM element by data-testid attribute.
     * @example cy.getByTestId('cart-drawer-toggle')
     */
    getByTestId(testId: string): Chainable<JQuery<HTMLElement>>;

    /**
     * Custom command to visit a URL with mocked authenticated session in localStorage
     */
    visitAs(url: string, role?: 'SUPER_ADMIN' | 'STORE_MANAGER' | 'STAFF'): Chainable<void>;
  }
}

Cypress.Commands.add('login', (email = 'admin@storemanager.com', password = 'password123') => {
  cy.visit('/login');
  cy.get('input[type="email"], input[name="email"]').clear().type(email);
  cy.get('input[type="password"], input[name="password"]').clear().type(password);
  cy.get('button[type="submit"]').click();
});

Cypress.Commands.add('getByTestId', (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`);
});

Cypress.Commands.add('visitAs', (url: string, role = 'SUPER_ADMIN') => {
  const mockUser = {
    id: '1',
    name: 'Quản Trị Viên',
    email: `${role.toLowerCase()}@storemanager.com`,
    role: role,
    branchId: '1',
    branchCode: 'CN01',
    branchName: 'Chi nhánh Trung tâm',
    permissions: ['*'],
  };

  const mockAuthState = {
    state: {
      user: mockUser,
      accessToken: 'mocked-access-token-cypress',
      refreshToken: 'mocked-refresh-token-cypress',
      isAuthenticated: true,
      isLoading: false,
      error: null,
    },
    version: 0,
  };

  cy.visit(url, {
    onBeforeLoad(win) {
      win.localStorage.setItem('retailhub-auth', JSON.stringify(mockAuthState));
      win.localStorage.setItem('access_token', 'mocked-access-token-cypress');
      win.localStorage.setItem('refresh_token', 'mocked-refresh-token-cypress');
    },
  });
});
