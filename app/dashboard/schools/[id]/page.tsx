"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { API_BASE_URL, getAuthHeaders } from "@/lib/api"

type Student = {
  id: number
  name: string
  studentId?: string
  gender?: string
  class?: {
    id: number
    name: string
  }
}

type School = {
  id: number
  name: string
  address?: string
  phone?: string
  email?: string
  students?: Student[]
  classes?: {
    id: number
    name: string
  }[]
}

export default function SchoolDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [school, setSchool] = useState<School | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchSchool = async () => {
      try {
        setLoading(true)
        setError("")

        const res = await fetch(`${API_BASE_URL}/schools/${id}`, {
          headers: getAuthHeaders(),
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => null)
          throw new Error(errData?.message || "Failed to load school")
        }

        const data = await res.json()
        setSchool(data)
      } catch (err: any) {
        setError(err.message || "Something went wrong")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchSchool()
    }
  }, [id])

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-gray-600">Loading school details...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      </div>
    )
  }

  if (!school) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-yellow-700">
          School not found
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">School Details</h1>
          <p className="text-sm text-gray-600">
            View school information and students
          </p>
        </div>

        <button
          onClick={() => router.back()}
          className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">{school.name}</h2>

        <div className="grid grid-cols-1 gap-4 text-sm text-gray-700 md:grid-cols-2">
          <div>
            <span className="font-medium">Address:</span> {school.address || "-"}
          </div>
          <div>
            <span className="font-medium">Phone:</span> {school.phone || "-"}
          </div>
          <div>
            <span className="font-medium">Email:</span> {school.email || "-"}
          </div>
          <div>
            <span className="font-medium">Students:</span> {school.students?.length || 0}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Students</h3>

        {!school.students || school.students.length === 0 ? (
          <p className="text-sm text-gray-600">No students found for this school.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Student ID</th>
                  <th className="px-4 py-3 font-semibold">Gender</th>
                  <th className="px-4 py-3 font-semibold">Class</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {school.students.map((student) => (
                  <tr key={student.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">{student.name}</td>
                    <td className="px-4 py-3">{student.studentId || "-"}</td>
                    <td className="px-4 py-3">{student.gender || "-"}</td>
                    <td className="px-4 py-3">{student.class?.name || "-"}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/students/${student.id}`}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
                      >
                        View Student
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}