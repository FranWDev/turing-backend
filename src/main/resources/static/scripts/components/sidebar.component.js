export function initSidebar() {
  const menuToggle = document.getElementById("menuToggle");
  const asideMenu = document.getElementById("asideMenu");
  const menuItems = document.querySelectorAll(".aside .item");
  const menuIndicator = document.getElementById("menuIndicator");
  const menuContainer = document.querySelector(".aside .menu");

  if (!menuToggle || !asideMenu) {
    console.warn("Sidebar elements not found");
    return;
  }

  const activeInitial = document.querySelector(".aside .item.active");
  if (activeInitial) {
    positionIndicatorTo(activeInitial, menuIndicator, menuContainer);
  }

  menuItems.forEach((item) => {
    item.addEventListener("mouseenter", () => {
      positionIndicatorTo(item, menuIndicator, menuContainer);
    });

    item.addEventListener("click", () => {
      const oldActive = document.querySelector(".aside .item.active");
      if (oldActive) {
        oldActive.classList.remove("active");
      }

      item.classList.add("active");
      positionIndicatorTo(item, menuIndicator, menuContainer);
    });
  });

  if (menuContainer) {
    menuContainer.addEventListener("mouseleave", () => {
      const active = document.querySelector(".aside .item.active");
      if (active) {
        positionIndicatorTo(active, menuIndicator, menuContainer);
      }
    });
  }

  window.addEventListener("routeChanged", () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const active = document.querySelector(".aside .item.active");
        if (active) {
          positionIndicatorTo(active, menuIndicator, menuContainer);
        }
      });
    });
  });

  window.addEventListener("resize", () => {
    const active = document.querySelector(".aside .item.active");
    if (active) {
      positionIndicatorTo(active, menuIndicator, menuContainer);
    }
  });

  const logoutItem = document.querySelector(".aside .item.logout");
  if (logoutItem) {
    logoutItem.addEventListener("click", (e) => {
      e.preventDefault();
      if (typeof UsersAPI !== "undefined") {
        UsersAPI.logout();
      }
      window.location.href = "/login";
    });
  }

  menuToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    asideMenu.classList.toggle("active");
  });

  document.addEventListener("click", (e) => {
    if (
      asideMenu.classList.contains("active") &&
      !asideMenu.contains(e.target) &&
      e.target !== menuToggle
    ) {
      asideMenu.classList.remove("active");
    }
  });
}

function positionIndicatorTo(element, indicator, container) {
  if (!indicator || !element || !container) return;

  const offset = element.offsetTop;
  const height = element.offsetHeight;

  indicator.style.height = `${height - height}px`;
  indicator.style.transform = `translateY(${offset}px)`;
}
