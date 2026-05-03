import { getSession } from "@/lib/auth/service";

/**
 * API Client Utility
 * Provides methods for making authenticated API requests with automatic Bearer token injection
 */

const API_BASE_URL = (process.env.NEXT_PUBLIC_AUTH_API_BASE_URL ?? "").replace(/\/$/, "");

function resolveUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  if (!API_BASE_URL) {
    return pathOrUrl;
  }

  const cleanPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${API_BASE_URL}${cleanPath}`;
}

async function getAuthHeaders(): Promise<Headers> {
  const headers = new Headers({ "Content-Type": "application/json" });

  try {
    const session = await getSession();
    if (session?.accessToken) {
      headers.set("Authorization", `Bearer ${session.accessToken}`);
    }
  } catch {
    // If we can't get the session, continue without auth
  }

  return headers;
}

export interface ApiRequestOptions extends Omit<RequestInit, "headers"> {
  headers?: Record<string, string>;
}

/**
 * Make an authenticated API request with automatic Bearer token injection
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const headers = await getAuthHeaders();

  // Merge custom headers with auth headers
  if (options.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      headers.set(key, value);
    });
  }

  const response = await fetch(resolveUrl(endpoint), {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      (errorData as any)?.message || `API request failed: ${response.statusText}`,
    );
  }

  return response.json() as Promise<T>;
}

/**
 * GET request
 */
export async function apiGet<T = any>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: "GET" });
}

/**
 * POST request
 */
export async function apiPost<T = any>(
  endpoint: string,
  data?: any,
): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PUT request
 */
export async function apiPut<T = any>(
  endpoint: string,
  data?: any,
): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: "PUT",
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PATCH request
 */
export async function apiPatch<T = any>(
  endpoint: string,
  data?: any,
): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: "PATCH",
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE request
 */
export async function apiDelete<T = any>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: "DELETE" });
}
