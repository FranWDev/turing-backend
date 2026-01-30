export const CacheUtils = {
  CACHE_KEY: "spa_current_route",

  saveCurrentRoute(routeName) {
    try {
      localStorage.setItem(this.CACHE_KEY, routeName);
    } catch (error) {
      console.warn("Error saving route to cache:", error);
    }
  },

  getLastRoute() {
    try {
      const cachedRoute = localStorage.getItem(this.CACHE_KEY);
      return cachedRoute;
    } catch (error) {
      console.warn("Error retrieving route from cache:", error);
      return null;
    }
  },

  clearCache() {
    try {
      localStorage.removeItem(this.CACHE_KEY);
    } catch (error) {
      console.warn("Error clearing route cache:", error);
    }
  },

  isValidRoute(routeName, routes) {
    return routeName && routes.hasOwnProperty(routeName);
  },
};
