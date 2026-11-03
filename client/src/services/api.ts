export class ApiError extends Error {
  constructor(public status: number, message: string, public fields: Record<string, string> = {}) { super(message); }
}
let csrf = "";
export const setCsrf = (t: string) => { csrf = t; };

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  let payload: BodyInit | undefined;
  if (body instanceof FormData) payload = body;
  else if (body !== undefined) { headers["Content-Type"] = "application/json"; payload = JSON.stringify(body); }
  if (method !== "GET") headers["X-CSRF-Token"] = csrf;
  let res: Response;
  try { res = await fetch(url, { method, headers, body: payload, credentials: "same-origin" }); }
  catch { throw new ApiError(0, "Cannot reach the server. Check your connection and try again."); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && url.startsWith("/api/admin") && !url.includes("/auth/")) window.dispatchEvent(new Event("admin-unauthorized"));
    const fallback: Record<number, string> = {
      401: "Your session has expired. Please sign in again.", 403: "That action was not allowed. Refresh the page and try again.",
      413: "The file is too large for the server.", 429: "Too many requests. Please wait a moment.", 502: "The server could not reach a required service.", 504: "The server took too long to respond."
    };
    throw new ApiError(res.status, data.error ?? fallback[res.status] ?? `Request failed (${res.status}).`, data.fields ?? {});
  }
  return data as T;
}
export const api = {
  get: <T,>(u: string) => request<T>("GET", u),
  post: <T,>(u: string, b?: unknown) => request<T>("POST", u, b),
  put: <T,>(u: string, b?: unknown) => request<T>("PUT", u, b),
  patch: <T,>(u: string, b?: unknown) => request<T>("PATCH", u, b),
  del: <T,>(u: string) => request<T>("DELETE", u)
};
export const uploadImage = (file: File) => {
  const fd = new FormData();
  fd.append("file", file);
  return api.post<{ id: string; url: string; filename: string }>("/api/admin/media", fd);
};
