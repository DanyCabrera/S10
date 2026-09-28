const state = {
  products: [],
  cart: [],
  submitting: false,
};

const productList = document.querySelector("#product-list");
const cartList = document.querySelector("#cart-list");
const emptyCart = document.querySelector("[data-cy=empty-cart]");
const cartTotal = document.querySelector("#cart-total");
const confirmButton = document.querySelector("#confirm-order");
const statusRegion = document.querySelector("#status-region");
const catalogView = document.querySelector("[data-cy=catalog-view]");
const successView = document.querySelector("[data-cy=order-success]");
const orderIdEl = document.querySelector("#order-id");
const orderTotalEl = document.querySelector("#order-total");
const newOrderButton = document.querySelector("#new-order");

function formatMoney(value) {
  return `$${Number(value).toFixed(2)}`;
}

function getCartItem(productId) {
  return state.cart.find((item) => item.productId === productId);
}

function getProduct(productId) {
  return state.products.find((product) => product.id === productId);
}

function cartTotalValue() {
  return state.cart.reduce((sum, item) => {
    const product = getProduct(item.productId);
    return sum + product.price * item.quantity;
  }, 0);
}

function showStatus(type, message, { retry = false } = {}) {
  const extra = retry
    ? `<div class="banner-actions">
        <button type="button" class="secondary" data-cy="retry-order" id="retry-order">
          Reintentar confirmación
        </button>
      </div>`
    : "";

  statusRegion.innerHTML = `
    <div class="banner banner-${type}" data-cy="${type === "error" ? "error-banner" : "success-banner"}" role="${type === "error" ? "alert" : "status"}">
      <p data-cy="status-message">${message}</p>
      ${extra}
    </div>
  `;

  const retryButton = document.querySelector("#retry-order");
  if (retryButton) {
    retryButton.addEventListener("click", () => submitOrder());
  }
}

function clearStatus() {
  statusRegion.innerHTML = "";
}

function renderProducts() {
  productList.innerHTML = state.products
    .map((product) => {
      const available = product.stock > 0;
      return `
        <li class="product-card" data-cy="product-${product.id}">
          <div class="product-head">
            <strong data-cy="product-name">${product.name}</strong>
            <span class="price" data-cy="product-price">${formatMoney(product.price)}</span>
          </div>
          <p class="availability" data-cy="product-availability" data-available="${available}">
            ${available ? `Disponible · ${product.stock} en stock` : "Agotado"}
          </p>
          <button
            type="button"
            class="secondary"
            data-cy="add-to-cart"
            ${available ? "" : "disabled"}
            aria-label="Agregar ${product.name} al pedido"
          >
            Agregar al pedido
          </button>
        </li>
      `;
    })
    .join("");
}

function renderCart() {
  const hasItems = state.cart.length > 0;
  emptyCart.hidden = hasItems;
  cartList.hidden = !hasItems;
  cartTotal.textContent = formatMoney(cartTotalValue());

  cartList.innerHTML = state.cart
    .map((item) => {
      const product = getProduct(item.productId);
      return `
        <li class="cart-item" data-cy="cart-item-${item.productId}">
          <div class="cart-head">
            <strong>${product.name}</strong>
            <span data-cy="line-total">${formatMoney(product.price * item.quantity)}</span>
          </div>
          <div class="qty-controls">
            <button type="button" class="qty-btn" data-cy="qty-decrease" aria-label="Quitar una unidad de ${product.name}">−</button>
            <input
              class="qty-input"
              data-cy="qty-input"
              type="number"
              min="1"
              max="${product.stock}"
              value="${item.quantity}"
              aria-label="Cantidad de ${product.name}"
            />
            <button type="button" class="qty-btn" data-cy="qty-increase" aria-label="Agregar una unidad de ${product.name}">+</button>
          </div>
        </li>
      `;
    })
    .join("");
}

function addToCart(productId) {
  const product = getProduct(productId);
  if (!product || product.stock < 1) {
    showStatus("error", `No hay existencias de ${product ? product.name : "ese producto"}.`);
    return;
  }

  const existing = getCartItem(productId);
  if (existing) {
    if (existing.quantity >= product.stock) {
      showStatus("error", `No hay existencias suficientes de ${product.name}.`);
      return;
    }
    existing.quantity += 1;
  } else {
    state.cart.push({ productId, quantity: 1 });
  }

  clearStatus();
  renderCart();
}

function setQuantity(productId, quantity, { fromInput = false } = {}) {
  const product = getProduct(productId);
  const item = getCartItem(productId);
  if (!product || !item) {
    return;
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    if (!fromInput) {
      state.cart = state.cart.filter((entry) => entry.productId !== productId);
      clearStatus();
      renderCart();
      return;
    }
    item.quantity = quantity;
    showStatus("error", "Hay cantidades inválidas. Usa números enteros mayores que 0.");
    renderCart();
    return;
  }

  if (quantity > product.stock) {
    item.quantity = product.stock;
    showStatus("error", `No hay existencias suficientes de ${product.name}.`);
  } else {
    item.quantity = quantity;
    clearStatus();
  }

  renderCart();
}

function validateCart() {
  if (state.cart.length === 0) {
    return "El carrito está vacío. Agrega al menos un producto.";
  }

  for (const item of state.cart) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      return "Hay cantidades inválidas. Usa números enteros mayores que 0.";
    }
    const product = getProduct(item.productId);
    if (!product || item.quantity > product.stock) {
      return `No hay existencias suficientes de ${product ? product.name : "un producto"}.`;
    }
  }

  return null;
}

async function submitOrder() {
  if (state.submitting) {
    return;
  }

  const validationError = validateCart();
  if (validationError) {
    showStatus("error", validationError);
    return;
  }

  state.submitting = true;
  confirmButton.disabled = true;
  confirmButton.textContent = "Confirmando...";

  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: state.cart }),
    });
    const payload = await response.json();

    if (!response.ok) {
      showStatus("error", payload.error || "No se pudo confirmar el pedido.", {
        retry: true,
      });
      return;
    }

    catalogView.hidden = true;
    successView.hidden = false;
    orderIdEl.textContent = payload.id;
    orderTotalEl.textContent = formatMoney(payload.total);
    showStatus("success", "Pedido confirmado correctamente.");
    state.cart = [];
    renderCart();
  } catch (_error) {
    showStatus("error", "No se pudo confirmar el pedido.", { retry: true });
  } finally {
    state.submitting = false;
    confirmButton.disabled = false;
    confirmButton.textContent = "Confirmar pedido";
  }
}

async function loadProducts() {
  const response = await fetch("/api/products");
  state.products = await response.json();
  renderProducts();
  renderCart();
}

function resetToCatalog() {
  state.cart = [];
  successView.hidden = true;
  catalogView.hidden = false;
  clearStatus();
  loadProducts();
}

productList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-cy=add-to-cart]");
  if (!button || button.disabled) {
    return;
  }
  addToCart(button.closest("[data-cy^=product-]").dataset.cy.replace("product-", ""));
});

cartList.addEventListener("click", (event) => {
  const row = event.target.closest("[data-cy^=cart-item-]");
  if (!row) {
    return;
  }
  const productId = row.dataset.cy.replace("cart-item-", "");
  const item = getCartItem(productId);
  if (event.target.closest("[data-cy=qty-increase]")) {
    setQuantity(productId, item.quantity + 1);
  }
  if (event.target.closest("[data-cy=qty-decrease]")) {
    setQuantity(productId, item.quantity - 1);
  }
});

cartList.addEventListener("change", (event) => {
  const input = event.target.closest("[data-cy=qty-input]");
  if (!input) {
    return;
  }
  const row = input.closest("[data-cy^=cart-item-]");
  const productId = row.dataset.cy.replace("cart-item-", "");
  setQuantity(productId, Number(input.value), { fromInput: true });
});

confirmButton.addEventListener("click", submitOrder);
newOrderButton.addEventListener("click", resetToCatalog);

loadProducts();
