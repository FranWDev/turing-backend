const API_BASE = "/api/recipes";

export async function getAllRecipes(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const url = queryString ? `${API_BASE}?${queryString}` : API_BASE;

  const response = await fetch(url, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch recipes: ${response.statusText}`);
  }

  return response.json();
}

export async function getRecipeById(id) {
  const response = await fetch(`${API_BASE}/${id}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch recipe ${id}: ${response.statusText}`);
  }

  return response.json();
}

export async function createRecipe(recipeData) {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(recipeData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || `Failed to create recipe: ${response.statusText}`
    );
  }

  return response.json();
}

export async function updateRecipe(id, recipeData) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(recipeData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || `Failed to update recipe: ${response.statusText}`
    );
  }

  return response.json();
}

export async function deleteRecipe(id) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete recipe: ${response.statusText}`);
  }
}

export async function searchRecipesByName(name) {
  const response = await fetch(
    `${API_BASE}/search?name=${encodeURIComponent(name)}`
  );

  if (!response.ok) {
    throw new Error(`Failed to search recipes: ${response.statusText}`);
  }

  return response.json();
}

export async function findRecipesByMaxCost(maxCost) {
  const response = await fetch(
    `${API_BASE}/maxcost?maxCost=${encodeURIComponent(maxCost)}`
  );

  if (!response.ok) {
    throw new Error(`Failed to find recipes by cost: ${response.statusText}`);
  }

  return response.json();
}

export async function getAllAllergens() {
  try {
    const response = await fetch("/api/allergens?page=0&size=100");

    if (!response.ok) {
      console.error(
        "Allergens response error:",
        response.status,
        response.statusText
      );
      throw new Error(`Failed to fetch allergens: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Allergens data received:", data);

    if (data.content && Array.isArray(data.content)) {
      return data.content;
    }

    if (Array.isArray(data)) {
      return data;
    }

    console.warn("Unexpected allergens response format:", data);
    return [];
  } catch (error) {
    console.error("Error fetching allergens:", error);
    throw error;
  }
}

export async function getAllProducts() {
  try {
    const response = await fetch("/api/products?page=0&size=500");

    if (!response.ok) {
      console.error(
        "Products response error:",
        response.status,
        response.statusText
      );
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Products data received:", data);

    if (data.content && Array.isArray(data.content)) {
      return data.content;
    }

    if (Array.isArray(data)) {
      return data;
    }

    console.warn("Unexpected products response format:", data);
    return [];
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
}
