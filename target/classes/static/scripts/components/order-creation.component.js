import { OrdersAPI } from "../api/orders.api.js";
import { ProductsAPI } from "../api/products.api.js";
import { UsersAPI } from "../api/users.api.js";
import {
  showNotification,
  showErrorNotification,
  showSuccessNotification,
} from "./notification.component.js";

let currentOrderItems = [];
let availableUsers = [];
let availableProducts = [];

export async function showCreateOrderModal() {
  try {
    await loadUsersAndProducts();

    const overlay = createOrderModal();
    setupOrderModalHandlers(overlay);
  } catch (error) {
    console.error("Error showing order creation modal:", error);
    showErrorNotification(
      "Error",
      "No se pudo cargar el formulario de creación"
    );
  }
}

async function loadUsersAndProducts() {
  try {
    const [users, products] = await Promise.all([
      UsersAPI.getAll(),
      ProductsAPI.getAll(),
    ]);
    availableUsers = users.content || users;
    availableProducts = products.content || products;
  } catch (error) {
    console.error("Error loading data:", error);
    throw error;
  }
}

function createOrderModal() {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
    padding: 20px;
    box-sizing: border-box;
  `;

  const modal = document.createElement("div");
  modal.className = "modal-dialog order-creation-modal";
  modal.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 30px;
    width: 100%;
    max-width: 900px;
    max-height: 85vh;
    overflow-y: auto;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    box-sizing: border-box;
  `;

  currentOrderItems = [];

  modal.innerHTML = `
    <div class="order-creation-header">
      <h2>Crear Nueva Orden</h2>
      <p>Selecciona usuario y agrega productos</p>
    </div>

    <div class="order-creation-form">
      <div class="form-group">
        <label>Usuario Solicitante:</label>
        <select id="userSelect" class="user-select" required>
          <option value="">Seleccionar usuario...</option>
          ${availableUsers
            .map(
              (user) => `
            <option value="${user.id}">${user.name}</option>
          `
            )
            .join("")}
        </select>
      </div>

      <div class="order-products-section">
        <div class="section-header">
          <h3>Productos</h3>
          <button type="button" class="btn-add-product" id="addProductBtn">
            + Agregar Producto
          </button>
        </div>

        <div id="orderItemsList" class="order-items-list">
          <!-- Items will be added here -->
        </div>
      </div>

      <div class="order-summary">
        <p>Productos seleccionados: <strong id="itemCount">0</strong></p>
      </div>

      <div class="order-actions">
        <button type="button" class="action-btn delete" id="cancelBtn">Cancelar</button>
        <button type="button" class="action-btn primary" id="submitBtn">Crear Orden</button>
      </div>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  return overlay;
}

function setupOrderModalHandlers(overlay) {
  const modal = overlay.querySelector(".order-creation-modal");
  const userSelect = modal.querySelector("#userSelect");
  const addProductBtn = modal.querySelector("#addProductBtn");
  const submitBtn = modal.querySelector("#submitBtn");
  const cancelBtn = modal.querySelector("#cancelBtn");

  addProductBtn.addEventListener("click", () => addProductToOrder(modal));

  submitBtn.addEventListener("click", () =>
    submitOrder(overlay, userSelect.value)
  );

  cancelBtn.addEventListener("click", () => closeModal(overlay));

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal(overlay);
  });
}

function addProductToOrder(modal) {
  if (currentOrderItems.length >= 20) {
    showNotification(
      "Límite",
      "No puedes agregar más de 20 productos a una orden"
    );
    return;
  }

  const itemsList = modal.querySelector("#orderItemsList");
  const itemIndex = currentOrderItems.length;

  const itemDiv = document.createElement("div");
  itemDiv.className = "order-item";
  itemDiv.dataset.itemIndex = itemIndex;

  itemDiv.innerHTML = `
    <div class="item-fields">
      <div class="field-group">
        <label>Producto:</label>
        <select class="product-select" data-index="${itemIndex}" required>
          <option value="">Seleccionar producto...</option>
          ${availableProducts
            .map(
              (product) => `
            <option value="${product.id}" data-name="${product.name}" data-unit="${product.unit}">
              ${product.name} (${product.unit})
            </option>
          `
            )
            .join("")}
        </select>
      </div>

      <div class="field-group">
        <label>Cantidad:</label>
        <div class="quantity-input-group">
          <input type="number" class="quantity-input" data-index="${itemIndex}" 
                 placeholder="0" step="0.01" min="0.01" value="1" required>
          <span class="unit-display">unidad</span>
        </div>
      </div>

      <button type="button" class="btn-remove-item" data-index="${itemIndex}">
        Eliminar
      </button>
    </div>
  `;

  itemsList.appendChild(itemDiv);

  const productSelect = itemDiv.querySelector(".product-select");
  productSelect.addEventListener("change", (e) => {
    const unit =
      e.target.options[e.target.selectedIndex].dataset.unit || "unidad";
    itemDiv.querySelector(".unit-display").textContent = unit;
  });

  itemDiv.querySelector(".btn-remove-item").addEventListener("click", () => {
    itemDiv.remove();
    updateItemCount(modal);
  });

  currentOrderItems.push({ index: itemIndex });
  updateItemCount(modal);
}

function updateItemCount(modal) {
  const itemCount = modal.querySelectorAll(".order-item").length;
  modal.querySelector("#itemCount").textContent = itemCount;
}

async function submitOrder(overlay, userId) {
  if (!userId) {
    showErrorNotification("Validación", "Debes seleccionar un usuario");
    return;
  }

  const modal = overlay.querySelector(".order-creation-modal");
  const items = modal.querySelectorAll(".order-item");

  if (items.length === 0) {
    showErrorNotification("Validación", "Debes agregar al menos un producto");
    return;
  }

  const details = [];
  let valid = true;

  items.forEach((item) => {
    const productSelect = item.querySelector(".product-select");
    const quantityInput = item.querySelector(".quantity-input");

    const productId = productSelect.value;
    const quantity = quantityInput.value;

    if (!productId || !quantity || parseFloat(quantity) <= 0) {
      showErrorNotification(
        "Validación",
        "Todos los productos deben tener ID y cantidad válidos"
      );
      valid = false;
      return;
    }

    details.push({
      productId: parseInt(productId),
      quantity: parseFloat(quantity),
    });
  });

  if (!valid) return;

  try {
    const orderData = {
      userId: parseInt(userId),
      details: details,
    };

    const result = await OrdersAPI.create(orderData);

    closeModal(overlay);
    showSuccessNotification(
      "Orden Creada",
      `Orden #${result.id} creada exitosamente`
    );

    const receptionEvent = new CustomEvent("orderCreated", { detail: result });
    document.dispatchEvent(receptionEvent);
  } catch (error) {
    console.error("Error creating order:", error);
    showErrorNotification("Error", "No se pudo crear la orden");
  }
}

function closeModal(overlay) {
  overlay.remove();
}
