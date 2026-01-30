import {
  createOverlay,
  closeModal,
  setupOutsideClickClose,
} from "../utils/ui.utils.js";
import * as RecipeAPI from "../api/recipes.api.js";

export async function createFormModal(title, initialData, onSubmit) {
  const overlay = createOverlay();
  overlay.classList.add("modal-overlay");

  const modal = document.createElement("div");
  modal.classList.add("modal-dialog");

  const isRecipe =
    initialData.hasOwnProperty("elaboration") ||
    initialData.hasOwnProperty("presentation");

  let formHTML;
  let productOptions = "";

  try {
    if (isRecipe) {
      const result = await buildRecipeForm(initialData);
      formHTML = result.html;
      productOptions = result.productOptions;
    } else {
      formHTML = buildProductForm(initialData);
    }
  } catch (error) {
    console.error("Error creating form:", error);
    formHTML = `
      <div class="error-message">
        <p>Error al cargar el formulario: ${error.message}</p>
      </div>
      <div class="modal-buttons">
        <button type="button" class="action-btn delete" id="cancelBtn">Cerrar</button>
      </div>
    `;
  }

  modal.innerHTML = `
    <h3>${title}</h3>
    ${formHTML}
  `;

  if (productOptions) {
    modal.dataset.productOptions = productOptions;
  }

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  const cancelBtn = modal.querySelector("#cancelBtn");
  if (cancelBtn) {
    cancelBtn.onclick = () => closeModal(overlay);
  }

  const form = modal.querySelector("form");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        const formData = collectFormData(form, isRecipe);
        await onSubmit(formData);

        if (overlay && overlay.parentNode) {
          closeModal(overlay);
        }
      } catch (error) {
        console.error("Form submission error:", error);
      }
    });

    if (isRecipe) {
      const componentSelects = modal.querySelectorAll(
        ".component-product-select[data-initial-product]"
      );
      componentSelects.forEach((select) => {
        const initialProductId = select.getAttribute("data-initial-product");
        if (initialProductId) {
          select.value = initialProductId;
        }
      });

      setupComponentsDynamicUI(modal);
    }
  }

  setupOutsideClickClose(overlay, () => closeModal(overlay));

  return overlay;
}

function buildProductForm(initialData) {
  return `
    <form id="entityForm">
      <div class="form-group">
        <label>Nombre:</label>
        <input type="text" name="name" value="${
          initialData.name || ""
        }" required>
      </div>
      <div class="form-group">
        <label>Tipo:</label>
        <select name="type" required>
          <option value="Ingrediente" ${
            initialData.type === "Ingrediente" ? "selected" : ""
          }>Ingrediente</option>
          <option value="Producto" ${
            initialData.type === "Producto" ? "selected" : ""
          }>Producto</option>
          <option value="Bebida" ${
            initialData.type === "Bebida" ? "selected" : ""
          }>Bebida</option>
          <option value="Otro" ${
            initialData.type === "Otro" ? "selected" : ""
          }>Otro</option>
        </select>
      </div>
      <div class="form-group">
        <label>Código de barras:</label>
        <input type="text" name="productCode" value="${
          initialData.productCode || ""
        }" required placeholder="Ej: 92438232374">
      </div>
      <div class="form-group">
        <label>Cantidad:</label>
        <input type="number" name="currentStock" value="${
          initialData.currentStock || ""
        }" required step="0.01">
      </div>
      <div class="form-group">
        <label>Unidad:</label>
        <select name="unit">
          <option value="kg" ${
            initialData.unit === "kg" ? "selected" : ""
          }>kg</option>
          <option value="g" ${
            initialData.unit === "g" ? "selected" : ""
          }>g</option>
          <option value="l" ${
            initialData.unit === "l" ? "selected" : ""
          }>l</option>
          <option value="ml" ${
            initialData.unit === "ml" ? "selected" : ""
          }>ml</option>
          <option value="unidad" ${
            initialData.unit === "unidad" ? "selected" : ""
          }>unidad</option>
        </select>
      </div>
      <div class="form-group">
        <label>Precio unitario (€):</label>
        <input type="number" name="unitPrice" value="${
          initialData.unitPrice || ""
        }" required step="0.01">
      </div>
      <div class="modal-buttons">
        <button type="button" class="action-btn delete" id="cancelBtn">Cancelar</button>
        <button type="submit" class="action-btn primary">Guardar</button>
      </div>
    </form>
  `;
}

async function buildRecipeForm(initialData) {
  try {
    const allergens = await RecipeAPI.getAllAllergens();
    const products = await RecipeAPI.getAllProducts();

    const allergenOptions = allergens
      .map(
        (allergen) => `
        <option value="${allergen.id}" ${
          initialData.allergenIds?.includes(allergen.id) ? "selected" : ""
        }>
          ${allergen.name}
        </option>
      `
      )
      .join("");

    const productOptions = products
      .map(
        (product) => `
        <option value="${product.id}">
          ${product.name} (${product.unit}) - €${product.unitPrice.toFixed(2)}
        </option>
      `
      )
      .join("");

    const html = `
      <form id="entityForm">
        <div class="form-group">
          <label>Nombre:</label>
          <input type="text" name="name" value="${
            initialData.name || ""
          }" required placeholder="Nombre de la receta">
        </div>

        <div class="form-group">
          <label>Elaboración:</label>
          <textarea name="elaboration" required placeholder="Instrucciones de elaboración">${
            initialData.elaboration || ""
          }</textarea>
        </div>

        <div class="form-group">
          <label>Presentación:</label>
          <textarea name="presentation" required placeholder="Descripción de la presentación">${
            initialData.presentation || ""
          }</textarea>
        </div>

        <div class="form-group">
          <label>Componentes:</label>
          <div id="componentsList" class="components-form-list">
            ${
              initialData.components && initialData.components.length > 0
                ? initialData.components
                    .map((comp, idx) => {
                      const matchedProduct = products.find(
                        (p) => p.id === comp.productId
                      );
                      return `
                      <div class="component-form-item">
                        <select name="components[${idx}].productId" class="component-product-select" required data-initial-product="${
                        comp.productId
                      }">
                          <option value="">Seleccionar producto...</option>
                          ${productOptions}
                        </select>
                        <input type="number" placeholder="Cantidad" name="components[${idx}].quantity" value="${
                        comp.quantity || ""
                      }" step="0.01" min="0" required>
                        <button type="button" class="btn-remove-component">Eliminar</button>
                      </div>
                    `;
                    })
                    .join("")
                : ""
            }
          </div>
          <button type="button" id="addComponentBtn" class="btn-add-component">+ Agregar Componente</button>
        </div>

        <div class="form-group">
          <label>Alérgenos:</label>
          <div class="allergens-selector">
            <div id="allergensList" class="allergens-list">
              <!-- Allergen chips will be inserted here -->
            </div>
            <select id="allergenSelect" class="allergen-dropdown">
              <option value="">Seleccionar alérgeno...</option>
              ${allergenOptions}
            </select>
            <input type="hidden" name="allergenIds" id="allergenIdsInput" value="${
              initialData.allergenIds ? initialData.allergenIds.join(",") : ""
            }">
          </div>
          <small class="help-text">Selecciona los alérgenos del menú desplegable</small>
        </div>

        <div class="modal-buttons">
          <button type="button" class="action-btn delete" id="cancelBtn">Cancelar</button>
          <button type="submit" class="action-btn primary">Guardar Receta</button>
        </div>
      </form>
    `;

    return { html, productOptions };
  } catch (error) {
    console.error("Error building recipe form:", error);
    throw error;
  }
}

function collectFormData(form, isRecipe) {
  const formData = new FormData(form);
  const data = {};

  if (isRecipe) {
    data.name = formData.get("name");
    data.elaboration = formData.get("elaboration");
    data.presentation = formData.get("presentation");

    const allergenIdsInput = formData.get("allergenIds");
    data.allergenIds = allergenIdsInput
      ? allergenIdsInput.split(",").map((id) => parseInt(id.trim()))
      : [];

    data.components = Array.from(
      form.querySelectorAll(".component-form-item")
    ).map((item) => {
      const productIdSelect = item.querySelector('select[name$=".productId"]');
      const quantityInput = item.querySelector('input[name$=".quantity"]');

      if (!productIdSelect || !quantityInput) {
        throw new Error("Estructura de componente incorrecta");
      }

      const productId = parseInt(productIdSelect.value);
      const quantity = parseFloat(quantityInput.value);

      if (!productId || isNaN(quantity) || quantity <= 0) {
        throw new Error(
          "Todos los componentes deben tener Product ID válido y cantidad mayor a 0"
        );
      }

      return { productId, quantity };
    });
  } else {
    data.name = formData.get("name");
    data.type = formData.get("type");
    data.unit = formData.get("unit");
    data.unitPrice = parseFloat(formData.get("unitPrice"));
    data.productCode = formData.get("productCode");
    data.currentStock = parseFloat(formData.get("currentStock"));
  }

  return data;
}

function setupComponentsDynamicUI(modal) {
  const addCompBtn = modal.querySelector("#addComponentBtn");
  const componentsList = modal.querySelector("#componentsList");

  const productOptions = modal.dataset.productOptions || "";

  addCompBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const idx = componentsList.querySelectorAll(".component-form-item").length;
    const div = document.createElement("div");
    div.className = "component-form-item";
    div.style.animation = "fadeInUp 0.3s ease";
    div.innerHTML = `
      <select name="components[${idx}].productId" class="component-product-select" required>
        <option value="">Seleccionar producto...</option>
        ${productOptions}
      </select>
      <input type="number" placeholder="Cantidad" name="components[${idx}].quantity" step="0.01" min="0" required>
      <button type="button" class="btn-remove-component">Eliminar</button>
    `;
    componentsList.appendChild(div);

    const removeBtn = div.querySelector(".btn-remove-component");
    removeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      div.style.animation = "fadeOut 0.3s ease forwards";
      setTimeout(() => {
        div.remove();
      }, 300);
    });
  });

  componentsList.querySelectorAll(".btn-remove-component").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const item = btn.closest(".component-form-item");
      item.style.animation = "fadeOut 0.3s ease forwards";
      setTimeout(() => {
        item.remove();
      }, 300);
    });
  });

  setupAllergenSelector(modal);
}

function setupAllergenSelector(modal) {
  const allergenSelect = modal.querySelector("#allergenSelect");
  const allergensList = modal.querySelector("#allergensList");
  const allergenIdsInput = modal.querySelector("#allergenIdsInput");
  const selectedAllergens = new Set();

  function updateHiddenInput() {
    allergenIdsInput.value = Array.from(selectedAllergens).join(",");
  }

  function renderAllergens() {
    allergensList.innerHTML = "";
    selectedAllergens.forEach((allergenId, index) => {
      const option = allergenSelect.querySelector(
        `option[value="${allergenId}"]`
      );
      if (option) {
        const chip = document.createElement("div");
        chip.className = "allergen-chip";
        chip.style.animation = `fadeInUp 0.3s ease ${index * 0.05}s backwards`;
        chip.innerHTML = `
          <span>${option.textContent}</span>
          <button type="button" class="chip-remove" data-id="${allergenId}">×</button>
        `;
        allergensList.appendChild(chip);

        chip.querySelector(".chip-remove").addEventListener("click", (e) => {
          e.preventDefault();
          chip.style.animation = "fadeOut 0.2s ease forwards";
          setTimeout(() => {
            selectedAllergens.delete(allergenId);
            renderAllergens();
            updateHiddenInput();
          }, 200);
        });
      }
    });
  }

  allergenSelect.addEventListener("change", (e) => {
    const selectedId = e.target.value;
    if (selectedId && !selectedAllergens.has(selectedId)) {
      selectedAllergens.add(selectedId);
      renderAllergens();
      updateHiddenInput();
      allergenSelect.value = "";
    }
  });

  const initialIds = allergenIdsInput.value;
  if (initialIds) {
    initialIds.split(",").forEach((id) => {
      const trimmedId = id.trim();
      if (trimmedId) {
        selectedAllergens.add(trimmedId);
      }
    });
    renderAllergens();
  }
}

export function createConfirmModal(title, message, onConfirm) {
  const overlay = createOverlay();
  overlay.classList.add("modal-overlay");

  const modal = document.createElement("div");
  modal.classList.add("modal-dialog");

  modal.innerHTML = `
    <h3>${title}</h3>
    <p>${message}</p>
    <div class="modal-buttons">
      <button class="action-btn" id="cancelBtn">Cancelar</button>
      <button class="action-btn delete" id="confirmBtn">Eliminar</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  modal.querySelector("#confirmBtn").onclick = () => {
    onConfirm();
    closeModal(overlay);
  };

  modal.querySelector("#cancelBtn").onclick = () => closeModal(overlay);

  setupOutsideClickClose(overlay, () => closeModal(overlay));

  return overlay;
}

export function createInfoModal(title, content) {
  const overlay = createOverlay();
  overlay.classList.add("modal-overlay");

  const modal = document.createElement("div");
  modal.classList.add("modal-dialog");

  modal.innerHTML = `
    <h3>${title}</h3>
    <div class="modal-content">
      ${content}
    </div>
    <div class="modal-buttons">
      <button class="action-btn" id="closeBtn">Cerrar</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  modal.querySelector("#closeBtn").onclick = () => closeModal(overlay);

  setupOutsideClickClose(overlay, () => closeModal(overlay));

  return overlay;
}

export async function createBarcodeScannerModal(onBarcodeScanned) {
  const { BarcodeScannerUtils } = await import(
    "../utils/barcode-scanner.utils.js"
  );

  const overlay = createOverlay();
  overlay.classList.add("modal-overlay");

  const modal = document.createElement("div");
  modal.classList.add("modal-dialog");
  modal.classList.add("barcode-scanner-modal");

  modal.innerHTML = `
    <div class="barcode-scanner-header">
      <h3>Escanear Código de Barras</h3>
    </div>
    <div id="qr-reader" class="scanner-container" style="width: 100%;"></div>
    <div class="scanner-controls">
      <button type="button" class="action-btn delete" id="cancelScanBtn">Cancelar</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const cancelBtn = modal.querySelector("#cancelScanBtn");
  const qrReader = modal.querySelector("#qr-reader");

  let isScanning = true;
  let scanner = null;

  const closeScannerModal = async () => {
    isScanning = false;
    if (qrReader._scannerCancel) {
      try {
        await qrReader._scannerCancel();
      } catch (e) {
        console.log("Error cancelling scanner:", e);
      }
    }
    if (scanner) {
      try {
        await scanner.stop();
        scanner.clear();
      } catch (e) {
        console.log("Error stopping scanner:", e);
      }
      scanner = null;
    }
    if (overlay && overlay.parentNode) {
      closeModal(overlay);
    }
  };

  cancelBtn.onclick = closeScannerModal;

  (async () => {
    try {
      console.log("Starting barcode scanner...");
      console.log("Container element:", qrReader);
      const { BarcodeScannerUtils } = await import(
        "../utils/barcode-scanner.utils.js"
      );

      const maxWait = 3000;
      const startTime = Date.now();
      while (
        BarcodeScannerUtils.cameraPreloadState.isPreloading &&
        Date.now() - startTime < maxWait
      ) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      console.log("Preload state ready, starting scanner...");
      const result = await BarcodeScannerUtils.startScanning(qrReader);

      if (result === null) {
        console.log("Scanner was cancelled");
        return;
      }

      console.log("Barcode scanned successfully:", result.barcode);
      scanner = result.scanner;
      if (isScanning) {
        await closeScannerModal();
        onBarcodeScanned(result.barcode);
      }
    } catch (error) {
      console.error("Scanner error:", error);
      console.error("Error stack:", error.stack);
      isScanning = false;
      let errorMsg = error.message || "Error desconocido";

      if (
        errorMsg.includes("NotAllowedError") ||
        errorMsg.includes("Permission") ||
        errorMsg.includes("denied")
      ) {
        errorMsg =
          "No se permitió acceso a la cámara. Verifica los permisos del navegador.";
      } else if (
        errorMsg.includes("NotFoundError") ||
        errorMsg.includes("requested device")
      ) {
        errorMsg = "No se encontró cámara en el dispositivo";
      } else if (errorMsg.includes("Timeout")) {
        errorMsg = "Tiempo de escaneo agotado";
      } else if (
        errorMsg.includes("NotReadableError") ||
        errorMsg.includes("could not start")
      ) {
        errorMsg =
          "No se puede acceder a la cámara. Intenta recargar la página.";
      }
      if (isScanning) {
        qrReader.innerHTML = `<p class="error-message">${errorMsg}</p>`;
        setTimeout(closeScannerModal, 3000);
      } else {
        await closeScannerModal();
      }
    }
  })();

  setupOutsideClickClose(overlay, closeScannerModal);

  return overlay;
}
