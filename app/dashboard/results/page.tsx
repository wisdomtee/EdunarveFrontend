"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { API_BASE_URL, getAuthHeaders } from "@/lib/api"

type Student = {
  id: number
  name: string
  studentId?: string
  class?: {
    id: number
    name: string
  }
}

type Subject = {
  id: number
  name: string
}

type Teacher = {
  id: number
  name: string
}

type School = {
  id: number
  name: string
}

type ResultItem = {
  id: number
  score: number
  term?: string
  session?: string
  student?: {
    id: number
    name: string
    studentId?: string
  }
  subject?: {
    id: number
    name: string
  }
  teacher?: {
    id: number
    name: string
  } | null
  school?: {
    id: number
    name: string
  } | null
  createdAt?: string
}

function extractArray<T>(data: any, possibleKeys: string[] = []): T[] {
  if (Array.isArray(data)) return data
  for (const key of possibleKeys) {
    if (Array.isArray(data?.[key])) return data[key]
  }
  return []
}

async function parseResponse(response: Response) {
  const text = await response.text()

  try {
    return text ? JSON.parse(text) : {}
  } catch {
    return { message: text }
  }
}

export default function ResultsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [results, setResults] = useState<ResultItem[]>([])

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [formData, setFormData] = useState({
    studentId: "",
    subjectId: "",
    teacherId: "",
    schoolId: "",
    score: "",
    term: "",
    session: "",
  })

  const headers = getAuthHeaders()

  const fetchStudents = async () => {
    const res = await fetch(`${API_BASE_URL}/students`, {
      headers,
      credentials: "include",
      cache: "no-store",
    })

    const data = await parseResponse(res)

    if (!res.ok) {
      throw new Error(data?.message || "Failed to fetch students")
    }

    setStudents(extractArray<Student>(data, ["students"]))
  }

  const fetchSubjects = async () => {
    const res = await fetch(`${API_BASE_URL}/subjects`, {
      headers,
      credentials: "include",
      cache: "no-store",
    })

    const data = await parseResponse(res)

    if (!res.ok) {
      throw new Error(data?.message || "Failed to fetch subjects")
    }

    setSubjects(extractArray<Subject>(data, ["subjects"]))
  }

  const fetchTeachers = async () => {
    const res = await fetch(`${API_BASE_URL}/teachers`, {
      headers,
      credentials: "include",
      cache: "no-store",
    })

    const data = await parseResponse(res)

    if (!res.ok) {
      throw new Error(data?.message || "Failed to fetch teachers")
    }

    setTeachers(extractArray<Teacher>(data, ["teachers"]))
  }

  const fetchSchools = async () => {
    const res = await fetch(`${API_BASE_URL}/schools`, {
      headers,
      credentials: "include",
      cache: "no-store",
    })

    const data = await parseResponse(res)

    if (!res.ok) {
      throw new Error(data?.message || "Failed to fetch schools")
    }

    setSchools(extractArray<School>(data, ["schools"]))
  }

  const fetchResults = async () => {
    const res = await fetch(`${API_BASE_URL}/results`, {
      headers,
      credentials: "include",
      cache: "no-store",
    })

    const data = await parseResponse(res)

    if (!res.ok) {
      throw new Error(data?.message || "Failed to fetch results")
    }

    setResults(extractArray<ResultItem>(data, ["results"]))
  }

  const fetchAll = async () => {
    try {
      setLoading(true)
      setError("")

      await Promise.all([
        fetchStudents(),
        fetchSubjects(),
        fetchTeachers(),
        fetchSchools(),
        fetchResults(),
      ])
    } catch (err: any) {
      setError(err.message || "Failed to load page data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleCreateResult = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSubmitting(true)
      setError("")
      setSuccess("")

      const payload = {
        studentId: Number(formData.studentId),
        subjectId: Number(formData.subjectId),
        teacherId: formData.teacherId ? Number(formData.teacherId) : undefined,
        schoolId: formData.schoolId ? Number(formData.schoolId) : undefined,
        score: Number(formData.score),
        term: formData.term || undefined,
        session: formData.session || undefined,
      }

      const res = await fetch(`${API_BASE_URL}/results`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      const data = await parseResponse(res)

      if (!res.ok) {
        throw new Error(data?.message || "Failed to create result")
      }

      setSuccess(data?.message || "Result added successfully")
      setFormData({
        studentId: "",
        subjectId: "",
        teacherId: "",
        schoolId: "",
        score: "",
        term: "",
        session: "",
      })

      await fetchResults()
    } catch (err: any) {
      setError(err.message || "Failed to create result")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteResult = async (id: number) => {
    const confirmed = window.confirm("Are you sure you want to delete this result?")
    if (!confirmed) return

    try {
      setDeletingId(id)
      setError("")
      setSuccess("")

      const res = await fetch(`${API_BASE_URL}/results/${id}`, {
        method: "DELETE",
        headers,
        credentials: "include",
      })

      const data = await parseResponse(res)

      if (!res.ok) {
        throw new Error(data?.message || "Failed to delete result")
      }

      setResults((prev) => prev.filter((item) => item.id !== id))
      setSuccess(data?.message || "Result deleted successfully")
    } catch (err: any) {
      setError(err.message || "Failed to delete result")
    } finally {
      setDeletingId(null)
    }
  }

  const totalResults = useMemo(() => results.length, [results])

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Results</h1>
          <p className="text-sm text-gray-600">
            Input student results and manage academic records
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/results/upload"
            className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Upload CSV
          </Link>

          <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
            Total Results: {totalResults}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-700">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-1">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Add Result</h2>

            <form onSubmit={handleCreateResult} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Student
                </label>
                <select
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                >
                  <option value="">Select student</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                      {student.studentId ? ` (${student.studentId})` : ""}
                      {student.class?.name ? ` - ${student.class.name}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Subject
                </label>
                <select
                  name="subjectId"
                  value={formData.subjectId}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                >
                  <option value="">Select subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Teacher
                </label>
                <select
                  name="teacherId"
                  value={formData.teacherId}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                >
                  <option value="">Select teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  School
                </label>
                <select
                  name="schoolId"
                  value={formData.schoolId}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                >
                  <option value="">Select school</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Score
                </label>
                <input
                  type="number"
                  name="score"
                  value={formData.score}
                  onChange={handleChange}
                  placeholder="Enter score"
                  min="0"
                  max="100"
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Term
                </label>
                <input
                  type="text"
                  name="term"
                  value={formData.term}
                  onChange={handleChange}
                  placeholder="e.g. First Term"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Session
                </label>
                <input
                  type="text"
                  name="session"
                  value={formData.session}
                  onChange={handleChange}
                  placeholder="e.g. 2025/2026"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 disabled:bg-blue-400"
              >
                {submitting ? "Saving Result..." : "Add Result"}
              </button>
            </form>
          </div>
        </div>

        <div className="xl:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-gray-900">All Results</h2>

              <Link
                href="/dashboard/results/upload"
                className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
              >
                Go to Bulk Upload
              </Link>
            </div>

            {loading ? (
              <div className="p-6 text-gray-600">Loading results...</div>
            ) : results.length === 0 ? (
              <div className="p-6 text-gray-600">No results found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-gray-700">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Student</th>
                      <th className="px-4 py-3 font-semibold">Subject</th>
                      <th className="px-4 py-3 font-semibold">Score</th>
                      <th className="px-4 py-3 font-semibold">Teacher</th>
                      <th className="px-4 py-3 font-semibold">School</th>
                      <th className="px-4 py-3 font-semibold">Term</th>
                      <th className="px-4 py-3 font-semibold">Session</th>
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-4 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((item) => (
                      <tr key={item.id} className="border-t border-gray-100">
                        <td className="px-4 py-4 text-gray-900">
                          {item.student?.name || "-"}
                        </td>
                        <td className="px-4 py-4 text-gray-700">
                          {item.subject?.name || "-"}
                        </td>
                        <td className="px-4 py-4 text-gray-700">{item.score}%</td>
                        <td className="px-4 py-4 text-gray-700">
                          {item.teacher?.name || "-"}
                        </td>
                        <td className="px-4 py-4 text-gray-700">
                          {item.school?.name || "-"}
                        </td>
                        <td className="px-4 py-4 text-gray-700">{item.term || "-"}</td>
                        <td className="px-4 py-4 text-gray-700">{item.session || "-"}</td>
                        <td className="px-4 py-4 text-gray-700">
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="px-4 py-4">
                          <button
                            onClick={() => handleDeleteResult(item.id)}
                            disabled={deletingId === item.id}
                            className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:bg-red-400"
                          >
                            {deletingId === item.id ? "Deleting..." : "Delete"}
                          </button>
                        </td>
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