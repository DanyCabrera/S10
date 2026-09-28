/**
 * Catálogo inicial de Café Aurora.
 * stock: unidades disponibles. 0 = no se puede pedir.
 * price: precio en dólares, se formatea a 2 decimales en la UI y la API.
 */
const PRODUCTS = [
  { id: "americano", name: "Café Americano", price: 2.5, stock: 20 },
  { id: "cappuccino", name: "Cappuccino", price: 3.5, stock: 15 },
  { id: "latte", name: "Latte", price: 4, stock: 10 },
  { id: "croissant", name: "Croissant", price: 2, stock: 1 },
  { id: "te-verde", name: "Té Verde", price: 2.25, stock: 0 },
];

function createSeedDatabase() {
  return {
    products: PRODUCTS.map((product) => ({ ...product })),
    orders: [],
  };
}

module.exports = { PRODUCTS, createSeedDatabase };
