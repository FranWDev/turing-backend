import { CacheUtils } from "../utils/cache.utils.js";

export function initNavRouter() {
  const routes = {
    inventory: {
      index: 0,
      label: "Inventario",
      sectionId: "inventory-section",
    },
    reception: {
      index: 1,
      label: "Recepcion",
      sectionId: "reception-section",
    },
    history: {
      index: 2,
      label: "Historial",
      sectionId: "history-section",
    },
    recipes: {
      index: 3,
      label: "Recetas",
      sectionId: "recipes-section",
    },
  };

  const lastRoute = CacheUtils.getLastRoute();
  const initialRoute = CacheUtils.isValidRoute(lastRoute, routes)
    ? lastRoute
    : "inventory";

  const appState = {
    currentRoute: initialRoute,
    routes: routes,
    sections: new Map(),
  };

  const mainElement = document.querySelector("main");
  if (!mainElement) return appState;

  Object.entries(routes).forEach(([routeName, config]) => {
    let section = document.getElementById(config.sectionId);
    if (!section) {
      section = document.createElement("section");
      section.id = config.sectionId;
      section.className = "route-section";
      mainElement.appendChild(section);
    }
    appState.sections.set(routeName, section);
  });

  const menuItems = document.querySelectorAll(".aside .item:not(.logout)");
  menuItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();

      const index = parseInt(item.getAttribute("data-index"));

      let targetRoute = null;
      Object.entries(routes).forEach(([routeName, config]) => {
        if (config.index === index) {
          targetRoute = routeName;
        }
      });

      if (targetRoute) {
        navigateTo(targetRoute, appState);
      }
    });
  });

  navigateTo(initialRoute, appState);

  return appState;
}

export function navigateTo(routeName, appState) {
  const route = appState.routes[routeName];
  if (!route) {
    console.warn(`Route '${routeName}' not found`);
    return;
  }

  appState.sections.forEach((section) => {
    section.classList.remove("active");
  });

  const targetSection = appState.sections.get(routeName);
  if (targetSection) {
    targetSection.classList.add("active");
  }

  const menuItems = document.querySelectorAll(".aside .item:not(.logout)");
  menuItems.forEach((item) => {
    item.classList.remove("active");
  });

  const activeMenuItem = document.querySelector(
    `[data-index="${route.index}"]`
  );
  if (activeMenuItem) {
    activeMenuItem.classList.add("active");

    const menuIndicator = document.getElementById("menuIndicator");
    const menuContainer = document.querySelector(".aside .menu");
    if (menuIndicator && menuContainer) {
      positionIndicatorTo(activeMenuItem, menuIndicator, menuContainer);
    }
  }

  appState.currentRoute = routeName;

  CacheUtils.saveCurrentRoute(routeName);

  window.dispatchEvent(
    new CustomEvent("routeChanged", {
      detail: { route: routeName, config: route },
    })
  );
}

export function getCurrentRoute(appState) {
  return appState.currentRoute;
}

export function onRouteChange(callback) {
  window.addEventListener("routeChanged", (event) => {
    callback(event.detail);
  });
}

function positionIndicatorTo(element, indicator, container) {
  if (!indicator || !element || !container) return;

  const rect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  const top = rect.top - containerRect.top;
  const height = rect.height;

  indicator.style.top = `${top}px`;
  indicator.style.height = `${height}px`;
}

export function getSectionElement(routeName, appState) {
  return appState.sections.get(routeName) || null;
}
