"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AdminDashboard() {
  const router = useRouter()

  useEffect(() => {
    const user = localStorage.getItem("user")

    if (!user) {
      router.push("/login")
      return
    }

    const parsed = JSON.parse(user)

    if (parsed.role !== "SCHOOL_ADMIN") {
      router.push("/login")
    }
  }, [router])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">School Admin Dashboard</h1>
      <p className="mt-2 text-gray-600">
        Welcome to the school admin dashboard.
      </p>
    </div>
  )
}