const STORAGE_KEY = "authUser";
const TOKEN_KEY = "authToken";

export const authService = {
  getUser() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  isAdmin() {
    const user = this.getUser();
    return user?.rol === "ADMIN";
  },

  setUser(user, token) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem(TOKEN_KEY, token);
  },

  logout() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }
};