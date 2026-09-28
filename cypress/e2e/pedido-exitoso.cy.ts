describe("Camino exitoso del pedido", () => {
  beforeEach(() => {
    cy.resetTestData();
    cy.intercept("POST", "/api/orders").as("createOrder");
    cy.visit("/");
  });

  it("selecciona productos, confirma y persiste identificador y total", () => {
    cy.get('[data-cy="product-americano"]').should("contain", "Café Americano");
    cy.get('[data-cy="product-americano"]').should("contain", "$2.50");
    cy.get('[data-cy="product-americano"]').should("contain", "Disponible");

    cy.addProductToCart("americano");
    cy.addProductToCart("cappuccino");

    cy.get('[data-cy="cart-item-americano"]').within(() => {
      cy.get('[data-cy="qty-increase"]').click();
    });

    cy.get('[data-cy="cart-total"]').should("have.text", "$8.50");

    cy.get('[data-cy="confirm-order"]').click();
    cy.wait("@createOrder").then(({ request, response }) => {
      expect(request.body.items).to.deep.equal([
        { productId: "americano", quantity: 2 },
        { productId: "cappuccino", quantity: 1 },
      ]);
      expect(response?.statusCode).to.eq(201);
      expect(response?.body.id).to.eq("PED-1001");
      expect(response?.body.total).to.eq(8.5);

      cy.get('[data-cy="order-success"]').should("be.visible");
      cy.get('[data-cy="order-id"]').should("have.text", response?.body.id);
      cy.get('[data-cy="order-total"]').should("have.text", "$8.50");

      cy.request("GET", `/api/orders/${response?.body.id}`).then((persisted) => {
        expect(persisted.status).to.eq(200);
        expect(persisted.body.total).to.eq(8.5);
        expect(persisted.body.id).to.eq("PED-1001");
      });
    });
  });
});
