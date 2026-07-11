const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.text().catch(() => "Unknown error");
    throw new ApiError(response.status, body);
  }
  return response.json() as Promise<T>;
}

function buildUrl(path: string, params?: Record<string, string>) {
  const url = new URL(`${API_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return url.toString();
}

export const api = {
  get: <T>(path: string, params?: Record<string, string>) =>
    fetch(buildUrl(path, params)).then((r) => handleResponse<T>(r)),

  post: <T>(path: string, body?: unknown) =>
    fetch(buildUrl(path), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    }).then((r) => handleResponse<T>(r)),

  patch: <T>(path: string, body?: unknown) =>
    fetch(buildUrl(path), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    }).then((r) => handleResponse<T>(r)),

  delete: <T>(path: string) =>
    fetch(buildUrl(path), { method: "DELETE" }).then((r) => handleResponse<T>(r)),
};
