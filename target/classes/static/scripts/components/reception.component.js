import * as ReceptionAPI from "../api/reception.api.js";
import {
  showNotification,
  showErrorNotification,
  showSuccessNotification,
} from "./notification.component.js";
import { createFormModal, createConfirmModal } from "./modal.component.js";
import { LoadingComponent } from "./loading.component.js";

let receptionGridRef = null;
let receptionSearchRef = null;
let eventDelegationSetup = false;
let pendingOrders = [];

export function initReceptionComponent() {
  receptionGridRef = document.querySelector("#receptionGrid");
  receptionSearchRef = document.querySelector(".reception-search");

  if (!receptionGridRef) return;

  loadPendingOrders();

  if (!eventDelegationSetup) {
    setupEventDelegation();
    eventDelegationSetup = true;
  }

  if (receptionSearchRef) {
    receptionSearchRef.addEventListener("input", (e) => {
      const searchTerm = e.target.value.toLowerCase();
      filterOrders(searchTerm);
    });
  }

  document.addEventListener("orderCreated", () => {
    loadPendingOrders();
  });
}

async function loadPendingOrders() {
  try {
    if (receptionGridRef) LoadingComponent.showInlineLoader(receptionGridRef);
    const orders = await ReceptionAPI.getPendingOrders();
    pendingOrders = orders;
    renderOrders(orders);
    if (receptionGridRef) LoadingComponent.hideInlineLoader(receptionGridRef);
  } catch (error) {
    if (receptionGridRef) LoadingComponent.hideInlineLoader(receptionGridRef);
    console.error("Error loading pending orders:", error);
    showErrorNotification(
      "Error",
      "No se pudieron cargar las órdenes pendientes"
    );
    receptionGridRef.innerHTML = `
      <div class="empty-state">
        <p>Error al cargar las órdenes pendientes</p>
      </div>
    `;
  }
}

function renderOrders(orders) {
  if (!orders || orders.length === 0) {
    receptionGridRef.innerHTML = `
      <div class="empty-state">
        <h3>No hay órdenes pendientes</h3>
        <p>Todas las órdenes han sido procesadas</p>
      </div>
    `;
    return;
  }

  receptionGridRef.innerHTML = orders
    .map((order) => createOrderCard(order))
    .join("");
}

function createOrderCard(order) {
  const totalItems = order.details?.length || 0;
  const userInitials = order.userName?.substring(0, 2).toUpperCase() || "U";

  return `
    <div class="order-card reception-card" data-order-id="${order.id}">
      <div class="order-header">
        <div class="order-header-left">
          <div class="user-avatar">${userInitials}</div>
          <div class="order-info">
            <h3>Orden #${order.id}</h3>
            <p class="order-user">${order.userName}</p>
          </div>
        </div>
        <span class="order-status pending">PENDIENTE</span>
      </div>
      
      <div class="order-details">
        <div class="detail-row">
          <span class="label">Fecha:</span>
          <span class="value">${formatDate(order.orderDate)}</span>
        </div>
        <div class="detail-row">
          <span class="label">Productos:</span>
          <span class="value">${totalItems}</span>
        </div>
      </div>

      <div class="order-items-preview">
        ${
          order.details
            ?.slice(0, 2)
            .map(
              (item) => `
          <div class="item-preview">
            <span class="item-name">${item.productName}</span>
            <span class="item-qty">${item.quantity} ${
                item.productName.match(/\(([^)]+)\)/)?.[1] || ""
              }</span>
          </div>
        `
            )
            .join("") || ""
        }
        ${
          totalItems > 2
            ? `<div class="items-more">+${totalItems - 2} más</div>`
            : ""
        }
      </div>

      <div class="order-actions">
        <button class="action-btn primary btn-receive" data-order-id="${
          order.id
        }">
          Procesar Recepción
        </button>
      </div>
    </div>
  `;
}

function filterOrders(searchTerm) {
  if (!searchTerm) {
    renderOrders(pendingOrders);
    return;
  }

  const filtered = pendingOrders.filter(
    (order) =>
      order.id.toString().includes(searchTerm) ||
      order.userName?.toLowerCase().includes(searchTerm)
  );

  renderOrders(filtered);
}

function setupEventDelegation() {
  receptionGridRef.addEventListener("click", async (e) => {
    const receiveBtn = e.target.closest(".btn-receive");

    if (receiveBtn) {
      e.preventDefault();
      const orderId = parseInt(receiveBtn.getAttribute("data-order-id"));
      showReceptionForm(orderId);
    }
  });
}

async function showReceptionForm(orderId) {
  try {
    const order = await ReceptionAPI.getOrderById(orderId);

    const receptionData = {
      orderId: order.id,
      items: order.details.map((detail) => ({
        productId: detail.productId,
        quantityRequested: detail.quantity,
        quantityReceived: detail.quantity,
        productName: detail.productName,
        unit: detail.productName.match(/\(([^)]+)\)/)?.[1] || "unidad",
      })),
    };

    showReceptionModal(order, receptionData);
  } catch (error) {
    console.error("Error loading order for reception:", error);
    showErrorNotification("Error", "No se pudo cargar la orden");
  }
}

function showReceptionModal(order, receptionData) {
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
    overflow: auto;
  `;

  const modal = document.createElement("div");
  modal.className = "modal-dialog reception-modal";
  modal.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 30px;
    width: 100%;
    max-width: 800px;
    max-height: 85vh;
    overflow-y: auto;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    box-sizing: border-box;
    margin: auto;
  `;

  modal.innerHTML = `
    <div class="reception-header">
      <h2>Recepción de Orden #${order.id}</h2>
      <p class="reception-user">Usuario: ${order.userName}</p>
    </div>

    <div class="reception-items">
      ${receptionData.items
        .map(
          (item, idx) => `
        <div class="reception-item" data-index="${idx}" data-product-id="${item.productId}">
          <div class="item-header">
            <span class="product-name">${item.productName}</span>
            <span class="item-status">✓</span>
          </div>
          
          <div class="item-quantities">
            <div class="quantity-group">
              <label>Solicitado:</label>
              <input type="number" class="qty-requested" value="${item.quantityRequested}" disabled step="0.01">
              <span class="unit">${item.unit}</span>
            </div>
            
            <div class="quantity-group">
              <label>Recibido:</label>
              <input type="number" class="qty-received" value="${item.quantityReceived}" step="0.01" min="0" data-min="${item.quantityRequested}">
              <span class="unit">${item.unit}</span>
            </div>

            <div class="quantity-validation">
              <span class="validation-message"></span>
            </div>
          </div>
        </div>
      `
        )
        .join("")}
    </div>

    <div class="reception-actions">
      <button class="action-btn delete" id="cancelBtn">Cancelar</button>
      <button class="action-btn primary" id="confirmBtn">Confirmar Recepción</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  setupReceptionModal(modal, overlay, order, receptionData);

  document.getElementById("cancelBtn").onclick = () => closeModal(overlay);
  overlay.onclick = (e) => {
    if (e.target === overlay) closeModal(overlay);
  };
}

function setupReceptionModal(modal, overlay, order, receptionData) {
  const qtyInputs = modal.querySelectorAll(".qty-received");
  const confirmBtn = modal.querySelector("#confirmBtn");

  qtyInputs.forEach((input) => {
    input.addEventListener("change", () => {
      validateQuantity(input);
      updateReceptionStatus(modal);
    });

    input.addEventListener("input", () => {
      validateQuantity(input);
    });
  });

  confirmBtn.addEventListener("click", async () => {
    if (!validateAllQuantities(modal)) {
      showErrorNotification(
        "Validación",
        "Hay errores en las cantidades. Revisa cada producto."
      );
      return;
    }

    showReceptionConfirmation(modal, overlay, order, receptionData);
  });
}

function validateQuantity(input) {
  const itemDiv = input.closest(".reception-item");
  const minValue = parseFloat(input.getAttribute("data-min"));
  const currentValue = parseFloat(input.value) || 0;
  const validationMsg = itemDiv.querySelector(".validation-message");
  const itemHeader = itemDiv.querySelector(".item-header");
  const statusBadge = itemHeader.querySelector(".item-status");

  if (currentValue < minValue) {
    validationMsg.textContent = `Mínimo requerido: ${minValue}`;
    validationMsg.style.color = "#ff6b6b";
    statusBadge.textContent = "✗";
    statusBadge.style.color = "#ff6b6b";
    input.style.borderColor = "#ff6b6b";
  } else {
    validationMsg.textContent =
      currentValue > minValue ? "✓ Recepción completa" : "✓ Correcto";
    validationMsg.style.color = "#51cf66";
    statusBadge.textContent = "✓";
    statusBadge.style.color = "#51cf66";
    input.style.borderColor = "#51cf66";
  }
}

function validateAllQuantities(modal) {
  const items = modal.querySelectorAll(".reception-item");
  let allValid = true;

  items.forEach((item) => {
    const input = item.querySelector(".qty-received");
    const minValue = parseFloat(input.getAttribute("data-min"));
    const currentValue = parseFloat(input.value) || 0;

    if (currentValue < minValue) {
      allValid = false;
    }
  });

  return allValid;
}

function updateReceptionStatus(modal) {
  const items = modal.querySelectorAll(".reception-item");
  let allEqual = true;

  items.forEach((item) => {
    const requested = parseFloat(item.querySelector(".qty-requested").value);
    const received = parseFloat(item.querySelector(".qty-received").value);

    if (received !== requested) {
      allEqual = false;
    }
  });

  const header = modal.querySelector(".reception-header");
  if (allEqual) {
    header.style.borderBottomColor = "#51cf66";
  } else {
    header.style.borderBottomColor = "#ffd700";
  }
}

function showReceptionConfirmation(modal, overlay, order, receptionData) {
  const items = modal.querySelectorAll(".reception-item");
  let hasDiscrepancy = false;

  items.forEach((item) => {
    const requested = parseFloat(item.querySelector(".qty-requested").value);
    const received = parseFloat(item.querySelector(".qty-received").value);

    if (received !== requested) {
      hasDiscrepancy = true;
    }
  });

  const status = hasDiscrepancy ? "INCOMPLETE" : "CONFIRMED";
  const statusLabel = hasDiscrepancy ? "INCOMPLETA" : "CONFIRMADA";

  const confirmationText = hasDiscrepancy
    ? `¿Confirmar recepción con discrepancias? La orden será marcada como ${statusLabel}.`
    : `¿Confirmar recepción completa? La orden será marcada como ${statusLabel} y se actualizará el inventario.`;

  const confirmModal = createConfirmModal(
    "Confirmar Recepción",
    confirmationText,
    async () => {
      await processReception(modal, overlay, order, receptionData, status);
    }
  );
}

async function processReception(modal, overlay, order, receptionData, status) {
  try {
    const items = modal.querySelectorAll(".reception-item");
    const receptionItems = Array.from(items).map((item) => ({
      productId: parseInt(item.getAttribute("data-product-id")),
      quantityReceived: parseFloat(item.querySelector(".qty-received").value),
    }));

    const receptionPayload = {
      orderId: order.id,
      items: receptionItems,
      status: status,
    };

    const result = await ReceptionAPI.processReception(receptionPayload);

    closeModal(overlay);
    showSuccessNotification(
      "Recepción Procesada",
      `Orden #${order.id} ${
        status === "CONFIRMED"
          ? "confirmada y inventario actualizado"
          : "marcada como incompleta"
      }`
    );

    loadPendingOrders();
  } catch (error) {
    console.error("Error processing reception:", error);
    showErrorNotification(
      "Error",
      error.message || "No se pudo procesar la recepción"
    );
  }
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function closeModal(overlay) {
  overlay.remove();
}
