const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

export function getUser() {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

export function logout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
  window.location.href = "/login";
}

type FetchOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: any;
  auth?: boolean;
  silent?: boolean;
};

export async function api<T = any>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  // ✅ Destructure options with defaults
  const { method = "GET", body, auth = false, silent = false } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ message: "Request failed" }));

    if (!silent) {
      console.error("API ERROR:", {
        endpoint,
        method,
        status: res.status,
        statusText: res.statusText,
        response: error,
        requestBody: body,
      });
    }

    throw new Error(error.message || `HTTP ${res.status}`);
  }

  if (res.status === 204) {
    return null as T;
  }

  return res.json();
}