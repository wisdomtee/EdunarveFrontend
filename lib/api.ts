export const API_BASE_URL = "http://localhost:5000"

export function getAuthHeaders(withJson = false) {
  const token = localStorage.getItem("token")

  return {
    ...(withJson ? { "Content-Type": "application/json" } : {}),
    Authorization: `Bearer ${token}`,
  }
}