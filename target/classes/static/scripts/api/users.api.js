const UsersAPI = (() => {
  const API_BASE = '/api';
  const USERS_ENDPOINT = `${API_BASE}/users`;
  const AUTH_ENDPOINT = `${API_BASE}/auth`;

  const login = async (name, password) => {
    try {
      const response = await fetch(`${AUTH_ENDPOINT}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, password }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Login failed: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };
  const register = async (userData) => {
    try {
      const response = await fetch(`${AUTH_ENDPOINT}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Registration failed: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const validateToken = async (token) => {
    try {
      const response = await fetch(`${AUTH_ENDPOINT}/validate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Token validation error:', error);
      throw error;
    }
  };

  const getAll = async () => {
    try {
      const token = getStoredToken();
      const response = await fetch(USERS_ENDPOINT, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get users error:', error);
      throw error;
    }
  };

  const getById = async (id) => {
    try {
      const token = getStoredToken();
      const response = await fetch(`${USERS_ENDPOINT}/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  };

  const update = async (id, userData) => {
    try {
      const token = getStoredToken();
      const response = await fetch(`${USERS_ENDPOINT}/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Update failed: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  const delete_ = async (id) => {
    try {
      const token = getStoredToken();
      const response = await fetch(`${USERS_ENDPOINT}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  };

  const saveToken = (token, expiresInDays = 7) => {
    const date = new Date();
    date.setTime(date.getTime() + expiresInDays * 24 * 60 * 60 * 1000);
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `auth_token=${token};${expires};path=/;SameSite=Strict`;
  };

  const getStoredToken = () => {
    const nameEQ = 'auth_token=';
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.indexOf(nameEQ) === 0) {
        const token = cookie.substring(nameEQ.length);
        return token;
      }
    }

    return null;
  };

  const removeToken = () => {
    document.cookie = 'auth_token=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;';
  };

  const isAuthenticated = () => {
    const token = getStoredToken();
    if (!token) {
      console.log('No token found');
      return false;
    }

    try {
      console.log('Token found:', token.substring(0, 20) + '...');
      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  };

  const logout = () => {
    removeToken();
  };

  return {
    login,
    register,
    validateToken,
    getAll,
    getAllUsers: getAll,
    getById,
    update,
    delete: delete_,
    saveToken,
    getStoredToken,
    removeToken,
    isAuthenticated,
    logout,
  };
})();

export { UsersAPI };