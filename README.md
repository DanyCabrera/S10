# Café Aurora — pedidos de cafetería

Aplicación web simple para pedir en una cafetería. Tiene **frontend**, **API** y **persistencia en archivo**, y está pensada para observarla y probarla con Cypress.

Puedes hacer esto:

1. Ver productos con precio y disponibilidad.
2. Agregar artículos al pedido y cambiar cantidades.
3. Ver el total.
4. Confirmar el pedido y recibir un identificador (`PED-1001`, `PED-1002`, ...).
5. Ver un mensaje de éxito o de error.
6. Reiniciar los datos de prueba cuando quieras.

## Cómo está armado

```text
Usuario  →  frontend (HTML/CSS/JS)  →  API Express  →  server/data/db.json
                 ↑
           Cypress E2E (TypeScript)
```

- `public/` es la pantalla que ves en el navegador.
- `server/index.js` es la API y también sirve el frontend.
- `server/data/db.json` guarda productos y pedidos. Se crea solo al arrancar.
- `server/seed-data.js` es el catálogo inicial.
- `cypress/e2e/` tiene un archivo por recorrido crítico.

No hay base de datos externa, ni login, ni secretos, ni servicios de terceros.

## Cómo ejecutarlo

Necesitas Node.js 18 o superior.

```bash
npm install
npm start
```

Abre [http://localhost:3000](http://localhost:3000).

Si el puerto 3000 ya está ocupado:

```bash
set PORT=3333
npm start
```

En PowerShell: `$env:PORT=3333; npm start`. Después abre `http://localhost:3333` y, si usas Cypress a mano, pasa `baseUrl=http://localhost:3333`.

## Cómo probarlo con Cypress

En una terminal deja la app corriendo (`npm start`). En otra:

```bash
npx cypress open
```

O todo junto, sin abrir la interfaz de Cypress:

```bash
npm run test:e2e
```

`baseUrl` está en `cypress.config.ts` y apunta a `http://localhost:3000`.

## Datos de prueba

Cada prueba empieza de cero. No dependen del orden ni de lo que hizo la prueba anterior.

Hay dos formas de reiniciar el catálogo y borrar pedidos:

```bash
npm run seed
```

```http
POST http://localhost:3000/api/test/reset
```

Cypress llama a `POST /api/test/reset` en el `beforeEach` de cada spec.

Catálogo inicial:

| Producto        | Precio | Stock inicial |
| --------------- | ------ | ------------- |
| Café Americano  | $2.50  | 20            |
| Cappuccino      | $3.50  | 15            |
| Latte           | $4.00  | 10            |
| Croissant       | $2.00  | 1             |
| Té Verde        | $2.25  | 0 (agotado)   |

El primer pedido después de un reset siempre recibe el id `PED-1001`. Puedes abrir `server/data/db.json` y ver el pedido guardado.

## Recorridos E2E

| Archivo | Qué comprueba |
| --- | --- |
| `cypress/e2e/pedido-exitoso.cy.ts` | Agrega productos, cambia cantidad, confirma, revisa el id, el total y que quedó guardado en la API. Usa `cy.intercept()` con alias `@createOrder`. |
| `cypress/e2e/validacion.cy.ts` | Intenta confirmar el carrito vacío o con cantidad `0`. Comprueba el mensaje y que **no** se envió `POST /api/orders`. |
| `cypress/e2e/fallo-controlado.cy.ts` | Simula un error 500 de la API y una falta de existencias. Comprueba el mensaje y que se puede reintentar. |

Las pruebas no usan `cy.wait(3000)`. Esperan elementos o `cy.wait('@alias')` de una petición interceptada.

## API

| Método | Ruta | Para qué sirve |
| --- | --- | --- |
| `GET` | `/api/products` | Lista productos, precio y stock. |
| `POST` | `/api/orders` | Confirma un pedido `{ items: [{ productId, quantity }] }`. |
| `GET` | `/api/orders/:id` | Devuelve un pedido ya guardado. |
| `POST` | `/api/test/reset` | Reinicia productos y borra pedidos. |
| `GET` | `/api/health` | Comprueba que el servidor responde. |

Errores que puedes provocar:

- Carrito vacío → `400`
- Cantidad inválida → `400`
- Sin stock → `409`
- En las pruebas, un `500` simulado con `cy.intercept()`

## Dependencias reales y simuladas

**Reales (corren de verdad):**

- Node.js + Express
- Archivo `db.json`
- Frontend servido por el mismo servidor

**Simuladas solo en pruebas:**

- El fallo `500` del recorrido controlado. Cypress intercepta `POST /api/orders` y responde el error a propósito. El siguiente intento deja pasar la petición real.

No hay APIs de pago, mapas, autenticación externa ni claves en el repo.

## GitHub Actions

`.github/workflows/e2e.yml` instala dependencias, levanta la app y ejecuta Cypress en Chrome.

Si la suite falla, se suben como artifact:

- `cypress/videos`
- `cypress/screenshots`

## Cypress, Playwright o Agent Browser

Esta evaluación se hace con **Cypress**. Elegiría cada herramienta así:

- **Cypress:** cuando el objetivo es una suite E2E de un solo navegador, fácil de leer, con time-travel y buena integración al curso o al equipo. Encaja bien en una app como esta.
- **Playwright:** cuando necesito varios navegadores oficiales, varias pestañas o contextos, trazas más completas o paralelismo más agresivo en CI.
- **Agent Browser:** cuando quiero explorar la interfaz en lenguaje natural o investigar un flujo inestable, no como reemplazo de una regresión determinista.

Para este proyecto Cypress es suficiente: los recorridos son cortos, el entorno es local y las aserciones de red se resuelven con `cy.intercept()`.
