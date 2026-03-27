"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { API_BASE_URL, getAuthHeaders } from "@/lib/api"

type School = {
  id: number
  name: string
}

type ClassType = {
  id: number
  name: string
}

type Subject = {
  id: number
  name: string
}

type Teacher = {
  id: number
  name: string
}

type Result = {
  id: number
  score: number
  createdAt?: string
  term?: string | null
  session?: string | null
  subject?: Subject
  teacher?: Teacher
}

type Attendance = {
  id: number
  date: string
  status: string
}

type Student = {
  id: number
  name: string
  studentId: string
  gender?: string | null
  photo?: string | null
  createdAt?: string
  school?: School
  class?: ClassType
  results?: Result[]
  attendance?: Attendance[]
}

async function parseResponse(response: Response) {
  const text = await response.text()

  try {
    return text ? JSON.parse(text) : {}
  } catch {
    return { message: text }
  }
}

function getToken() {
  if (typeof window === "undefined") return ""
  return localStorage.getItem("token") || ""
}

function getJsonHeaders() {
  const token = getToken()

  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export default function StudentDetailsPage() {
  const params = useParams()
  const id = params?.id as string

  const [student, setStudent] = useState<Student | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [savingResult, setSavingResult] = useState(false)
  const [deletingResultId, setDeletingResultId] = useState<number | null>(null)

  const [resultForm, setResultForm] = useState({
    subjectId: "",
    score: "",
    term: "",
    session: "",
  })

  const fetchStudent = async () => {
    const response = await fetch(`${API_BASE_URL}/students/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include",
      cache: "no-store",
    })

    const data = await parseResponse(response)

    if (!response.ok) {
      throw new Error(data?.message || "Failed to fetch student")
    }

    setStudent(data)
  }

  const fetchSubjects = async () => {
    const response = await fetch(`${API_BASE_URL}/subjects`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include",
      cache: "no-store",
    })

    const data = await parseResponse(response)

    if (!response.ok) {
      throw new Error(data?.message || "Failed to fetch subjects")
    }

    setSubjects(Array.isArray(data) ? data : data.subjects || [])
  }

  useEffect(() => {
    if (!id) return

    const loadPage = async () => {
      try {
        setLoading(true)
        setError("")
        setSuccess("")
        await Promise.all([fetchStudent(), fetchSubjects()])
      } catch (err: any) {
        setError(err.message || "Something went wrong")
      } finally {
        setLoading(false)
      }
    }

    loadPage()
  }, [id])

  const initials = useMemo(() => {
    if (!student?.name) return "S"
    return student.name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  }, [student])

  const averageScore = useMemo(() => {
    if (!student?.results || student.results.length === 0) return null
    const total = student.results.reduce((sum, item) => sum + Number(item.score || 0), 0)
    return total / student.results.length
  }, [student])

  const grade = useMemo(() => {
    if (averageScore === null) return "—"
    if (averageScore >= 70) return "A"
    if (averageScore >= 60) return "B"
    if (averageScore >= 50) return "C"
    if (averageScore >= 45) return "D"
    return "F"
  }, [averageScore])

  const attendanceStats = useMemo(() => {
    const records = student?.attendance || []
    const present = records.filter((item) => item.status?.toLowerCase() === "present").length
    const absent = records.filter((item) => item.status?.toLowerCase() === "absent").length
    const late = records.filter((item) => item.status?.toLowerCase() === "late").length

    return {
      total: records.length,
      present,
      absent,
      late,
    }
  }, [student])

  const latestResult = useMemo(() => {
    if (!student?.results || student.results.length === 0) return null
    return student.results[0]
  }, [student])

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0]
      if (!file) return

      setUploadingPhoto(true)
      setError("")
      setSuccess("")

      const formData = new FormData()
      formData.append("photo", file)

      const token = getToken()

      const response = await fetch(`${API_BASE_URL}/students/${id}/photo`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })

      const data = await parseResponse(response)

      if (!response.ok) {
        throw new Error(data.message || "Failed to upload photo")
      }

      setSuccess(data.message || "Photo uploaded successfully")
      await fetchStudent()
    } catch (err: any) {
      setError(err.message || "Failed to upload photo")
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleAddResult = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSavingResult(true)
      setError("")
      setSuccess("")

      if (!student) {
        throw new Error("Student data is not available")
      }

      if (!student.school?.id) {
        throw new Error("Student school was not found")
      }

      if (!resultForm.subjectId || !resultForm.score) {
        throw new Error("Please select a subject and enter a score")
      }

      const numericScore = Number(resultForm.score)
      const numericSubjectId = Number(resultForm.subjectId)
      const numericStudentId = Number(id)

      if (Number.isNaN(numericStudentId)) {
        throw new Error("Invalid student ID")
      }

      if (Number.isNaN(numericSubjectId)) {
        throw new Error("Invalid subject")
      }

      if (Number.isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
        throw new Error("Score must be between 0 and 100")
      }

      const payload = {
        studentId: numericStudentId,
        subjectId: numericSubjectId,
        schoolId: Number(student.school.id),
        score: numericScore,
        term: resultForm.term.trim() || "First Term",
        session: resultForm.session.trim() || "2025/2026",
      }

      console.log("ADD RESULT PAYLOAD:", payload)

      const response = await fetch(`${API_BASE_URL}/results`, {
        method: "POST",
        headers: getJsonHeaders(),
        credentials: "include",
        body: JSON.stringify(payload),
      })

      const data = await parseResponse(response)

      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to create result")
      }

      setSuccess(data.message || "Result added successfully")

      setResultForm({
        subjectId: "",
        score: "",
        term: "",
        session: "",
      })

      await fetchStudent()
    } catch (err: any) {
      setError(err.message || "Failed to add result")
    } finally {
      setSavingResult(false)
    }
  }

  const handleDeleteResult = async (resultId: number) => {
    const confirmed = window.confirm("Are you sure you want to delete this result?")
    if (!confirmed) return

    try {
      setDeletingResultId(resultId)
      setError("")
      setSuccess("")

      const response = await fetch(`${API_BASE_URL}/results/${resultId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      })

      const data = await parseResponse(response)

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete result")
      }

      setSuccess(data.message || "Result deleted successfully")
      await fetchStudent()
    } catch (err: any) {
      setError(err.message || "Failed to delete result")
    } finally {
      setDeletingResultId(null)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-lg text-gray-600">Loading student details...</p>
        </div>
      </div>
    )
  }

  if (error && !student) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-red-700">Unable to load student</h2>
          <p className="mt-2 text-red-600">{error}</p>

          <div className="mt-4 flex gap-3">
            <Link
              href="/dashboard/students"
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Back to Students
            </Link>

            <button
              onClick={() => window.location.reload()}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-gray-700">Student not found.</p>
          <Link
            href="/dashboard/students"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Back to Students
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Details</h1>
          <p className="mt-1 text-gray-600">
            View full student profile, performance, and attendance
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/dashboard/students/${id}/edit`}
            className="rounded-lg bg-yellow-500 px-4 py-2 text-white hover:bg-yellow-600"
          >
            Edit
          </Link>

          <Link
            href={`/dashboard/students/${id}/report`}
            className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            Report
          </Link>

          <Link href="/dashboard/students" className="rounded-lg border px-4 py-2">
            Back
          </Link>
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard
          label="Average Score"
          value={averageScore !== null ? averageScore.toFixed(1) : "—"}
        />
        <StatCard label="Grade" value={grade} />
        <StatCard label="Results Count" value={String(student.results?.length || 0)} />
        <StatCard label="Attendance Records" value={String(attendanceStats.total)} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center text-center">
            {student.photo ? (
              <img
                src={student.photo}
                alt={student.name}
                className="h-24 w-24 rounded-full border object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 text-3xl font-bold text-blue-700">
                {initials}
              </div>
            )}

            <label className="mt-4 cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
              {uploadingPhoto ? "Uploading..." : "Upload Photo"}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={uploadingPhoto}
              />
            </label>

            <h2 className="mt-4 text-2xl font-semibold text-gray-900">{student.name}</h2>
            <p className="text-sm text-gray-500">{student.studentId}</p>
          </div>

          <div className="mt-6 space-y-4">
            <InfoRow label="Gender" value={student.gender || "—"} />
            <InfoRow label="Class" value={student.class?.name || "—"} />
            <InfoRow label="School" value={student.school?.name || "—"} />
            <InfoRow
              label="Date Added"
              value={student.createdAt ? new Date(student.createdAt).toLocaleDateString() : "—"}
            />
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-xl font-semibold text-gray-900">Profile Information</h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailCard label="Full Name" value={student.name} />
              <DetailCard label="Student ID" value={student.studentId} />
              <DetailCard label="Gender" value={student.gender || "—"} />
              <DetailCard label="Class" value={student.class?.name || "—"} />
              <DetailCard label="School" value={student.school?.name || "—"} />
              <DetailCard
                label="Date Created"
                value={student.createdAt ? new Date(student.createdAt).toLocaleString() : "—"}
              />
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-xl font-semibold text-gray-900">Add Result</h3>

            <form onSubmit={handleAddResult} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Subject</label>
                <select
                  value={resultForm.subjectId}
                  onChange={(e) =>
                    setResultForm((prev) => ({ ...prev, subjectId: e.target.value }))
                  }
                  className="w-full rounded-lg border px-3 py-2 outline-none"
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
                <label className="mb-2 block text-sm font-medium text-gray-700">Score</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={resultForm.score}
                  onChange={(e) =>
                    setResultForm((prev) => ({ ...prev, score: e.target.value }))
                  }
                  placeholder="Enter score"
                  className="w-full rounded-lg border px-3 py-2 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Term</label>
                <input
                  type="text"
                  value={resultForm.term}
                  onChange={(e) =>
                    setResultForm((prev) => ({ ...prev, term: e.target.value }))
                  }
                  placeholder="e.g First Term"
                  className="w-full rounded-lg border px-3 py-2 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Session</label>
                <input
                  type="text"
                  value={resultForm.session}
                  onChange={(e) =>
                    setResultForm((prev) => ({ ...prev, session: e.target.value }))
                  }
                  placeholder="e.g 2025/2026"
                  className="w-full rounded-lg border px-3 py-2 outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={savingResult}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingResult ? "Saving..." : "Add Result"}
                </button>
              </div>
            </form>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-xl font-semibold text-gray-900">Attendance Summary</h3>
              <div className="space-y-3">
                <InfoRow label="Present" value={String(attendanceStats.present)} />
                <InfoRow label="Absent" value={String(attendanceStats.absent)} />
                <InfoRow label="Late" value={String(attendanceStats.late)} />
                <InfoRow label="Total" value={String(attendanceStats.total)} />
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-xl font-semibold text-gray-900">Latest Result</h3>
              {latestResult ? (
                <div className="space-y-3">
                  <InfoRow label="Subject" value={latestResult.subject?.name || "—"} />
                  <InfoRow label="Score" value={String(latestResult.score)} />
                  <InfoRow label="Teacher" value={latestResult.teacher?.name || "—"} />
                  <InfoRow
                    label="Date"
                    value={
                      latestResult.createdAt
                        ? new Date(latestResult.createdAt).toLocaleDateString()
                        : "—"
                    }
                  />
                </div>
              ) : (
                <p className="text-gray-500">No result found.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-xl font-semibold text-gray-900">Recent Results</h3>

            {student.results && student.results.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                        Subject
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                        Score
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                        Term
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                        Session
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                        Teacher
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {student.results.map((result) => (
                      <tr key={result.id} className="border-b">
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {result.subject?.name || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">{result.score}</td>
                        <td className="px-4 py-3 text-sm text-gray-800">{result.term || "—"}</td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {result.session || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {result.teacher?.name || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {result.createdAt
                            ? new Date(result.createdAt).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => handleDeleteResult(result.id)}
                            disabled={deletingResultId === result.id}
                            className="rounded-lg bg-red-600 px-3 py-2 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingResultId === result.id ? "Deleting..." : "Delete"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No results found for this student.</p>
            )}
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-xl font-semibold text-gray-900">Attendance History</h3>

            {student.attendance && student.attendance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {student.attendance.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {new Date(item.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">{item.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No attendance record found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b pb-3 last:border-b-0">
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <span className="text-right text-sm text-gray-900">{value}</span>
    </div>
  )
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-gray-50 p-4">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-base font-semibold text-gray-900">{value}</p>
    </div>
  )
}