import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { auth, getCurrentUserToken } from "./firebase";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Helper function to get auth headers with the current user's ID token
async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  
  try {
    // Use the more robust getCurrentUserToken implementation
    // This includes retry logic and waiting for auth state
    const token = await getCurrentUserToken(true);
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      console.log("Successfully added auth token to request");
    } else {
      console.warn("No auth token available for request");
    }
  } catch (error) {
    console.error("Error getting auth token:", error);
  }
  
  return headers;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Get authentication headers
  const authHeaders = await getAuthHeaders();
  
  // Prepare headers
  const headers: Record<string, string> = {
    ...authHeaders,
  };
  
  // Add content-type for requests with body
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get authentication headers
    const authHeaders = await getAuthHeaders();
    
    const res = await fetch(queryKey[0] as string, {
      headers: authHeaders,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true, // Enable refetch on window focus
      staleTime: 30000, // 30 seconds - data becomes stale after this time
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
