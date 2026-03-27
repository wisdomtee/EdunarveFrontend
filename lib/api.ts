export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export function getToken() {
  if (typeof window === "undefined") return ""
  return localStorage.getItem("token") || ""
}

export function getAuthHeaders() {
  const token = getToken()

  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    credentials: "include",
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  })

  const text = await response.text()

  let data: any = {}
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { message: text }
  }

  if (!response.ok) {
    throw new Error(data?.message || `Request failed: ${response.status}`)
  }

  return data
}