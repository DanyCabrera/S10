const express = require("express");
const path = require("path");
const { readDb, writeDb, resetDb } = require("./db");

const PORT = Number(process.env.PORT) || 3000;
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

function money(value) {
  return Math.round(Number(value) * 100) / 100;
}

function withAvailability(product) {
  return {
    ...product,
    available: product.stock > 0,
  };
}

function nextOrderId(orders) {
  const max = orders.reduce((current, order) => {
    const numeric = Number(String(order.id).replace("PED-", ""));
    return Number.isFinite(numeric) ? Math.max(current, numeric) : current;
  }, 1000);
  return `PED-${max + 1}`;
}

function isPositiveInteger(value) {
  return Number.isInteger(value) && value >= 1;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/products", (_req, res) => {
  const db = readDb();
  res.json(db.products.map(withAvailability));
});

app.get("/api/orders/:id", (req, res) => {
  const db = readDb();
  const order = db.orders.find((item) => item.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: "Pedido no encontrado" });
  }
  res.json(order);
});

app.post("/api/orders", (req, res) => {
  const items = req.body && Array.isArray(req.body.items) ? req.body.items : [];

  if (items.length === 0) {
    return res.status(400).json({
      error: "El carrito está vacío. Agrega al menos un producto.",
      code: "EMPTY_CART",
    });
  }

  const db = readDb();
  const normalized = [];

  for (const item of items) {
    const productId = item && item.productId;
    const quantity = item && item.quantity;

    if (!productId || !isPositiveInteger(quantity)) {
      return res.status(400).json({
        error: "Hay cantidades inválidas. Usa números enteros mayores que 0.",
        code: "INVALID_QUANTITY",
      });
    }

    const product = db.products.find((entry) => entry.id === productId);
    if (!product) {
      return res.status(400).json({
        error: "Uno de los productos ya no existe.",
        code: "UNKNOWN_PRODUCT",
      });
    }

    if (product.stock < quantity) {
      return res.status(409).json({
        error: `No hay existencias suficientes de ${product.name}.`,
        code: "OUT_OF_STOCK",
      });
    }

    normalized.push({
      productId: product.id,
      name: product.name,
      unitPrice: product.price,
      quantity,
      lineTotal: money(product.price * quantity),
    });
  }

  for (const item of normalized) {
    const product = db.products.find((entry) => entry.id === item.productId);
    product.stock -= item.quantity;
  }

  const order = {
    id: nextOrderId(db.orders),
    items: normalized,
    total: money(normalized.reduce((sum, item) => sum + item.lineTotal, 0)),
    createdAt: new Date().toISOString(),
  };

  db.orders.push(order);
  writeDb(db);

  res.status(201).json(order);
});

/**
 * Mecanismo de datos de prueba: deja el catálogo como al inicio y borra pedidos.
 * Lo usan Cypress (beforeEach) y también puedes llamarlo a mano.
 */
app.post("/api/test/reset", (_req, res) => {
  const db = resetDb();
  res.json({
    ok: true,
    products: db.products.length,
    orders: db.orders.length,
  });
});

app.listen(PORT, () => {
  console.log(`Café Aurora listo en http://localhost:${PORT}`);
});
