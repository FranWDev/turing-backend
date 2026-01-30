import { UsersAPI } from "./users.api.js";

const ProductsAPI = (() => {
  const API_BASE = "/api/products";

  const getAuthHeaders = () => {
    const headers = {
      "Content-Type": "application/json",
    };

    const token = UsersAPI.getStoredToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  };

  const getAll = async (params = {}) => {
    try {
      const defaultParams = { page: 0, size: 50, ...params };
      const queryString = new URLSearchParams(defaultParams).toString();
      const url = `${API_BASE}?${queryString}`;
      console.log("Fetching products:", url);
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  };

  const getById = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch product: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error("Error fetching product:", error);
      throw error;
    }
  };

  const create = async (productData) => {
    try {
      const response = await fetch(API_BASE, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to create product: ${errorText || response.statusText}`
        );
      }

      return response.json();
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  };

  const update = async (id, productData) => {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update product: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    }
  };

  const delete_ = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete product: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      throw error;
    }
  };

  return {
    getAll,
    getById,
    create,
    update,
    delete: delete_,
  };
})();

export { ProductsAPI };
