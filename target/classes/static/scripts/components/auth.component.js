import { UsersAPI } from "../api/users.api.js";

const AuthComponent = (() => {
  const init = () => {
    const currentPath = window.location.pathname;
    const isLoginPage = currentPath.includes("/login");
    const isProtectedPage =
      currentPath === "/" || currentPath === "/index" || currentPath === "";

    if (isProtectedPage && !UsersAPI.isAuthenticated()) {
      console.warn("User not authenticated, redirecting to login");
      window.location.href = "/login";
      return false;
    }

    if (isLoginPage && UsersAPI.isAuthenticated()) {
      console.warn("User already authenticated, redirecting to index");
      window.location.href = "/";
      return false;
    }

    setupLogoutButton();

    updateUserDisplay();

    return true;
  };

  const setupLogoutButton = () => {
    const logoutLink = document.querySelector(".logout");
    if (logoutLink) {
      logoutLink.addEventListener("click", (e) => {
        e.preventDefault();
        handleLogout();
      });
    }
  };

  const handleLogout = async () => {
    try {
      UsersAPI.logout();

      showLogoutNotification();

      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
    } catch (error) {
      console.error("Logout error:", error);
      UsersAPI.logout();
      window.location.href = "/login";
    }
  };

  const updateUserDisplay = () => {
    try {
      const token = UsersAPI.getStoredToken();
      if (!token) return;

      const parts = token.split(".");
      if (parts.length !== 3) return;

      const payload = JSON.parse(atob(parts[1]));
      const usernameElement = document.querySelector(".username-text");

      if (usernameElement && payload.sub) {
        usernameElement.textContent = payload.sub;
      }
    } catch (error) {
      console.warn("Could not decode token:", error);
    }
  };

  const showLogoutNotification = () => {
    const notification = document.createElement("div");
    notification.className = "notification notification-success";
    notification.textContent = "¡Sesión cerrada correctamente!";
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
      z-index: 9999;
      animation: slideInRight 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 2000);
  };

  const getCurrentUser = () => {
    try {
      const token = UsersAPI.getStoredToken();
      if (!token) return null;

      const parts = token.split(".");
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1]));
      return {
        username: payload.sub,
        roles: payload.roles || [],
        exp: payload.exp,
      };
    } catch (error) {
      console.warn("Could not get current user:", error);
      return null;
    }
  };

  const isTokenExpired = () => {
    try {
      const user = getCurrentUser();
      if (!user || !user.exp) return true;

      const now = Math.floor(Date.now() / 1000);
      return now > user.exp;
    } catch {
      return true;
    }
  };

  const setupTokenExpirationCheck = () => {
    const checkInterval = setInterval(() => {
      if (isTokenExpired()) {
        console.warn("Token expired, logging out");
        UsersAPI.logout();
        window.location.href = "/login";
        clearInterval(checkInterval);
      }
    }, 60000);
  };

  return {
    init,
    handleLogout,
    getCurrentUser,
    isTokenExpired,
    setupTokenExpirationCheck,
    updateUserDisplay,
  };
})();

export { AuthComponent };
