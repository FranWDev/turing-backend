export const LoadingComponent = {
  showFullPageLoader(message = "Cargando...") {
    if (document.getElementById("loading-overlay-fullpage")) {
      return document.getElementById("loading-overlay-fullpage");
    }

    const overlay = document.createElement("div");
    overlay.id = "loading-overlay-fullpage";
    overlay.className = "loading-overlay";

    const spinner = document.createElement("div");
    spinner.className = "loading-spinner";

    const spinnerCircle = document.createElement("div");
    spinnerCircle.className = "spinner-circular";

    const loadingText = document.createElement("p");
    loadingText.className = "loading-text";
    loadingText.textContent = message;

    spinner.appendChild(spinnerCircle);
    spinner.appendChild(loadingText);
    overlay.appendChild(spinner);
    document.body.appendChild(overlay);

    return overlay;
  },

  hideFullPageLoader() {
    const overlay = document.getElementById("loading-overlay-fullpage");
    if (overlay) {
      overlay.style.animation = "fadeOut 0.3s ease-in-out";
      setTimeout(() => overlay.remove(), 300);
    }
  },

  showInlineLoader(container) {
    const element =
      typeof container === "string"
        ? document.querySelector(container)
        : container;
    if (!element) return;

    element.innerHTML = "";
    element.classList.add("loading-inline");

    const spinner = document.createElement("div");
    spinner.className = "spinner-circular";

    element.appendChild(spinner);
  },

  hideInlineLoader(container) {
    const element =
      typeof container === "string"
        ? document.querySelector(container)
        : container;
    if (element) {
      element.classList.remove("loading-inline");
      const spinner = element.querySelector(".spinner-circular");
      if (spinner) {
        spinner.remove();
      }
    }
  },

  disableButtonWithLoader(button, originalText = button.textContent) {
    button.disabled = true;
    button.dataset.originalText = originalText;

    const spinner = document.createElement("div");
    spinner.className = "spinner-mini";

    button.textContent = "";
    button.appendChild(spinner);

    const text = document.createElement("span");
    text.textContent = "Procesando";
    button.appendChild(text);

    return () => {
      button.disabled = false;
      button.textContent = originalText;
    };
  },

  showTableSkeleton(tableBody, rows = 5, cols = 4) {
    tableBody.innerHTML = "";

    for (let i = 0; i < rows; i++) {
      const row = document.createElement("tr");

      for (let j = 0; j < cols; j++) {
        const cell = document.createElement("td");
        cell.className = "skeleton";
        cell.style.height = "24px";
        cell.style.marginBottom = "8px";
        cell.style.borderRadius = "4px";
        row.appendChild(cell);
      }

      tableBody.appendChild(row);
    }
  },

  showDotsLoader(message = "Procesando") {
    if (document.getElementById("loading-overlay-dots")) {
      return document.getElementById("loading-overlay-dots");
    }

    const overlay = document.createElement("div");
    overlay.id = "loading-overlay-dots";
    overlay.className = "loading-overlay";

    const spinner = document.createElement("div");
    spinner.className = "loading-spinner";

    const dotsContainer = document.createElement("div");
    dotsContainer.className = "spinner-dots";

    for (let i = 0; i < 3; i++) {
      const dot = document.createElement("div");
      dot.className = "spinner-dot";
      dotsContainer.appendChild(dot);
    }

    const loadingText = document.createElement("p");
    loadingText.className = "loading-text";
    loadingText.textContent = message;

    spinner.appendChild(dotsContainer);
    spinner.appendChild(loadingText);
    overlay.appendChild(spinner);
    document.body.appendChild(overlay);

    return overlay;
  },

  hideDotsLoader() {
    const overlay = document.getElementById("loading-overlay-dots");
    if (overlay) {
      overlay.style.animation = "fadeOut 0.3s ease-in-out";
      setTimeout(() => overlay.remove(), 300);
    }
  },
};

export default LoadingComponent;
