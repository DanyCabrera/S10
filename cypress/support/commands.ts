declare global {
  namespace Cypress {
    interface Chainable {
      resetTestData(): Chainable<void>;
      addProductToCart(productId: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add("resetTestData", () => {
  cy.request("POST", "/api/test/reset");
});

Cypress.Commands.add("addProductToCart", (productId: string) => {
  cy.get(`[data-cy="product-${productId}"]`).within(() => {
    cy.get('[data-cy="add-to-cart"]').click();
  });
});

export {};
