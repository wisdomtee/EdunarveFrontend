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
  term?: string | null
  session?: string | null
  createdAt?: string
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
  createdAt?: string
  teacherRemark?: string | null
  principalRemark?: string | null
  school?: School
  class?: ClassType
  results?: Result[]
  attendance?: Attendance[]
}

type ReportApiResponse = {
  student: {
    id: number
    name: string
    studentId: string
    gender?: string | null
    class?: ClassType
    school?: School
  }
  report: {
    term: string
    session: string
    totalSubjects: number
    totalScore: number
    averageScore: number
    grade: string
    position?: number | null
    classSize?: number
    passedSubjects?: number
    failedSubjects?: number
    results: Array<{
      id: number
      subject: string
      score: number
      term?: string | null
      session?: string | null
    }>
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

function getGradeFromScore(score: number) {
  if (score >= 70) return "A"
  if (score >= 60) return "B"
  if (score >= 50) return "C"
  if (score >= 45) return "D"
  return "F"
}

function getOrdinal(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return `${n}st`
  if (n % 10 === 2 && n % 100 !== 12) return `${n}nd`
  if (n % 10 === 3 && n % 100 !== 13) return `${n}rd`
  return `${n}th`
}

export default function StudentReportPage() {
  const params = useParams()
  const id = params?.id as string

  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [teacherRemark, setTeacherRemark] = useState("")
  const [principalRemark, setPrincipalRemark] = useState("")
  const [termFilter, setTermFilter] = useState("All Terms")
  const [sessionFilter, setSessionFilter] = useState("All Sessions")
  const [reportData, setReportData] = useState<ReportApiResponse | null>(null)

  useEffect(() => {
    if (!id) return

    const fetchStudent = async () => {
      try {
        setLoading(true)
        setError("")
        setSuccess("")

        const response = await fetch(`${API_BASE_URL}/students/${id}`, {
          method: "GET",
          headers: getAuthHeaders(),
          credentials: "include",
          cache: "no-store",
        })

        const data = await parseResponse(response)

        if (!response.ok) {
          throw new Error(data?.message || "Failed to fetch student report")
        }

        setStudent(data)
        setTeacherRemark(data.teacherRemark || "")
        setPrincipalRemark(data.principalRemark || "")
      } catch (err: any) {
        setError(err.message || "Something went wrong")
      } finally {
        setLoading(false)
      }
    }

    fetchStudent()
  }, [id])

  useEffect(() => {
    if (!id) return

    const fetchReport = async () => {
      try {
        const activeTerm = termFilter === "All Terms" ? "" : termFilter
        const activeSession = sessionFilter === "All Sessions" ? "" : sessionFilter

        const params = new URLSearchParams()
        if (activeTerm) params.set("term", activeTerm)
        if (activeSession) params.set("session", activeSession)

        const response = await fetch(
          `${API_BASE_URL}/report/student/${id}${params.toString() ? `?${params.toString()}` : ""}`,
          {
            method: "GET",
            headers: getAuthHeaders(),
            credentials: "include",
            cache: "no-store",
          }
        )

        const data = await parseResponse(response)

        if (!response.ok) {
          throw new Error(data?.message || "Failed to fetch report summary")
        }

        setReportData(data)
      } catch (err) {
        setReportData(null)
      }
    }

    fetchReport()
  }, [id, termFilter, sessionFilter])

  const filteredResults = useMemo(() => {
    const results = student?.results || []

    return results.filter((result) => {
      const termMatch =
        termFilter === "All Terms" || (result.term || "") === termFilter
      const sessionMatch =
        sessionFilter === "All Sessions" || (result.session || "") === sessionFilter

      return termMatch && sessionMatch
    })
  }, [student, termFilter, sessionFilter])

  const averageScore = useMemo(() => {
    if (reportData?.report) return reportData.report.averageScore
    if (!filteredResults || filteredResults.length === 0) return null

    const total = filteredResults.reduce((sum, item) => sum + Number(item.score || 0), 0)
    return total / filteredResults.length
  }, [filteredResults, reportData])

  const grade = useMemo(() => {
    if (reportData?.report?.grade) return reportData.report.grade
    if (averageScore === null) return "—"
    if (averageScore >= 70) return "A"
    if (averageScore >= 60) return "B"
    if (averageScore >= 50) return "C"
    if (averageScore >= 45) return "D"
    return "F"
  }, [averageScore, reportData])

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

  const attendanceRate = useMemo(() => {
    if (attendanceStats.total === 0) return "—"
    return `${((attendanceStats.present / attendanceStats.total) * 100).toFixed(1)}%`
  }, [attendanceStats])

  const bestScore = useMemo(() => {
    if (!filteredResults || filteredResults.length === 0) return "—"
    return String(Math.max(...filteredResults.map((r) => Number(r.score || 0))))
  }, [filteredResults])

  const lowestScore = useMemo(() => {
    if (!filteredResults || filteredResults.length === 0) return "—"
    return String(Math.min(...filteredResults.map((r) => Number(r.score || 0))))
  }, [filteredResults])

  const subjectsTaken = useMemo(() => {
    if (reportData?.report?.totalSubjects !== undefined) {
      return String(reportData.report.totalSubjects)
    }

    if (!filteredResults || filteredResults.length === 0) return "0"

    return String(new Set(filteredResults.map((r) => r.subject?.name).filter(Boolean)).size)
  }, [filteredResults, reportData])

  const availableTerms = useMemo(() => {
    const terms = new Set((student?.results || []).map((r) => r.term).filter(Boolean))
    return ["All Terms", ...(Array.from(terms) as string[])]
  }, [student])

  const availableSessions = useMemo(() => {
    const sessions = new Set((student?.results || []).map((r) => r.session).filter(Boolean))
    return ["All Sessions", ...(Array.from(sessions) as string[])]
  }, [student])

  const autoTeacherRemark = useMemo(() => {
    if (averageScore === null) return "No academic record available yet."
    if (averageScore >= 70) return "Excellent performance. Keep it up."
    if (averageScore >= 60) return "Very good performance with strong potential."
    if (averageScore >= 50) return "Good effort. More consistency will improve results."
    if (averageScore >= 45) return "Fair performance. Needs more attention and practice."
    return "Performance is below expectation. Immediate academic support is advised."
  }, [averageScore])

  const autoPrincipalRemark = useMemo(() => {
    if (averageScore === null) return "Awaiting academic records for review."
    if (averageScore >= 70) return "Impressive result. The student is performing excellently."
    if (averageScore >= 60) return "Commendable performance. Keep working hard."
    if (averageScore >= 50) return "Satisfactory performance. There is room for improvement."
    if (averageScore >= 45) return "The student should be encouraged to improve academically."
    return "Urgent improvement is required. Parents and teachers should work closely together."
  }, [averageScore])

  const handlePrint = () => {
    window.print()
  }

  const saveRemarks = async () => {
    try {
      setSaving(true)
      setError("")
      setSuccess("")

      const response = await fetch(`${API_BASE_URL}/students/${id}/remarks`, {
        method: "PUT",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({
          teacherRemark,
          principalRemark,
        }),
      })

      const data = await parseResponse(response)

      if (!response.ok) {
        throw new Error(data.message || "Failed to save remarks")
      }

      setStudent((prev) =>
        prev
          ? {
              ...prev,
              teacherRemark,
              principalRemark,
            }
          : prev
      )

      setSuccess("Remarks saved successfully")
    } catch (err: any) {
      setError(err.message || "Failed to save remarks")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-lg text-gray-600">Loading report...</p>
        </div>
      </div>
    )
  }

  if (error && !student) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-red-700">Unable to load report</h2>
          <p className="mt-2 text-red-600">{error}</p>

          <div className="mt-4 flex gap-3">
            <Link
              href={`/dashboard/students/${id}`}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Back to Profile
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-gray-700">Student report not found.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          .no-print {
            display: none !important;
          }

          .print-container {
            padding: 0 !important;
            margin: 0 !important;
          }

          .print-card {
            box-shadow: none !important;
            border: 1px solid #d1d5db !important;
            break-inside: avoid;
          }

          table {
            width: 100% !important;
          }

          th,
          td {
            font-size: 12px !important;
          }
        }
      `}</style>

      <div className="print-container p-6 space-y-6">
        <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Student Report</h1>
            <p className="mt-1 text-gray-600">
              Academic and attendance summary for this student
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={saveRemarks}
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Remarks"}
            </button>

            <button
              onClick={handlePrint}
              className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
            >
              Download / Print PDF
            </button>

            <Link
              href={`/dashboard/students/${id}`}
              className="rounded-lg border px-4 py-2"
            >
              Back to Profile
            </Link>
          </div>
        </div>

        {error && (
          <div className="no-print rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="no-print rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-700">
            {success}
          </div>
        )}

        <div className="no-print rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Filter Results</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Term</label>
              <select
                value={termFilter}
                onChange={(e) => setTermFilter(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 outline-none"
              >
                {availableTerms.map((term) => (
                  <option key={term} value={term}>
                    {term}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Session</label>
              <select
                value={sessionFilter}
                onChange={(e) => setSessionFilter(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 outline-none"
              >
                {availableSessions.map((session) => (
                  <option key={session} value={session}>
                    {session}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="print-card rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {student.school?.name || "School Report Sheet"}
            </h2>
            <p className="mt-1 text-gray-600">Student Academic Report</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ReportItem label="Student Name" value={student.name} />
            <ReportItem label="Student ID" value={student.studentId} />
            <ReportItem label="Gender" value={student.gender || "—"} />
            <ReportItem label="Class" value={student.class?.name || "—"} />
            <ReportItem label="School" value={student.school?.name || "—"} />
            <ReportItem
              label="Date Joined"
              value={student.createdAt ? new Date(student.createdAt).toLocaleDateString() : "—"}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4 xl:grid-cols-8">
          <StatCard
            label="Average Score"
            value={averageScore !== null ? averageScore.toFixed(1) : "—"}
          />
          <StatCard label="Grade" value={grade} />
          <StatCard label="Results Count" value={String(filteredResults.length || 0)} />
          <StatCard label="Attendance Rate" value={attendanceRate} />
          <StatCard
            label="Class Position"
            value={
              reportData?.report?.position
                ? `${getOrdinal(reportData.report.position)} of ${reportData.report.classSize ?? 0}`
                : "—"
            }
          />
          <StatCard
            label="Passed Subjects"
            value={String(reportData?.report?.passedSubjects ?? 0)}
          />
          <StatCard
            label="Failed Subjects"
            value={String(reportData?.report?.failedSubjects ?? 0)}
          />
          <StatCard
            label="Total Score"
            value={
              reportData?.report?.totalScore !== undefined
                ? String(reportData.report.totalScore)
                : filteredResults.length > 0
                ? String(
                    filteredResults.reduce((sum, item) => sum + Number(item.score || 0), 0)
                  )
                : "0"
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="print-card rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Attendance Summary</h2>
            <div className="space-y-3">
              <ReportItem label="Present" value={String(attendanceStats.present)} />
              <ReportItem label="Absent" value={String(attendanceStats.absent)} />
              <ReportItem label="Late" value={String(attendanceStats.late)} />
              <ReportItem label="Total Records" value={String(attendanceStats.total)} />
            </div>
          </div>

          <div className="print-card rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Performance Summary</h2>
            <div className="space-y-3">
              <ReportItem label="Best Score" value={bestScore} />
              <ReportItem label="Lowest Score" value={lowestScore} />
              <ReportItem label="Subjects Taken" value={subjectsTaken} />
              <ReportItem label="Overall Grade" value={grade} />
            </div>
          </div>
        </div>

        <div className="print-card rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Results Table</h2>

          {filteredResults.length > 0 ? (
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
                      Grade
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
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((result) => (
                    <tr key={result.id} className="border-b">
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {result.subject?.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">{result.score}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {getGradeFromScore(Number(result.score || 0))}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">{result.term || "—"}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{result.session || "—"}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {result.teacher?.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {result.createdAt
                          ? new Date(result.createdAt).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No results found for the selected filter.</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="print-card rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Teacher's Remark</h2>

            <textarea
              value={teacherRemark}
              onChange={(e) => setTeacherRemark(e.target.value)}
              placeholder={autoTeacherRemark}
              className="no-print min-h-[140px] w-full rounded-lg border p-4 outline-none"
            />

            <div className="hidden min-h-[140px] rounded-lg border p-4 text-sm text-gray-800 whitespace-pre-wrap print:block">
              {teacherRemark || autoTeacherRemark}
            </div>

            <p className="no-print mt-2 text-xs text-gray-500">
              Suggested: {autoTeacherRemark}
            </p>

            <div className="mt-6">
              <p className="text-sm text-gray-500">Class Teacher Signature:</p>
              <div className="mt-6 border-b border-gray-400" />
            </div>
          </div>

          <div className="print-card rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Principal's Remark</h2>

            <textarea
              value={principalRemark}
              onChange={(e) => setPrincipalRemark(e.target.value)}
              placeholder={autoPrincipalRemark}
              className="no-print min-h-[140px] w-full rounded-lg border p-4 outline-none"
            />

            <div className="hidden min-h-[140px] rounded-lg border p-4 text-sm text-gray-800 whitespace-pre-wrap print:block">
              {principalRemark || autoPrincipalRemark}
            </div>

            <p className="no-print mt-2 text-xs text-gray-500">
              Suggested: {autoPrincipalRemark}
            </p>

            <div className="mt-6">
              <p className="text-sm text-gray-500">Principal Signature:</p>
              <div className="mt-6 border-b border-gray-400" />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="print-card rounded-2xl border bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

function ReportItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b pb-3 last:border-b-0">
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <span className="text-right text-sm text-gray-900">{value}</span>
    </div>
  )
}