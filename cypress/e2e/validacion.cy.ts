describe("Validación del pedido", () => {
  beforeEach(() => {
    cy.resetTestData();
    cy.intercept("POST", "/api/orders").as("createOrder");
    cy.visit("/");
  });

  it("no envía la operación si el carrito está vacío", () => {
    cy.get('[data-cy="empty-cart"]').should("be.visible");
    cy.get('[data-cy="confirm-order"]').click();

    cy.get('[data-cy="error-banner"]').should("be.visible");
    cy.get('[data-cy="status-message"]').should(
      "contain",
      "El carrito está vacío. Agrega al menos un producto."
    );
    cy.get("@createOrder.all").should("have.length", 0);
  });

  it("no envía la operación si la cantidad es inválida", () => {
    cy.addProductToCart("latte");
    cy.get('[data-cy="cart-item-latte"]').within(() => {
      cy.get('[data-cy="qty-input"]').clear().type("0").blur();
    });

    cy.get('[data-cy="confirm-order"]').click();

    cy.get('[data-cy="error-banner"]').should("be.visible");
    cy.get('[data-cy="status-message"]').should("contain", "cantidades inválidas");
    cy.get("@createOrder.all").should("have.length", 0);
  });
});
