"use client"

import { useEffect, useState } from "react"
import { API_BASE_URL, getAuthHeaders } from "@/lib/api"

type Student = {
  id: string
  name: string
  studentId: string
  school?: {
    name: string
  }
  classItem?: {
    name: string
  }
}

type AttendanceRecord = {
  id: string
  status: string
  studentId: string
  student: Student
}

export default function AttendancePage() {
  const [students, setStudents] = useState<Student[]>([])
  const [attendance, setAttendance] = useState<Record<string, string>>({})
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  )
  const [loading, setLoading] = useState(false)

  const fetchStudents = async () => {
    try {
      setLoading(true)

      const res = await fetch(
        `${API_BASE_URL}/students?search=&page=1&limit=1000`,
        {
          headers: getAuthHeaders(),
        }
      )

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch students")
      }

      setStudents(data.students || [])
    } catch (error) {
      console.error(error)
      alert("Failed to fetch students")
    } finally {
      setLoading(false)
    }
  }

  const fetchAttendance = async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/attendance?date=${selectedDate}`,
        {
          headers: getAuthHeaders(),
        }
      )

      const data: AttendanceRecord[] = await res.json()

      if (!res.ok) {
        throw new Error("Failed to fetch attendance")
      }

      const mapped: Record<string, string> = {}

      data.forEach((item) => {
        mapped[item.studentId] = item.status
      })

      setAttendance(mapped)
    } catch (error) {
      console.error(error)
      alert("Failed to fetch attendance")
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  useEffect(() => {
    fetchAttendance()
  }, [selectedDate])

  const markAttendance = async (studentId: string, status: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/attendance/mark`, {
        method: "POST",
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          studentId,
          date: selectedDate,
          status,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Failed to mark attendance")
      }

      setAttendance((prev) => ({
        ...prev,
        [studentId]: status,
      }))
    } catch (error) {
      console.error(error)
      alert("Failed to mark attendance")
    }
  }

  const exportCSV = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/attendance/export`, {
        headers: getAuthHeaders(),
      })

      if (!res.ok) {
        throw new Error("Failed to export CSV")
      }

      const blob = await res.blob()

      const url = window.URL.createObjectURL(blob)

      const a = document.createElement("a")
      a.href = url
      a.download = "attendance-report.csv"
      a.click()

      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error(error)
      alert("Export failed")
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow border">
      <div className="flex items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold">Attendance</h1>

        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Export CSV
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border px-4 py-2 rounded-lg"
          />
        </div>
      </div>

      {loading ? (
        <p>Loading students...</p>
      ) : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Student</th>
              <th className="border p-2">Student ID</th>
              <th className="border p-2">School</th>
              <th className="border p-2">Class</th>
              <th className="border p-2">Status</th>
            </tr>
          </thead>

          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td className="border p-2">{student.name}</td>
                <td className="border p-2">{student.studentId}</td>
                <td className="border p-2">{student.school?.name || "-"}</td>
                <td className="border p-2">{student.classItem?.name || "-"}</td>

                <td className="border p-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => markAttendance(student.id, "Present")}
                      className={`px-3 py-1 rounded text-white ${
                        attendance[student.id] === "Present"
                          ? "bg-green-700"
                          : "bg-green-500"
                      }`}
                    >
                      Present
                    </button>

                    <button
                      onClick={() => markAttendance(student.id, "Absent")}
                      className={`px-3 py-1 rounded text-white ${
                        attendance[student.id] === "Absent"
                          ? "bg-red-700"
                          : "bg-red-500"
                      }`}
                    >
                      Absent
                    </button>

                    <button
                      onClick={() => markAttendance(student.id, "Late")}
                      className={`px-3 py-1 rounded text-white ${
                        attendance[student.id] === "Late"
                          ? "bg-yellow-600"
                          : "bg-yellow-500"
                      }`}
                    >
                      Late
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}