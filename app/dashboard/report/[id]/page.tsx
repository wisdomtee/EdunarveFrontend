"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { API_BASE_URL, getAuthHeaders } from "@/lib/api"

type Student = {
  id: number
  name: string
  studentId?: string
  gender?: string
  photo?: string | null
  class?: {
    id: number
    name: string
  }
  school?: {
    id: number
    name: string
  }
  attendance?: {
    id: number
    date: string
    status: string
  }[]
  results?: {
    id: number
    score: number
    term?: string
    session?: string
    subject?: {
      id: number
      name: string
    }
    teacher?: {
      id: number
      name: string
    }
  }[]
}

export default function StudentDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoading(true)
        setError("")

        const res = await fetch(`${API_BASE_URL}/students/${id}`, {
          headers: getAuthHeaders(),
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => null)
          throw new Error(errData?.message || "Failed to load student")
        }

        const data = await res.json()
        setStudent(data)
      } catch (err: any) {
        setError(err.message || "Something went wrong")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchStudent()
    }
  }, [id])

  const averageScore = useMemo(() => {
    if (!student?.results?.length) return 0
    const total = student.results.reduce(
      (sum, item) => sum + Number(item.score || 0),
      0
    )
    return total / student.results.length
  }, [student])

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-gray-600">Loading student details...</div>
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

  if (!student) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-yellow-700">
          Student not found
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Details</h1>
          <p className="text-sm text-gray-600">
            View full student profile, results and attendance
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
          >
            Back
          </button>

          <Link
            href={`/dashboard/report/${student.id}`}
            className="rounded-lg bg-purple-600 px-4 py-2 font-medium text-white hover:bg-purple-700"
          >
            Open Report
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              {student.photo ? (
                <img
                  src={student.photo}
                  alt={student.name}
                  className="mb-4 h-28 w-28 rounded-full object-cover border"
                />
              ) : (
                <div className="mb-4 flex h-28 w-28 items-center justify-center rounded-full bg-blue-100 text-3xl font-bold text-blue-700">
                  {student.name?.charAt(0).toUpperCase()}
                </div>
              )}

              <h2 className="text-xl font-bold text-gray-900">{student.name}</h2>
              <p className="text-sm text-gray-500">{student.studentId || "No Student ID"}</p>
            </div>

            <div className="mt-6 space-y-3 text-sm text-gray-700">
              <div className="flex justify-between gap-4 border-b pb-2">
                <span className="font-medium">Gender</span>
                <span>{student.gender || "-"}</span>
              </div>

              <div className="flex justify-between gap-4 border-b pb-2">
                <span className="font-medium">Class</span>
                <span>{student.class?.name || "-"}</span>
              </div>

              <div className="flex justify-between gap-4 border-b pb-2">
                <span className="font-medium">School</span>
                <span>{student.school?.name || "-"}</span>
              </div>

              <div className="flex justify-between gap-4 border-b pb-2">
                <span className="font-medium">Results Count</span>
                <span>{student.results?.length || 0}</span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="font-medium">Average Score</span>
                <span>{averageScore.toFixed(2)}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Results</h3>

            {!student.results || student.results.length === 0 ? (
              <p className="text-sm text-gray-600">No results available.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-gray-700">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Subject</th>
                      <th className="px-4 py-3 font-semibold">Score</th>
                      <th className="px-4 py-3 font-semibold">Teacher</th>
                      <th className="px-4 py-3 font-semibold">Term</th>
                      <th className="px-4 py-3 font-semibold">Session</th>
                    </tr>
                  </thead>
                  <tbody>
                    {student.results.map((result) => (
                      <tr key={result.id} className="border-t border-gray-100">
                        <td className="px-4 py-3">{result.subject?.name || "-"}</td>
                        <td className="px-4 py-3">{result.score}%</td>
                        <td className="px-4 py-3">{result.teacher?.name || "-"}</td>
                        <td className="px-4 py-3">{result.term || "-"}</td>
                        <td className="px-4 py-3">{result.session || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Attendance</h3>

            {!student.attendance || student.attendance.length === 0 ? (
              <p className="text-sm text-gray-600">No attendance record available.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-gray-700">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {student.attendance.map((item) => (
                      <tr key={item.id} className="border-t border-gray-100">
                        <td className="px-4 py-3">
                          {new Date(item.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">{item.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}