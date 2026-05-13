import { authService } from "./auth.service.js";

export function requireAuth({ onGuest, onAuth }) {
  const user = authService.getUser();

  if (!user) {
    onGuest?.();
    return false;
  }

  onAuth?.(user);
  return true;
}