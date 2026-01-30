import { initSidebar } from "./components/sidebar.component.js";

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSidebar);
} else {
  initSidebar();
}
