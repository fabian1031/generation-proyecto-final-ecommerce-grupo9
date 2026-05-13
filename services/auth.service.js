const STORAGE_KEY = "authUser";

export const authService = {
  getUser() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  },

  isAuthenticated() {
    return !!this.getUser();
  },

  isAdmin() {
    const user = this.getUser();
    return user?.role === "admin";
  },

  login(user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  },

  logout() {
    localStorage.removeItem(STORAGE_KEY);
  }
};