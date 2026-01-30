import { ProductsAPI } from "../api/products.api.js";
import {
  showNotification,
  showErrorNotification,
} from "./notification.component.js";
import {
  createFormModal,
  createConfirmModal,
  createInfoModal,
  createBarcodeScannerModal,
} from "./modal.component.js";
import { SearchSortUtils } from "../utils/search-sort.utils.js";
import { LoadingComponent } from "./loading.component.js";

let tableBodyRef = null;
let eventDelegationSetup = false;
let allProducts = [];
let displayedProducts = [];
let currentSortBy = "name";
let currentSortDirection = "asc";
let searchInput = null;
let currentSearchTerm = "";

export function initProductComponent(tableBody) {
  tableBodyRef = tableBody;
  const inventoryHeader = document.querySelector(".inventory-header");

  searchInput = document.querySelector(".inventory-search");

  const addButton = document.createElement("button");
  addButton.className = "action-btn primary";
  addButton.textContent = "+ Añadir Producto";
  addButton.style.marginLeft = "10px";
  addButton.onclick = showAddProductForm;

  const controls = inventoryHeader.querySelector(".inventory-controls");
  controls.appendChild(addButton);

  loadProducts();

  if (!eventDelegationSetup) {
    setupEventDelegation();
    eventDelegationSetup = true;
  }

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      handleSearch(e.target.value);
    });
  }

  const table = document.querySelector(".inventory-table");
  if (table) {
    setupSortHeaders(table);
  }

  // Setup mobile sort selector
  setupMobileSortSelector();

  // Setup barcode scanner
  setupBarcodeScanner();

  window.addEventListener("productCreated", loadProducts);
  window.addEventListener("productUpdated", loadProducts);
  window.addEventListener("productDeleted", loadProducts);
  window.addEventListener("productDataChanged", loadProducts);
}

export async function loadProducts() {
  try {
    LoadingComponent.showTableSkeleton(tableBodyRef, 5, 6);
    const data = await ProductsAPI.getAll();
    allProducts = data.content || [];
    displayedProducts = allProducts;
    renderProducts(allProducts);
  } catch (error) {
    console.error("Error loading products:", error);
    tableBodyRef.innerHTML = `<tr><td colspan="6" class="table-error-message">Error al cargar datos</td></tr>`;
    showErrorNotification("Error al cargar productos");
  }
}

function renderProducts(products) {
  if (!tableBodyRef) return;

  if (!products || products.length === 0) {
    tableBodyRef.innerHTML = `<tr><td colspan="6" class="table-empty-message">No hay productos disponibles</td></tr>`;
    return;
  }

  tableBodyRef.innerHTML = "";
  products.forEach((product) => {
    const total = product.unitPrice * product.currentStock;
    const row = document.createElement("tr");
    row.setAttribute("data-id", product.id);

    row.innerHTML = `
      <td data-label="Nombre:">${escapeHtml(product.name)}</td>
      <td data-label="Tipo:">${escapeHtml(product.type || "N/A")}</td>
      <td data-label="Cantidad:">${product.currentStock} ${escapeHtml(
      product.unit
    )}</td>
      <td data-label="Precio:">€${product.unitPrice.toFixed(2)}</td>
      <td data-label="Total:">€${total.toFixed(2)}</td>
      <td data-label="Acciones:">
        <button class="action-btn btn-view" data-id="${product.id}">Ver</button>
        <button class="action-btn btn-edit" data-id="${
          product.id
        }">Editar</button>
        <button class="action-btn delete btn-delete" data-id="${
          product.id
        }">Borrar</button>
      </td>
    `;

    tableBodyRef.appendChild(row);
  });
}

function setupEventDelegation() {
  if (!tableBodyRef) return;

  tableBodyRef.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-id]");
    if (!btn) return;

    const id = parseInt(btn.dataset.id);

    if (btn.classList.contains("btn-view")) {
      e.preventDefault();
      showProductDetails(id);
    } else if (btn.classList.contains("btn-edit")) {
      e.preventDefault();
      showEditProductForm(id);
    } else if (btn.classList.contains("btn-delete")) {
      e.preventDefault();
      showDeleteConfirmation(id);
    }
  });
}

function setupSortHeaders(table) {
  SearchSortUtils.setupSortHeaders(table, (sortBy, direction) => {
    currentSortBy = sortBy;
    currentSortDirection = direction;
    applySort();
  });
}

function handleSearch(searchTerm) {
  currentSearchTerm = searchTerm;
  const filtered = SearchSortUtils.filterItems(allProducts, searchTerm, [
    "name",
    "type",
    "productCode",
    "unit",
  ]);
  displayedProducts = filtered;
  applySort();
}

function applySort() {
  const calculatedFields = {
    total: (item) => item.unitPrice * item.currentStock,
  };

  const sorted = SearchSortUtils.sortItems(
    displayedProducts,
    currentSortBy,
    currentSortDirection,
    calculatedFields
  );
  renderProducts(sorted);
}

async function showAddProductForm() {
  const modal = await createFormModal(
    "Añadir Producto",
    {
      name: "",
      type: "Ingrediente",
      currentStock: "",
      unit: "kg",
      unitPrice: "",
      productCode: "",
    },
    async (formData) => {
      await handleFormSubmit(formData);
    }
  );
}

async function showEditProductForm(id) {
  try {
    const product = await ProductsAPI.getById(id);

    const modal = await createFormModal(
      "Editar Producto",
      {
        name: product.name,
        type: product.type,
        currentStock: product.currentStock,
        unit: product.unit,
        unitPrice: product.unitPrice,
        productCode: product.productCode,
      },
      async (formData) => {
        await handleEditSubmit(id, formData);
      }
    );
  } catch (error) {
    console.error("Error loading product:", error);
    showErrorNotification("Error al cargar datos del producto");
  }
}

async function showProductDetails(id) {
  try {
    const product = await ProductsAPI.getById(id);

    const total = product.unitPrice * product.currentStock;
    const content = `
      <p><strong>Nombre:</strong> ${escapeHtml(product.name)}</p>
      <p><strong>Tipo:</strong> ${escapeHtml(product.type || "N/A")}</p>
      <p><strong>Código de barras:</strong> ${escapeHtml(
        product.productCode || "N/A"
      )}</p>
      <p><strong>Cantidad:</strong> ${product.currentStock} ${escapeHtml(
      product.unit
    )}</p>
      <p><strong>Precio unitario:</strong> €${product.unitPrice.toFixed(2)}</p>
      <p><strong>Total:</strong> €${total.toFixed(2)}</p>
    `;

    createInfoModal("Detalles del Producto", content);
  } catch (error) {
    console.error("Error fetching product details:", error);
    showErrorNotification("Error al cargar detalles del producto");
  }
}

function showDeleteConfirmation(id) {
  createConfirmModal(
    "Confirmar eliminación",
    "¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.",
    () => handleDeleteProduct(id)
  );
}

async function handleFormSubmit(formData) {
  try {
    LoadingComponent.showDotsLoader('Añadiendo producto...');
    await ProductsAPI.create(formData);
    LoadingComponent.hideDotsLoader();
    showNotification("✓ Producto añadido correctamente", "success");
    window.dispatchEvent(new Event("productCreated"));
  } catch (error) {
    LoadingComponent.hideDotsLoader();
    console.error("Error creating product:", error);
    const errorMsg = error?.message || "Error desconocido";
    showErrorNotification(`✗ Error al añadir producto: ${errorMsg}`);
  }
}

async function handleEditSubmit(id, formData) {
  try {
    LoadingComponent.showDotsLoader('Actualizando producto...');
    await ProductsAPI.update(id, formData);
    LoadingComponent.hideDotsLoader();
    showNotification("✓ Producto actualizado correctamente", "success");
    window.dispatchEvent(new Event("productUpdated"));
  } catch (error) {
    LoadingComponent.hideDotsLoader();
    console.error("Error updating product:", error);
    const errorMsg = error?.message || "Error desconocido";
    showErrorNotification(`✗ Error al actualizar: ${errorMsg}`);
  }
}

async function handleDeleteProduct(id) {
  try {
    LoadingComponent.showDotsLoader('Eliminando producto...');
    await ProductsAPI.delete(id);
    LoadingComponent.hideDotsLoader();
    showNotification("✓ Producto eliminado correctamente", "success");
    window.dispatchEvent(new Event("productDeleted"));
  } catch (error) {
    LoadingComponent.hideDotsLoader();
    console.error("Error deleting product:", error);
    const errorMsg = error?.message || "Error desconocido";
    showErrorNotification(`✗ Error al eliminar producto: ${errorMsg}`);
  }
}

function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

function setupMobileSortSelector() {
  const sortSelect = document.querySelector(".mobile-sort-select");
  if (!sortSelect) return;

  sortSelect.addEventListener("change", (e) => {
    const [sortBy, direction] = e.target.value.split("|");
    currentSortBy = sortBy;
    currentSortDirection = direction;
    applySort();
    
    // Reset select to default after selection
    setTimeout(() => {
      sortSelect.value = "";
    }, 0);
  });
}

function setupBarcodeScanner() {
  const scannerBtn = document.querySelector("#barcodeScannerBtn");
  if (!scannerBtn) return;

  scannerBtn.addEventListener("click", async () => {
    try {
      await createBarcodeScannerModal(async (barcode) => {
        handleBarcodeScanned(barcode);
      });
    } catch (error) {
      console.error("Barcode scanner error:", error);
      showErrorNotification("Error al abrir el escáner: " + error.message);
    }
  });
}

async function handleBarcodeScanned(barcode) {
  try {
    const product = allProducts.find(
      (p) => p.productCode && p.productCode.toString().trim() === barcode.trim()
    );

    if (product) {
      showProductDetails(product.id);
    } else {
      searchInput.value = barcode;
      handleSearch(barcode);

      showNotification(
        `No se encontró producto con código "${barcode}". Se mostrarán resultados de búsqueda.`,
        "info"
      );
    }
  } catch (error) {
    console.error("Error handling barcode:", error);
    showErrorNotification("Error al procesar el código de barras");
  }
}


