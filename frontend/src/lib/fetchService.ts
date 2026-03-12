const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface FetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  skipAuth?: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

async function fetchService<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const { body, skipAuth = false, ...requestOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (requestOptions.headers) {
    if (requestOptions.headers instanceof Headers) {
      requestOptions.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(requestOptions.headers)) {
      requestOptions.headers.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, requestOptions.headers);
    }
  }

  // Add auth token if available and not skipped
  if (!skipAuth) {
    const token = getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...requestOptions,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }

    const errorMessage = errorData?.message || `HTTP Error: ${response.status}`;
    throw new ApiError(response.status, errorMessage, errorData);
  }

  try {
    const responseData = await response.json();
    return responseData;
  } catch {
    throw new ApiError(response.status, "Failed to parse response JSON", null);
  }
}

export function apiGet<T>(
  endpoint: string,
  options?: FetchOptions,
): Promise<T> {
  return fetchService<T>(endpoint, {
    ...options,
    method: "GET",
  });
}

export function apiPost<T>(
  endpoint: string,
  body?: unknown,
  options?: FetchOptions,
): Promise<T> {
  return fetchService<T>(endpoint, {
    ...options,
    method: "POST",
    body,
  });
}

export function apiPut<T>(
  endpoint: string,
  body?: unknown,
  options?: FetchOptions,
): Promise<T> {
  return fetchService<T>(endpoint, {
    ...options,
    method: "PUT",
    body,
  });
}

export function apiPatch<T>(
  endpoint: string,
  body?: unknown,
  options?: FetchOptions,
): Promise<T> {
  return fetchService<T>(endpoint, {
    ...options,
    method: "PATCH",
    body,
  });
}

export function apiDelete<T>(
  endpoint: string,
  options?: FetchOptions,
): Promise<T> {
  return fetchService<T>(endpoint, {
    ...options,
    method: "DELETE",
  });
}

/**
 * Helper function to get auth token
 * Adjust based on your auth storage implementation
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  const session = document.cookie
    .split("; ")
    .find((row) => row.startsWith("triage_session="))
    ?.split("=")[1];

  return session || null;
}

/**
 * Helper function to set auth token
 */
export function setAuthToken(token: string): void {
  if (typeof window !== "undefined") {
    document.cookie = `triage_session=${token}; path=/; max-age=86400`;
  }
}

/**
 * Helper function to clear auth token
 */
export function clearAuthToken(): void {
  if (typeof window !== "undefined") {
    document.cookie = "triage_session=; path=/; max-age=0";
  }
}
