import { UsersAPI } from "../api/users.api.js";
import {
  showSuccessNotification,
  showErrorNotification,
} from "./notification.component.js";

const LoginComponent = (() => {
  const loginForm = document.getElementById("loginForm");
  const loginBtn = document.getElementById("loginBtn");
  const loginError = document.getElementById("loginError");
  const nameInput = document.getElementById("name");
  const passwordInput = document.getElementById("password");

  const init = () => {
    console.log("Initializing login component");

    UsersAPI.removeToken();

    if (UsersAPI.isAuthenticated()) {
      console.log("User already authenticated, redirecting to index");
      redirectToIndex();
      return;
    }

    if (loginForm && loginBtn) {
      loginForm.addEventListener(
        "submit",
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          return false;
        },
        true
      );

      loginBtn.addEventListener("click", handleLogin);
      console.log("Login handlers attached");
    } else {
      console.error("Login form or button not found");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    console.log("Login button clicked");

    const name = nameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!name || !password) {
      showErrorNotification("Por favor, completa todos los campos");
      return;
    }

    try {
      loginBtn.disabled = true;
      loginBtn.textContent = "Iniciando sesión...";

      console.log("Sending login request for user:", name);
      const response = await UsersAPI.login(name, password);

      console.log("Login response received:", response);

      if (response.token) {
        UsersAPI.saveToken(response.token);

        showSuccessNotification("¡Sesión iniciada correctamente!");

        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      } else {
        showErrorNotification("No se recibió token de autenticación");
        loginBtn.disabled = false;
        loginBtn.textContent = "Iniciar Sesión";
      }
    } catch (error) {
      console.error("Login error:", error);

      let errorMessage = "Error al iniciar sesión";

      if (error.message.includes("401")) {
        errorMessage = "Credenciales inválidas";
      } else if (error.message.includes("400")) {
        errorMessage = "Datos incompletos o inválidos";
      } else if (error.message.includes("500")) {
        errorMessage = "Error del servidor. Intenta más tarde";
      } else if (error.message.includes("fetch")) {
        errorMessage = "No se pudo conectar con el servidor";
      } else {
        errorMessage = error.message || "Error desconocido";
      }

      showErrorNotification(errorMessage);
      loginBtn.disabled = false;
      loginBtn.textContent = "Iniciar Sesión";
    }
  };

  const showError = (message) => {
    if (loginError) {
      loginError.textContent = message;
      loginError.style.display = "block";
    }
  };

  const hideError = () => {
    if (loginError) {
      loginError.style.display = "none";
      loginError.textContent = "";
    }
  };

  const redirectToIndex = () => {
    window.location.href = "/";
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  return {
    init,
    handleLogin,
    showError,
    hideError,
    redirectToIndex,
  };
})();

export default LoginComponent;
