/// <reference types="vite/client" />

import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { isTokenExpired } from "./tokenRefresh";
import { v4 as uuidv4 } from "uuid";


const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";


async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Handle 401 Unauthorized errors (token expired)
    if (res.status === 401) {
      const token = localStorage.getItem("token");
      console.warn("Received 401 Unauthorized response");
      console.log("Current token exists:", !!token);

      if (token) {
        console.log("Token expired:", isTokenExpired(token));
      }

      // Clear invalid token and redirect to login
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("modules");

      // Show user-friendly message
      console.warn("Session expired. Redirecting to login...");

      // Redirect to login page after a short delay
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
      return;
    }

    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const data = await res.clone().json().catch(() => null);
      const message =
        (typeof data?.message === "string" && data.message) ||
        (Array.isArray(data?.message) ? data.message.join(", ") : "") ||
        (typeof data?.error === "string" && data.error) ||
        (typeof data?.error?.message === "string" && data.error.message) ||
        res.statusText ||
        "Request failed";
      const err: any = new Error(message);
      err.status = res.status;
      throw err;
    }

    const text = (await res.text()).trim();
    const err: any = new Error(text || res.statusText || "Request failed");
    err.status = res.status;
    throw err;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const token = localStorage.getItem("token");

  const headers: Record<string, string> = {};

  if (data) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // if (token) {
  headers["transaction-id"] = uuidv4();
  // }

  const res = await fetch(`${API_BASE_URL}${url}`, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });
  console.log('API_BASE_URL : ', API_BASE_URL, ' url : ', url, 'res : ', res)
  await throwIfResNotOk(res);
  return res;
}

/**
 * API request function for FormData uploads (file uploads)
 * Note: Does NOT set Content-Type header - browser must set it automatically
 * with the multipart/form-data boundary for file uploads to work correctly
 */
export async function apiRequestFormData(
  method: string,
  url: string,
  formData: FormData,
): Promise<Response> {
  const token = localStorage.getItem("token");

  const headers: Record<string, string> = {};

  // Do NOT set Content-Type for FormData - browser sets it with boundary automatically
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  headers["transaction-id"] = uuidv4();

  const res = await fetch(`${API_BASE_URL}${url}`, {
    method,
    headers,
    body: formData,
    credentials: "include",
  });

  console.log('API_BASE_URL : ', API_BASE_URL, ' url : ', url, 'res : ', res);
  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
    async ({ queryKey }) => {
      // Use the main apiRequest function which handles token refresh
      try {
        const res = await apiRequest("GET", `/${queryKey.join("/")}`);
        return await res.json();
      } catch (error) {
        if (unauthorizedBehavior === "returnNull" && error instanceof Error && error.message.includes("401")) {
          return null;
        }
        throw error;
      }
    };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
