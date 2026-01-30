import { OrdersAPI } from "../api/orders.api.js";
import { ProductsAPI } from "../api/products.api.js";
import {
  showErrorNotification,
  showSuccessNotification,
} from "./notification.component.js";
import { createConfirmModal } from "./modal.component.js";
import { LoadingComponent } from "./loading.component.js";

const getErrorMessage = (error) => {
  if (!error) return "Error desconocido";
  if (error.message) return error.message;
  if (typeof error === "string") return error;
  return "Error desconocido";
};

const OrdersComponent = (() => {
  let ordersGridRef = null;
  let ordersSearchRef = null;
  let ordersFilterRef = null;
  let allOrders = [];
  let filteredOrders = [];
  let currentFilter = "all";

  const init = (gridSelector, searchSelector, filterSelector) => {
    ordersGridRef = document.querySelector(gridSelector);
    ordersSearchRef = document.querySelector(searchSelector);
    ordersFilterRef = document.querySelector(filterSelector);

    if (!ordersGridRef) return;

    setupEventListeners();
    loadOrders();
  };

  const setupEventListeners = () => {
    if (ordersSearchRef) {
      ordersSearchRef.addEventListener("input", (e) => {
        const searchTerm = e.target.value.toLowerCase();
        applyFilters(searchTerm);
      });
    }

    if (ordersFilterRef) {
      ordersFilterRef.addEventListener("change", (e) => {
        currentFilter = e.target.value;
        applyFilters(ordersSearchRef?.value || "");
      });
    }

    document.addEventListener("orderCreated", loadOrders);

    window.addEventListener("orderUpdated", () => {
      reloadProductsInBackground();
    });
  };

  const reloadProductsInBackground = async () => {
    try {
      window.dispatchEvent(new Event("productDataChanged"));
    } catch (error) {
      console.error("Error reloading products in background:", error);
    }
  };

  const loadOrders = async () => {
    try {
      if (ordersGridRef) LoadingComponent.showInlineLoader(ordersGridRef);
      const data = await OrdersAPI.getAll();
      allOrders = data.content || data;
      populateFilterOptions();
      applyFilters("");
      if (ordersGridRef) LoadingComponent.hideInlineLoader(ordersGridRef);
    } catch (error) {
      if (ordersGridRef) LoadingComponent.hideInlineLoader(ordersGridRef);
      console.error("Error loading orders:", error);
      const errorMsg = getErrorMessage(error);
      showErrorNotification(`Error al cargar órdenes: ${errorMsg}`);
      if (ordersGridRef) {
        ordersGridRef.innerHTML = `<div class="empty-state"><p>Error: ${errorMsg}</p></div>`;
      }
    }
  };

  const populateFilterOptions = () => {
    if (!ordersFilterRef) return;

    const types = [...new Set(allOrders.map((o) => getOrderType(o)))];
    const currentValue = ordersFilterRef.value;

    ordersFilterRef.innerHTML = '<option value="all">Todas</option>';
    types.forEach((type) => {
      const option = document.createElement("option");
      option.value = type;
      option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
      ordersFilterRef.appendChild(option);
    });

    ordersFilterRef.value = currentValue;
  };

  const getOrderType = (order) => {
    if (order.details && order.details.length > 0) {
      return order.details[0].productType || "General";
    }
    return "General";
  };

  const applyFilters = (searchTerm) => {
    filteredOrders = allOrders.filter((order) => {
      const matchesSearch =
        String(order.id).includes(searchTerm) ||
        (order.userName && order.userName.toLowerCase().includes(searchTerm));

      const matchesFilter =
        currentFilter === "all" || getOrderType(order) === currentFilter;

      return matchesSearch && matchesFilter;
    });

    renderOrdersByType();
  };

  const renderOrdersByType = () => {
    if (!ordersGridRef) return;

    if (filteredOrders.length === 0) {
      ordersGridRef.innerHTML =
        '<div class="empty-state"><h3>No hay órdenes</h3></div>';
      return;
    }

    const grouped = groupOrdersByTypeAndStatus(filteredOrders);

    ordersGridRef.innerHTML = "";
    Object.entries(grouped).forEach(([type, orders]) => {
      const section = createOrderTypeSection(type, orders);
      ordersGridRef.appendChild(section);
    });

    setupOrderCardHandlers();
  };

  const groupOrdersByTypeAndStatus = (orders) => {
    const grouped = {};

    orders.forEach((order) => {
      const type = getOrderType(order);
      const status = getOrderStatus(order);
      const key = `${type} - ${status}`;

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(order);
    });

    return grouped;
  };

  const getOrderStatus = (order) => {
    if (order.status === "COMPLETED") return "Completado";
    if (order.status === "INCOMPLETE") return "Incompleto";
    if (order.status === "REVIEW") return "En Revisión";
    if (order.status === "PENDING") return "Pendiente";
    return "Creado";
  };

  const createOrderTypeSection = (type, orders) => {
    const section = document.createElement("div");
    section.className = "order-type-section";
    section.innerHTML = `
      <h3 class="order-type-title">${type}</h3>
      <div class="orders-grid">
        ${orders.map((order) => createOrderCard(order)).join("")}
      </div>
    `;
    return section;
  };

  const createOrderCard = (order) => {
    const userInitials = order.userName?.substring(0, 2).toUpperCase() || "U";
    const status = getOrderStatus(order);
    const statusClass = getStatusClass(order.status);
    const buttonAction = getNextActionButton(order);

    return `
      <div class="order-card" data-order-id="${order.id}" data-status="${
      order.status
    }">
        <div class="order-card-header">
          <div class="order-card-user">
            <div class="user-avatar">${userInitials}</div>
            <div class="user-info">
              <h4>Orden #${order.id}</h4>
              <p>${order.userName}</p>
            </div>
          </div>
          <span class="order-status ${statusClass}">${status}</span>
        </div>

        <div class="order-card-details">
          <div class="detail-row">
            <span class="detail-label">Artículos:</span>
            <span class="detail-value">${order.details?.length || 0}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Total:</span>
            <span class="detail-value">€${(order.totalPrice || 0).toFixed(
              2
            )}</span>
          </div>
        </div>

        <div class="order-card-actions">
          ${buttonAction}
          <button class="action-btn secondary view-details" data-order-id="${
            order.id
          }">
            Ver Detalles
          </button>
        </div>
      </div>
    `;
  };

  const getNextActionButton = (order) => {
    const id = order.id;

    if (order.status === "CREATED") {
      return `
        <button class="action-btn primary mark-received" data-order-id="${id}">
          Marcar como Recibido
        </button>
      `;
    }

    if (order.status === "PENDING") {
      return `
        <button class="action-btn primary review-order" data-order-id="${id}">
          Revisar Orden
        </button>
      `;
    }

    if (order.status === "REVIEW") {
      return `
        <div class="review-buttons">
          <button class="action-btn success confirm-complete" data-order-id="${id}">
            Completar
          </button>
          <button class="action-btn warning mark-incomplete" data-order-id="${id}">
            Incompleto
          </button>
        </div>
      `;
    }

    return '<span class="status-final">Procesada</span>';
  };

  const getStatusClass = (status) => {
    const classMap = {
      CREATED: "status-created",
      PENDING: "status-pending",
      REVIEW: "status-review",
      COMPLETED: "status-completed",
      INCOMPLETE: "status-incomplete",
    };
    return classMap[status] || "status-created";
  };

  const setupOrderCardHandlers = () => {
    if (!ordersGridRef) return;

    ordersGridRef.querySelectorAll(".mark-received").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const orderId = parseInt(btn.dataset.orderId);
        handleMarkAsReceived(orderId);
      });
    });

    ordersGridRef.querySelectorAll(".review-order").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const orderId = parseInt(btn.dataset.orderId);
        handleReviewOrder(orderId);
      });
    });

    ordersGridRef.querySelectorAll(".confirm-complete").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const orderId = parseInt(btn.dataset.orderId);
        handleCompleteOrder(orderId);
      });
    });

    ordersGridRef.querySelectorAll(".mark-incomplete").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const orderId = parseInt(btn.dataset.orderId);
        handleMarkIncomplete(orderId);
      });
    });

    ordersGridRef.querySelectorAll(".view-details").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const orderId = parseInt(btn.dataset.orderId);
        showOrderDetails(orderId);
      });
    });
  };

  const handleMarkAsReceived = async (orderId) => {
    try {
      await OrdersAPI.updateStatus(orderId, "PENDING");
      showSuccessNotification("✓ Orden marcada como recibida");
      loadOrders();
    } catch (error) {
      console.error("Error marking order as received:", error);
      const errorMsg = getErrorMessage(error);
      showErrorNotification(`✗ Error al marcar como recibido: ${errorMsg}`);
    }
  };

  const handleReviewOrder = async (orderId) => {
    try {
      const order = await OrdersAPI.getById(orderId);
      const modal = createReviewOrderModal(order);
      document.body.appendChild(modal);
    } catch (error) {
      console.error("Error reviewing order:", error);
      const errorMsg = getErrorMessage(error);
      showErrorNotification(`✗ Error al revisar orden: ${errorMsg}`);
    }
  };

  const handleCompleteOrder = async (orderId) => {
    try {
      const modal = createConfirmModal(
        "Confirmar completado",
        "¿Confirmas que todos los artículos están completos?",
        async () => {
          try {
            await OrdersAPI.updateStatus(orderId, "COMPLETED");
            showSuccessNotification("✓ Orden completada exitosamente");
            loadOrders();
          } catch (error) {
            const errorMsg = getErrorMessage(error);
            showErrorNotification(`✗ Error al completar orden: ${errorMsg}`);
          }
        }
      );
      document.body.appendChild(modal);
    } catch (error) {
      console.error("Error creating complete modal:", error);
      const errorMsg = getErrorMessage(error);
      showErrorNotification(`✗ Error: ${errorMsg}`);
    }
  };

  const handleMarkIncomplete = async (orderId) => {
    try {
      const modal = createConfirmModal(
        "Marcar como incompleto",
        "¿Confirmas que faltan artículos en esta orden?",
        async () => {
          try {
            await OrdersAPI.updateStatus(orderId, "INCOMPLETE");
            showSuccessNotification("✓ Orden marcada como incompleta");
            loadOrders();
          } catch (error) {
            const errorMsg = getErrorMessage(error);
            showErrorNotification(
              `✗ Error al marcar como incompleto: ${errorMsg}`
            );
          }
        }
      );
      document.body.appendChild(modal);
    } catch (error) {
      console.error("Error creating incomplete modal:", error);
      const errorMsg = getErrorMessage(error);
      showErrorNotification(`✗ Error: ${errorMsg}`);
    }
  };

  const showOrderDetails = async (orderId) => {
    try {
      const order = await OrdersAPI.getById(orderId);
      const modal = createOrderDetailsModal(order);
      document.body.appendChild(modal);
    } catch (error) {
      console.error("Error loading order details:", error);
      showErrorNotification("Error al cargar detalles de la orden");
    }
  };

  const createOrderDetailsModal = (order) => {
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
      padding: 20px;
      box-sizing: border-box;
      overflow: auto;
      max-width: 100%;
    `;

    const modal = document.createElement("div");
    modal.className = "modal-dialog order-details-modal";
    modal.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 24px;
      width: 100%;
      max-width: 600px;
      max-height: 85vh;
      overflow-y: auto;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      box-sizing: border-box;
      margin: auto;
    `;

    modal.innerHTML = `
      <div class="modal-header">
        <h2>Detalles de Orden #${order.id}</h2>
      </div>

      <div class="modal-content">
        <div class="order-info-section">
          <h3>Información General</h3>
          <div class="info-row">
            <span class="info-label">Usuario:</span>
            <span class="info-value">${order.userName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Estado:</span>
            <span class="info-value status">${getOrderStatus(order)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Total:</span>
            <span class="info-value">€${(order.totalPrice || 0).toFixed(
              2
            )}</span>
          </div>
        </div>

        <div class="items-section">
          <h3>Artículos</h3>
          <table class="items-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio</th>
              </tr>
            </thead>
            <tbody>
              ${
                order.details
                  ?.map(
                    (detail) => `
                <tr>
                  <td>${detail.productName}</td>
                  <td>${detail.quantity}</td>
                  <td>€${(detail.price || 0).toFixed(2)}</td>
                </tr>
              `
                  )
                  .join("") || '<tr><td colspan="3">Sin artículos</td></tr>'
              }
            </tbody>
          </table>
        </div>
      </div>

      <div class="modal-footer">
        <button class="action-btn secondary close-modal">Cerrar</button>
      </div>
    `;

    const closeBtn = modal.querySelector(".close-modal");
    const closeModal = modal.querySelector(".close-modal");

    const handleClose = () => {
      overlay.remove();
    };

    closeBtn.addEventListener("click", handleClose);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) handleClose();
    });

    overlay.appendChild(modal);
    return overlay;
  };

  const createReviewOrderModal = (order) => {
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
      padding: 20px;
      box-sizing: border-box;
      overflow: auto;
    `;

    const modal = document.createElement("div");
    modal.className = "modal-dialog review-order-modal";
    modal.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 24px;
      width: 100%;
      max-width: 700px;
      max-height: 85vh;
      overflow-y: auto;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      box-sizing: border-box;
      margin: auto;
    `;

    const itemsHtml =
      order.details
        ?.map(
          (detail, idx) => `
      <tr>
        <td>${detail.productName}</td>
        <td class="quantity-col">${detail.quantity}</td>
        <td class="input-col">
          <input type="number" 
                 step="0.01" 
                 value="${detail.quantity}"
                 data-index="${idx}"
                 class="received-input"
                 style="width: 80px; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
        </td>
      </tr>
    `
        )
        .join("") || '<tr><td colspan="3">Sin artículos</td></tr>';

    modal.innerHTML = `
      <div class="modal-header">
        <h2>Revisar Orden #${order.id}</h2>
      </div>

      <div class="modal-content">
        <div class="review-info">
          <p><strong>Usuario:</strong> ${order.userName}</p>
          <p><strong>Total esperado:</strong> €${(
            order.totalPrice || 0
          ).toFixed(2)}</p>
        </div>

        <div class="items-section">
          <h3>Cantidades</h3>
          <table class="review-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Solicitado</th>
                <th>Recibido</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>

        <div class="review-notes">
          <label for="reviewNotes">Observaciones:</label>
          <textarea id="reviewNotes" 
                    class="review-textarea"
                    placeholder="Notas sobre la recepción (opcional)"
                    style="width: 100%; min-height: 80px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"></textarea>
        </div>
      </div>

      <div class="modal-footer" style="display: flex; gap: 8px; justify-content: flex-end;">
        <button class="action-btn secondary close-modal">Cancelar</button>
        <button class="action-btn warning mark-incomplete-review" data-order-id="${
          order.id
        }">
          Marcar Incompleto
        </button>
        <button class="action-btn success confirm-receive" data-order-id="${
          order.id
        }">
          Confirmar Recepción
        </button>
      </div>
    `;

    const closeBtn = modal.querySelector(".close-btn");
    const closeModal = modal.querySelector(".close-modal");
    const confirmReceiveBtn = modal.querySelector(".confirm-receive");
    const markIncompleteBtn = modal.querySelector(".mark-incomplete-review");

    const handleClose = () => {
      overlay.remove();
    };

    const handleConfirmReceive = async () => {
      try {
        const receivedData = [];
        const inputs = modal.querySelectorAll(".received-input");

        inputs.forEach((input, idx) => {
          const received = parseFloat(input.value) || 0;
          const requested = parseFloat(order.details[idx].quantity) || 0;

          receivedData.push({
            productId: order.details[idx].productId,
            quantity: received,
            requested: requested,
          });
        });

        let isOrderIncomplete = false;
        order.details.forEach((detail, idx) => {
          const requested = parseFloat(detail.quantity);
          const received = parseFloat(receivedData[idx]?.quantity) || 0;

          if (received < requested) {
            isOrderIncomplete = true;
          }
        });

        if (isOrderIncomplete) {
          await markOrderIncomplete(order.id, receivedData);
          showErrorNotification(
            "Orden marcada como incompleta - Cantidades insuficientes"
          );
        } else {
          await completeOrderWithReceipt(order.id, receivedData);
          showSuccessNotification("✓ Orden completada exitosamente");
        }

        handleClose();
        loadOrders();
      } catch (error) {
        console.error("Error processing reception:", error);
        const errorMsg = getErrorMessage(error);
        showErrorNotification(`✗ Error al procesar recepción: ${errorMsg}`);
      }
    };

    const handleMarkIncomplete = async () => {
      try {
        const receivedData = [];
        const inputs = modal.querySelectorAll(".received-input");

        inputs.forEach((input, idx) => {
          const received = parseFloat(input.value) || 0;
          receivedData.push({
            productId: order.details[idx].productId,
            quantity: received,
          });
        });

        await markOrderIncomplete(order.id, receivedData);
        showSuccessNotification("Orden marcada como incompleta");
        handleClose();
        loadOrders();
      } catch (error) {
        console.error("Error marking incomplete:", error);
        const errorMsg = getErrorMessage(error);
        showErrorNotification(`Error al marcar incompleto: ${errorMsg}`);
      }
    };

    if (closeBtn) closeBtn.addEventListener("click", handleClose);
    closeModal.addEventListener("click", handleClose);
    confirmReceiveBtn.addEventListener("click", handleConfirmReceive);
    markIncompleteBtn.addEventListener("click", handleMarkIncomplete);

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) handleClose();
    });

    overlay.appendChild(modal);
    return overlay;
  };

  const completeOrderWithReceipt = async (orderId, receivedData) => {
    try {
      LoadingComponent.showDotsLoader("Completando orden con recepción...");
      for (const item of receivedData) {
        const product = await ProductsAPI.getById(item.productId);
        const newStock = product.currentStock + item.quantity;
        await ProductsAPI.update(item.productId, {
          ...product,
          currentStock: newStock,
        });
      }

      await OrdersAPI.updateStatus(orderId, "COMPLETED");
      LoadingComponent.hideDotsLoader();

      window.dispatchEvent(new Event("orderUpdated"));
    } catch (error) {
      LoadingComponent.hideDotsLoader();
      console.error("Error completing order with receipt:", error);
      throw error;
    }
  };

  const markOrderIncomplete = async (orderId, receivedData) => {
    try {
      LoadingComponent.showDotsLoader("Marcando orden como incompleta...");
      for (const item of receivedData) {
        if (item.quantity > 0) {
          const product = await ProductsAPI.getById(item.productId);
          const newStock = product.currentStock + item.quantity;
          await ProductsAPI.update(item.productId, {
            ...product,
            currentStock: newStock,
          });
        }
      }

      await OrdersAPI.updateStatus(orderId, "INCOMPLETE");
      LoadingComponent.hideDotsLoader();

      window.dispatchEvent(new Event("orderUpdated"));
    } catch (error) {
      LoadingComponent.hideDotsLoader();
      console.error("Error marking order incomplete:", error);
      throw error;
    }
  };

  return {
    init,
    loadOrders,
    getOrderStatus,
  };
})();

export default OrdersComponent;
