"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"
import { API_BASE_URL, getAuthHeaders } from "@/lib/api"

type Student = {
  id: number
  name: string
  studentId: string
  gender?: string | null
  school?: {
    id: number
    name: string
  }
  class?: {
    id: number
    name: string
  }
}

async function parseResponse(response: Response) {
  const text = await response.text()

  try {
    return text ? JSON.parse(text) : {}
  } catch {
    return { message: text }
  }
}

export default function StudentsPage() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true)
        setError("")

        const response = await fetch(`${API_BASE_URL}/students`, {
          method: "GET",
          headers: getAuthHeaders(),
          credentials: "include",
          cache: "no-store",
        })

        const data = await parseResponse(response)

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error("Your session has expired. Please log in again.")
          }

          throw new Error(data?.message || "Failed to fetch students")
        }

        const studentsList = Array.isArray(data) ? data : data.students || []
        setStudents(studentsList)
      } catch (err: any) {
        setError(err.message || "Something went wrong")
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-lg text-gray-600">Loading students...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-red-700">Unable to load students</h2>
          <p className="mt-2 text-red-600">{error}</p>

          <div className="mt-4 flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Retry
            </button>

            <button
              onClick={() => router.push("/login")}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Students</h1>
        <p className="mt-1 text-gray-600">Manage all students in your school</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Student ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Gender</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Class</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">School</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Action</th>
            </tr>
          </thead>

          <tbody>
            {students.length > 0 ? (
              students.map((student) => (
                <tr
                  key={student.id}
                  className="cursor-pointer border-b hover:bg-gray-50"
                  onClick={() => router.push(`/dashboard/students/${student.id}`)}
                >
                  <td className="px-4 py-3 text-sm text-gray-800">{student.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{student.studentId}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{student.gender || "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{student.class?.name || "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{student.school?.name || "—"}</td>
                  <td className="px-4 py-3 text-sm">
                    <Link
                      href={`/dashboard/students/${student.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-block rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}