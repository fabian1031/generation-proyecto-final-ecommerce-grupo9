import { userService } from "./users.services.js";

const STORAGE_KEY = "authUser";
const TOKEN_KEY = "authToken";

const AUTH_FIELD_STRIP = new Set([
  "token",
  "accessToken",
  "access_token",
  "jwt",
  "password",
  "type",
  "tokenType",
]);

function getClaimsFromToken(token) {
  try {
    const part = String(token).split(".")[1];
    if (!part) return null;
    return JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

/**
 * Mapeo directo del UsuarioResponseDTO del backend.
 * @param {Record<string, unknown>} source
 */
export function mapUsuarioResponseDTO(source) {
  if (!source || typeof source !== "object") return null;

  const user = buildNormalizedUser({
    id: source.id ?? null,
    nombre: source.nombre ?? "",
    apellido: source.apellido ?? "",
    email: source.email ?? "",
    telefono: source.telefono ?? source.celular ?? source.phone ?? "",
    tipoDocumento: source.tipoDocumento ?? "",
    numeroDocumento: source.numeroDocumento ?? "",
    rol: source.rol ?? source.role ?? "",
    activo: source.activo ?? source.isActive ?? true,
  });

  if (user.id == null && !user.nombre && !user.apellido && !user.email) {
    return null;
  }

  return user;
}

function isUserLike(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return (
    value.email != null ||
    value.correo != null ||
    value.nombre != null ||
    value.apellido != null ||
    value.id != null
  );
}

function pickUserCandidate(raw) {
  if (!raw || typeof raw !== "object") return null;

  const nestedKeys = ["usuario", "user", "data", "payload", "profile", "usuarioResponse"];
  for (const key of nestedKeys) {
    if (isUserLike(raw[key])) return raw[key];
  }

  return isUserLike(raw) ? raw : null;
}

function buildProfile(source) {
  const profile = {};

  Object.entries(source).forEach(([key, value]) => {
    if (AUTH_FIELD_STRIP.has(key)) return;
    if (value != null && typeof value === "object") return;
    profile[key] = value;
  });

  return profile;
}

function buildNormalizedUser(profile) {
  return {
    id: profile.id ?? null,
    nombre: String(profile.nombre || profile.nombres || profile.username || profile.name || "").trim(),
    apellido: String(profile.apellido || profile.apellidos || profile.lastname || "").trim(),
    email: String(profile.email || profile.correo || "").trim(),
    telefono: String(profile.telefono || profile.celular || profile.phone || "").trim(),
    tipoDocumento: String(profile.tipoDocumento || "").trim(),
    numeroDocumento: String(profile.numeroDocumento || "").trim(),
    rol: String(profile.rol || profile.role || "").trim(),
    activo: profile.activo ?? profile.isActive ?? true,
  };
}

/**
 * Normaliza el objeto usuario al esquema del backend Coroto.
 * @param {unknown} raw
 */
export function normalizeUser(raw) {
  const direct = mapUsuarioResponseDTO(raw?.usuario || raw?.user || raw);
  if (direct?.nombre || direct?.apellido || direct?.email) return direct;

  const candidate = pickUserCandidate(raw);
  if (!candidate) return null;
  return buildNormalizedUser(buildProfile(candidate));
}

export function normalizeUserFromJwt(token) {
  const claims = getClaimsFromToken(token);
  if (!claims) return null;

  const sub = claims.sub != null ? String(claims.sub) : "";
  const subIsEmail = sub.includes("@");

  return mapUsuarioResponseDTO({
    id:
      claims.id ??
      claims.userId ??
      claims.user_id ??
      claims.usuarioId ??
      (/^\d+$/.test(sub) ? Number(sub) : null),
    nombre: claims.nombre ?? claims.given_name ?? claims.firstName ?? "",
    apellido: claims.apellido ?? claims.family_name ?? claims.lastName ?? "",
    email: claims.email ?? (subIsEmail ? sub : ""),
    rol:
      claims.rol ??
      claims.role ??
      (Array.isArray(claims.roles) ? claims.roles[0] : ""),
    activo: claims.activo ?? true,
  });
}

function mergeUsers(base, extra) {
  if (!base && !extra) return null;

  return buildNormalizedUser({
    id: base?.id ?? extra?.id ?? null,
    nombre: base?.nombre || extra?.nombre || "",
    apellido: base?.apellido || extra?.apellido || "",
    email: base?.email || extra?.email || "",
    telefono: base?.telefono || extra?.telefono || "",
    tipoDocumento: base?.tipoDocumento || extra?.tipoDocumento || "",
    numeroDocumento: base?.numeroDocumento || extra?.numeroDocumento || "",
    rol: base?.rol || extra?.rol || "",
    activo: base?.activo ?? extra?.activo ?? true,
  });
}

function extractUserFromLoginBody(response) {
  if (!response || typeof response !== "object") return null;

  const root =
    response.data && typeof response.data === "object" && !response.token
      ? response.data
      : response;

  return (
    mapUsuarioResponseDTO(root.usuario) ||
    mapUsuarioResponseDTO(root.user) ||
    mapUsuarioResponseDTO(root)
  );
}

/**
 * @param {Record<string, unknown>} response
 */
export function parseLoginResponse(response) {
  if (!response || typeof response !== "object") return null;

  const root =
    response.data && typeof response.data === "object" && !response.token
      ? response.data
      : response;

  const token =
    root.token ||
    root.accessToken ||
    root.access_token ||
    root.jwt ||
    response.token ||
    response.accessToken ||
    null;

  if (!token) return null;

  let user = extractUserFromLoginBody(response);

  if (!hasFullProfile(user)) {
    user = mergeUsers(user, normalizeUserFromJwt(token));
  }

  return {
    token: String(token),
    user,
  };
}

function getUserIdFromToken(token) {
  const claims = getClaimsFromToken(token);
  if (!claims) return null;

  const sub = claims.sub != null ? String(claims.sub) : "";
  if (/^\d+$/.test(sub)) return Number(sub);

  return claims.id ?? claims.userId ?? claims.user_id ?? claims.usuarioId ?? null;
}

/** Perfil completo para autocompletar checkout (nombre + apellido + email). */
function hasFullProfile(user) {
  return !!(
    user?.nombre?.trim() &&
    user?.apellido?.trim() &&
    user?.email?.trim()
  );
}

async function fetchRemoteUserProfile({ id, loginEmail }) {
  if (id != null && id !== "") {
    try {
      const fresh = await userService.getById(id);
      const mapped = mapUsuarioResponseDTO(fresh);
      if (hasFullProfile(mapped)) return mapped;
    } catch {
      /* puede fallar si el rol no tiene permiso */
    }
  }

  if (!loginEmail) return null;

  try {
    const all = await userService.getAll();
    if (!Array.isArray(all)) return null;

    const emailNorm = loginEmail.trim().toLowerCase();
    const match = all.find((u) => String(u?.email || "").trim().toLowerCase() === emailNorm);
    return mapUsuarioResponseDTO(match);
  } catch {
    return null;
  }
}

/**
 * Campos del formulario checkout ← usuario backend.
 * @param {unknown} raw
 */
export function mapUserToCheckoutFields(raw) {
  const user = normalizeUser(raw) || raw;
  if (!user || typeof user !== "object") return {};

  return {
    nombre: user.nombre || "",
    apellidos: user.apellido || "",
    correo: user.email || "",
    celular: user.telefono || "",
  };
}

export const authService = {
  getUser() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return normalizeUser(JSON.parse(raw)) || JSON.parse(raw);
    } catch {
      return null;
    }
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
    const normalized = normalizeUser(user) || mapUsuarioResponseDTO(user) || user;
    if (normalized && typeof normalized === "object") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    }
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
  },

  /**
   * Completa el perfil tras login o al abrir checkout.
   * @param {{ loginEmail?: string, loginResponse?: Record<string, unknown> }} [options]
   */
  async ensureUserProfile(options = {}) {
    const { loginEmail = "", loginResponse = null } = options;
    const token = this.getToken();
    if (!token) return null;

    let user =
      extractUserFromLoginBody(loginResponse) ||
      mergeUsers(this.getUser(), normalizeUserFromJwt(token));

    if (hasFullProfile(user)) {
      this.setUser(user, token);
      return user;
    }

    const remote = await fetchRemoteUserProfile({
      id: user?.id ?? getUserIdFromToken(token),
      loginEmail: loginEmail || user?.email || "",
    });

    user = mergeUsers(user, remote);

    if (loginEmail && !user?.email) {
      user = mergeUsers(user, { email: loginEmail });
    }

    if (user) {
      this.setUser(user, token);
    }

    return user;
  },

  logout() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
  },
};
