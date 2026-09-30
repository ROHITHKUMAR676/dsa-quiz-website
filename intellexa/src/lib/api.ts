const configuredApiUrl = import.meta.env.VITE_API_URL?.trim() || "http://localhost:4000";
const normalizedApiUrl = configuredApiUrl.replace(/\/+$/, "");
const API_BASE_URL = normalizedApiUrl.endsWith("/api")
  ? normalizedApiUrl
  : `${normalizedApiUrl}/api`;
const TOKEN_STORAGE_KEY = "intellexa:token";

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function getToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // ignore - worst case the session doesn't survive a reload
  }
}

export function resolveApiAsset(path: string | null | undefined) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path) || path.startsWith("data:")) return path;
  const normalizedPath = path.replace(/^\/+/, "").replace(/^api\//i, "");
  return `${API_BASE_URL}/${normalizedPath}`;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  rawBody?: BodyInit;
  contentType?: string;
}

/**
 * Every request against the Intellexa backend goes through here so the
 * JWT and the { error: { message, code } } shape (see backend
 * middleware/errorHandler.ts) are handled in exactly one place.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getToken();
  let response: Response;
  try {
    const normalizedPath = path.replace(/^\/+/, "");
    response = await fetch(`${API_BASE_URL}/${normalizedPath}`, {
      method: options.method ?? "GET",
      headers: {
        ...(options.rawBody ? { "Content-Type": options.contentType ?? "application/octet-stream" } : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options.rawBody ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined),
    });
  } catch {
    throw new ApiError(
      "Couldn't reach the server. Please check your connection and try again.",
      0,
      "NETWORK_ERROR"
    );
  }

  if (response.status === 204) return undefined as T;

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    // no body
  }

  if (!response.ok) {
    const message = response.status >= 500
      ? "The server is temporarily unavailable. Please try again later."
      : payload?.error?.message ?? "Something went wrong. Please try again.";
    const code = payload?.error?.code;
    throw new ApiError(message, response.status, code);
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string) => apiRequest<T>(path),
  post: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: "PATCH", body }),
  put: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: "PUT", body }),
  putRaw: <T>(path: string, body: BodyInit, contentType: string) => apiRequest<T>(path, { method: "PUT", rawBody: body, contentType }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: "DELETE" }),
};
