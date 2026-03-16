"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { getToken, logout } from "@/lib/auth"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  useEffect(() => {
    const token = getToken()

    if (!token) {
      router.push("/login")
    }
  }, [router])

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <div className="min-h-screen flex bg-gray-100">

      {/* Sidebar */}

      <aside className="w-64 bg-blue-700 text-white flex flex-col">

        <div className="p-6 border-b border-blue-600">
          <h1 className="text-xl font-bold">EduCore</h1>
          <p className="text-sm text-blue-200">
            School Management
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-3">

          <Link
            href="/dashboard"
            className="block px-4 py-2 rounded hover:bg-blue-600"
          >
            Dashboard
          </Link>

          <Link
            href="/dashboard/students"
            className="block px-4 py-2 rounded hover:bg-blue-600"
          >
            Students
          </Link>

          <Link
            href="/dashboard/teachers"
            className="block px-4 py-2 rounded hover:bg-blue-600"
          >
            Teachers
          </Link>

          <Link
            href="/dashboard/classes"
            className="block px-4 py-2 rounded hover:bg-blue-600"
          >
            Classes
          </Link>

          <Link
            href="/dashboard/schools"
            className="block px-4 py-2 rounded hover:bg-blue-600"
          >
            Schools
          </Link>

          <Link
            href="/dashboard/attendance"
            className="block px-4 py-2 rounded hover:bg-blue-600"
>
            Attendance
          </Link>

        </nav>

        <button
          onClick={handleLogout}
          className="m-4 bg-red-600 hover:bg-red-700 py-2 rounded"
        >
          Logout
        </button>

      </aside>

      {/* Main content */}

      <main className="flex-1 p-6">
        {children}
      </main>

    </div>
  )
}