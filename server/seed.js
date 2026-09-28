/**
 * Reinicia el catálogo y borra los pedidos.
 * Uso: npm run seed
 */
const { resetDb, DB_PATH } = require("./db");

const db = resetDb();
console.log(`Datos de prueba restablecidos en ${DB_PATH}`);
console.log(`Productos: ${db.products.length}`);
console.log(`Pedidos: ${db.orders.length}`);
