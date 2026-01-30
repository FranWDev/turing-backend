import * as RecipeAPI from "../api/recipes.api.js";
import {
  showNotification,
  showErrorNotification,
  showSuccessNotification,
} from "./notification.component.js";
import { createFormModal, createConfirmModal } from "./modal.component.js";
import { LoadingComponent } from "./loading.component.js";

let recipesGridRef = null;
let recipesSearchRef = null;
let recipesFilterRef = null;
let eventDelegationSetup = false;
let currentRecipes = [];

export function initRecipeComponent() {
  recipesGridRef = document.querySelector("#recipesGrid");
  recipesSearchRef = document.querySelector(".recipes-search");
  recipesFilterRef = document.querySelector(".recipes-filter");

  if (!recipesGridRef) return;

  const recipesHeader = document.querySelector(".recipes-header");

  const addButton = document.createElement("button");
  addButton.className = "action-btn primary";
  addButton.textContent = "+ Añadir Receta";
  addButton.onclick = showAddRecipeForm;

  const controls = recipesHeader.querySelector(".recipes-controls");
  controls.insertBefore(addButton, controls.firstChild);

  loadRecipes();

  if (!eventDelegationSetup) {
    setupEventDelegation();
    eventDelegationSetup = true;
  }

  if (recipesSearchRef) {
    recipesSearchRef.addEventListener("input", (e) => {
      const searchTerm = e.target.value.trim();
      if (searchTerm) {
        searchRecipes(searchTerm);
      } else {
        loadRecipes();
      }
    });
  }

  if (recipesFilterRef) {
    recipesFilterRef.addEventListener("change", (e) => {
      const filterValue = e.target.value;
      if (filterValue) {
        filterRecipes(filterValue);
      } else {
        loadRecipes();
      }
    });
  }

  window.addEventListener("recipeCreated", loadRecipes);
  window.addEventListener("recipeUpdated", loadRecipes);
  window.addEventListener("recipeDeleted", loadRecipes);
}

export async function loadRecipes() {
  try {
    if (recipesGridRef) LoadingComponent.showInlineLoader(recipesGridRef);
    const data = await RecipeAPI.getAllRecipes();
    currentRecipes = data.content || data;
    renderRecipes(currentRecipes);
    if (recipesGridRef) LoadingComponent.hideInlineLoader(recipesGridRef);
  } catch (error) {
    console.error("Error loading recipes:", error);
    if (recipesGridRef) LoadingComponent.hideInlineLoader(recipesGridRef);
    showEmptyState("Error al cargar recetas. Intenta de nuevo.");
    showErrorNotification("Error al cargar recetas");
  }
}

function renderRecipes(recipes) {
  if (!recipesGridRef) return;

  if (!recipes || recipes.length === 0) {
    showEmptyState("No hay recetas disponibles. ¡Crea una nueva!");
    return;
  }

  recipesGridRef.innerHTML = "";
  recipes.forEach((recipe) => {
    const card = createRecipeCard(recipe);
    recipesGridRef.appendChild(card);
  });
}

function createRecipeCard(recipe) {
  const card = document.createElement("div");
  card.className = "recipe-card";
  card.setAttribute("data-id", recipe.id);

  const allergensList =
    recipe.allergens && recipe.allergens.length > 0
      ? recipe.allergens.map((a) => a.name).join(", ")
      : "Sin alérgenos";

  card.innerHTML = `
    <div class="recipe-card-header">
      <h3 class="recipe-name">${escapeHtml(recipe.name)}</h3>
      <span class="recipe-cost">€${recipe.totalCost.toFixed(2)}</span>
    </div>
    
    <div class="recipe-content">
      <div class="recipe-section">
        <h4>Presentación</h4>
        <p class="recipe-presentation">${escapeHtml(recipe.presentation)}</p>
      </div>
      
      <div class="recipe-section">
        <h4>Alérgenos</h4>
        <p class="recipe-allergens">${escapeHtml(allergensList)}</p>
      </div>
      
      <div class="recipe-section">
        <h4>Componentes</h4>
        <div class="recipe-components">
          ${recipe.components
            .map(
              (comp) => `
            <div class="component-item">
              <span class="component-name">${escapeHtml(
                comp.productName || "N/A"
              )}</span>
              <span class="component-qty">${comp.quantity} ${escapeHtml(
                comp.unit || "un"
              )}</span>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    </div>
    
    <div class="recipe-card-footer">
      <button class="action-btn btn-view" data-id="${recipe.id}">Ver</button>
      <button class="action-btn btn-edit" data-id="${recipe.id}">Editar</button>
      <button class="action-btn btn-delete" data-id="${
        recipe.id
      }">Borrar</button>
    </div>
  `;

  return card;
}

function setupEventDelegation() {
  if (!recipesGridRef) return;

  recipesGridRef.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-id]");
    if (!btn) return;

    const id = parseInt(btn.dataset.id);

    if (btn.classList.contains("btn-view")) {
      e.preventDefault();
      showRecipeDetails(id);
    } else if (btn.classList.contains("btn-edit")) {
      e.preventDefault();
      showEditRecipeForm(id);
    } else if (btn.classList.contains("btn-delete")) {
      e.preventDefault();
      showDeleteConfirmation(id);
    }
  });
}

async function showAddRecipeForm() {
  const modal = await createFormModal(
    "Añadir Receta",
    {
      name: "",
      elaboration: "",
      presentation: "",
      components: [],
      allergenIds: [],
    },
    async (formData) => {
      await handleRecipeSubmit(formData);
    }
  );
}

async function showEditRecipeForm(id) {
  try {
    const recipe = await RecipeAPI.getRecipeById(id);

    const modal = await createFormModal(
      "Editar Receta",
      {
        name: recipe.name,
        elaboration: recipe.elaboration,
        presentation: recipe.presentation,
        components: recipe.components || [],
        allergenIds: recipe.allergens ? recipe.allergens.map((a) => a.id) : [],
      },
      async (formData) => {
        formData.id = id;
        await handleRecipeSubmit(formData, id);
      }
    );
  } catch (error) {
    console.error("Error loading recipe:", error);
    showErrorNotification("Error al cargar la receta");
  }
}

async function showRecipeDetails(id) {
  try {
    const recipe = await RecipeAPI.getRecipeById(id);

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
    modal.className = "modal-dialog recipe-details-modal";
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
        <h2>Detalles de Receta: ${escapeHtml(recipe.name)}</h2>
      </div>

      <div class="modal-content">
        <div class="recipe-info-section">
          <h3>Información General</h3>
          <div class="info-row">
            <span class="info-label">Costo Total:</span>
            <span class="info-value">€${recipe.totalCost.toFixed(2)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Presentación:</span>
            <span class="info-value">${escapeHtml(recipe.presentation)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Elaboración:</span>
            <span class="info-value">${escapeHtml(recipe.elaboration)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Alérgenos:</span>
            <span class="info-value">${
              recipe.allergens && recipe.allergens.length > 0
                ? recipe.allergens.map((a) => a.name).join(", ")
                : "Sin alérgenos"
            }</span>
          </div>
        </div>

        <div class="components-section">
          <h3>Componentes</h3>
          <table class="items-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Costo</th>
              </tr>
            </thead>
            <tbody>
              ${recipe.components
                .map(
                  (comp) => `
                <tr>
                  <td>${escapeHtml(comp.productName || "N/A")}</td>
                  <td>${comp.quantity} ${escapeHtml(comp.unit || "un")}</td>
                  <td>€${(comp.unitPrice * comp.quantity).toFixed(2)}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>

      <div class="modal-footer">
        <button class="action-btn secondary close-modal">Cerrar</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const closeBtn = modal.querySelector(".close-modal");
    closeBtn.addEventListener("click", () => overlay.remove());

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });
  } catch (error) {
    console.error("Error loading recipe details:", error);
    showErrorNotification("Error al cargar los detalles de la receta");
  }
}

function showDeleteConfirmation(id) {
  createConfirmModal(
    "Eliminar Receta",
    "¿Estás seguro de que deseas eliminar esta receta? Esta acción no se puede deshacer.",
    async () => {
      await handleRecipeDelete(id);
    }
  );
}

async function handleRecipeSubmit(formData, id) {
  try {
    const recipePayload = {
      name: formData.name,
      elaboration: formData.elaboration,
      presentation: formData.presentation,
      allergenIds: formData.allergenIds || [],
      components: formData.components || [],
    };

    let result;
    if (id) {
      result = await RecipeAPI.updateRecipe(id, recipePayload);
      showSuccessNotification("✓ Receta actualizada correctamente");
      window.dispatchEvent(new CustomEvent("recipeUpdated"));
    } else {
      result = await RecipeAPI.createRecipe(recipePayload);
      showSuccessNotification("✓ Receta creada correctamente");
      window.dispatchEvent(new CustomEvent("recipeCreated"));
    }
  } catch (error) {
    console.error("Error submitting recipe:", error);
    const errorMsg = error?.message || "Error desconocido";
    showErrorNotification(`✗ Error al guardar receta: ${errorMsg}`);
  }
}

async function handleRecipeDelete(id) {
  try {
    await RecipeAPI.deleteRecipe(id);
    showSuccessNotification("✓ Receta eliminada correctamente");
    window.dispatchEvent(new CustomEvent("recipeDeleted"));
  } catch (error) {
    console.error("Error deleting recipe:", error);
    const errorMsg = error?.message || "Error desconocido";
    showErrorNotification(`✗ Error al eliminar receta: ${errorMsg}`);
  }
}

async function searchRecipes(searchTerm) {
  try {
    const results = await RecipeAPI.searchRecipesByName(searchTerm);
    renderRecipes(results);
  } catch (error) {
    console.error("Error searching recipes:", error);
    showErrorNotification("✗ Error al buscar recetas");
  }
}

async function filterRecipes(filterValue) {
  try {
    let filtered;

    if (filterValue === "cost-asc") {
      filtered = [...currentRecipes].sort((a, b) => a.totalCost - b.totalCost);
    } else if (filterValue === "cost-desc") {
      filtered = [...currentRecipes].sort((a, b) => b.totalCost - a.totalCost);
    } else {
      filtered = currentRecipes;
    }

    renderRecipes(filtered);
  } catch (error) {
    console.error("Error filtering recipes:", error);
    showErrorNotification("✗ Error al filtrar recetas");
  }
}

function showEmptyState(message) {
  if (!recipesGridRef) return;
  recipesGridRef.innerHTML = `
    <div class="recipes-empty-state">
      <div class="empty-icon">🍳</div>
      <p>${message}</p>
    </div>
  `;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
