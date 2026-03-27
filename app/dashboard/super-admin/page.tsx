"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SuperAdminDashboard() {
  const router = useRouter()

  useEffect(() => {
    const user = localStorage.getItem("user")

    if (!user) {
      router.push("/login")
      return
    }

    const parsed = JSON.parse(user)

    if (parsed.role !== "SUPER_ADMIN") {
      router.push("/login")
    }
  }, [router])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
      <p className="mt-2 text-gray-600">
        Welcome to the super admin dashboard.
      </p>
    </div>
  )
}