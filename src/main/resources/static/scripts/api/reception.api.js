const API_BASE = "/api/orders";

function getAuthHeaders() {
  const headers = {
    "Content-Type": "application/json",
  };

  if (typeof UsersAPI !== "undefined") {
    const token = UsersAPI.getStoredToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  return headers;
}

export async function getPendingOrders() {
  try {
    const response = await fetch(`${API_BASE}/reception/pending`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch pending orders: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching pending orders:", error);
    throw error;
  }
}

export async function processReception(receptionData) {
  try {
    const response = await fetch(`${API_BASE}/reception`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(receptionData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to process reception: ${errorText || response.statusText}`
      );
    }

    return response.json();
  } catch (error) {
    console.error("Error processing reception:", error);
    throw error;
  }
}

export async function getOrderById(orderId) {
  try {
    const response = await fetch(`${API_BASE}/${orderId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch order: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching order:", error);
    throw error;
  }
}
