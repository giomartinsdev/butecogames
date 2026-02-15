const API_URL = import.meta.env.VITE_API_URL || "";

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// Simple apiClient wrapper for fetch-like API
export const apiClient = {
  get: (path: string) => fetch(`${API_URL}${path}`, { credentials: "include" }),
  post: (path: string, options?: { body: string }) =>
    fetch(`${API_URL}${path}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: options?.body,
    }),
  put: (path: string, options?: { body: string }) =>
    fetch(`${API_URL}${path}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: options?.body,
    }),
};
