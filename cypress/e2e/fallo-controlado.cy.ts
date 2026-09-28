describe("Fallo controlado de la API", () => {
  beforeEach(() => {
    cy.resetTestData();
  });

  it("muestra el error de API y permite recuperar la interfaz", () => {
    let shouldFail = true;

    cy.intercept("POST", "/api/orders", (req) => {
      if (shouldFail) {
        shouldFail = false;
        req.reply({
          statusCode: 500,
          body: {
            error: "No se pudo confirmar el pedido.",
            code: "SERVER_ERROR",
          },
        });
        return;
      }
      req.continue();
    }).as("createOrder");

    cy.visit("/");
    cy.addProductToCart("americano");
    cy.get('[data-cy="cart-total"]').should("have.text", "$2.50");

    cy.get('[data-cy="confirm-order"]').click();
    cy.wait("@createOrder").its("response.statusCode").should("eq", 500);

    cy.get('[data-cy="error-banner"]').should("be.visible");
    cy.get('[data-cy="status-message"]').should(
      "contain",
      "No se pudo confirmar el pedido."
    );
    cy.get('[data-cy="catalog-view"]').should("be.visible");
    cy.get('[data-cy="order-success"]').should("not.be.visible");
    cy.get('[data-cy="cart-item-americano"]').should("be.visible");

    cy.get('[data-cy="retry-order"]').click();
    cy.wait("@createOrder").its("response.statusCode").should("eq", 201);

    cy.get('[data-cy="order-success"]').should("be.visible");
    cy.get('[data-cy="order-id"]').should("have.text", "PED-1001");
    cy.get('[data-cy="order-total"]').should("have.text", "$2.50");
    cy.get('[data-cy="success-banner"]').should("be.visible");
  });

  it("muestra falta de existencias y permite armar otro pedido", () => {
    cy.intercept("POST", "/api/orders").as("createOrder");
    cy.visit("/");
    cy.addProductToCart("croissant");

    cy.request("POST", "/api/orders", {
      items: [{ productId: "croissant", quantity: 1 }],
    });

    cy.get('[data-cy="confirm-order"]').click();
    cy.wait("@createOrder").its("response.statusCode").should("eq", 409);
    cy.get('[data-cy="error-banner"]').should("be.visible");
    cy.get('[data-cy="status-message"]').should("contain", "existencias suficientes");
    cy.get('[data-cy="order-success"]').should("not.be.visible");

    cy.get('[data-cy="cart-item-croissant"]').within(() => {
      cy.get('[data-cy="qty-decrease"]').click();
    });
    cy.addProductToCart("americano");
    cy.get('[data-cy="confirm-order"]').click();
    cy.wait("@createOrder").its("response.statusCode").should("eq", 201);

    cy.get('[data-cy="order-success"]').should("be.visible");
    cy.get('[data-cy="order-id"]').should("have.text", "PED-1002");
    cy.get('[data-cy="order-total"]').should("have.text", "$2.50");
  });
});
