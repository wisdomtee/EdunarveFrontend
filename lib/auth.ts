export function getToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

export function logout() {
  if (typeof window === "undefined") return
  localStorage.removeItem("token")
  localStorage.removeItem("admin")
}