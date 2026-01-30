import { UsersAPI } from "./users.api.js";

const OrdersAPI = (() => {
  const API_BASE = "/api/orders";

  const extractErrorMessage = async (response) => {
    try {
      const data = await response.json();
      return (
        data.message ||
        data.error ||
        `Error ${response.status}: ${response.statusText}`
      );
    } catch {
      return `Error ${response.status}: ${response.statusText}`;
    }
  };

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

  const create = async (orderData) => {
    try {
      const response = await fetch(API_BASE, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorMsg = await extractErrorMessage(response);
        throw new Error(errorMsg);
      }

      return response.json();
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  };

  const getAll = async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `${API_BASE}?${queryString}` : API_BASE;

      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error("Error fetching orders:", error);
      throw error;
    }
  };

  const getById = async (orderId) => {
    try {
      const response = await fetch(`${API_BASE}/${orderId}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch order: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error("Error fetching order:", error);
      throw error;
    }
  };

  const update = async (orderId, orderData) => {
    try {
      const response = await fetch(`${API_BASE}/${orderId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update order: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error("Error updating order:", error);
      throw error;
    }
  };

  const delete_ = async (orderId) => {
    try {
      const response = await fetch(`${API_BASE}/${orderId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete order: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      throw error;
    }
  };

  const getByStatus = async (status) => {
    try {
      const response = await fetch(`${API_BASE}/status/${status}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch orders by status: ${response.statusText}`
        );
      }

      return response.json();
    } catch (error) {
      console.error("Error fetching orders by status:", error);
      throw error;
    }
  };

  const getPending = async () => {
    try {
      const response = await fetch(`${API_BASE}/reception/pending`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch pending orders: ${response.statusText}`
        );
      }

      return response.json();
    } catch (error) {
      console.error("Error fetching pending orders:", error);
      throw error;
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      let response = await fetch(`${API_BASE}/${orderId}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });

      if (!response.ok && response.status === 405) {
        const order = await getById(orderId);
        order.status = status;
        response = await fetch(`${API_BASE}/${orderId}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(order),
        });
      }

      if (!response.ok) {
        throw new Error(
          `Failed to update order status: ${response.statusText}`
        );
      }

      return response.json();
    } catch (error) {
      console.error("Error updating order status:", error);
      throw error;
    }
  };

  return {
    create,
    getAll,
    getById,
    update,
    delete: delete_,
    getByStatus,
    getPending,
    updateStatus,
  };
})();

export { OrdersAPI };
