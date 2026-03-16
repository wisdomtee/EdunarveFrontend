"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const API_BASE_URL = "http://localhost:5000"

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      alert("Please fill in all fields")
      return
    }

    try {
      setLoading(true)

      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Login failed")
      }

      localStorage.setItem("token", data.token)
      localStorage.setItem("admin", JSON.stringify(data.admin))

      router.push("/dashboard")
    } catch (error: any) {
      alert(error.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-8 border">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold">
            E
          </div>
          <h1 className="text-2xl font-bold mt-3 text-gray-800">EduCore</h1>
          <p className="text-gray-500 text-sm">Admin Login</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Email</label>
            <input
              type="email"
              placeholder="admin@educore.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Password</label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  )
}