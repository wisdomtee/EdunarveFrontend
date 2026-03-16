"use client"

import { useEffect, useState } from "react"
import { API_BASE_URL, getAuthHeaders } from "@/lib/api"

type Teacher = {
  id: string
  name: string
  subject: string
  school?: {
    name: string
  }
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(false)

  const fetchTeachers = async () => {
    try {
      setLoading(true)

      const res = await fetch(`${API_BASE_URL}/teachers`, {
        headers: getAuthHeaders(),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.message)

      setTeachers(data)
    } catch (error) {
      console.error(error)
      alert("Failed to fetch teachers")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this teacher?")) return

    try {
      const res = await fetch(`${API_BASE_URL}/teachers/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.message)

      fetchTeachers()
    } catch (error) {
      console.error(error)
      alert("Failed to delete teacher")
    }
  }

  useEffect(() => {
    fetchTeachers()
  }, [])

  return (
    <div className="bg-white p-6 rounded-xl shadow border">
      <h1 className="text-2xl font-bold mb-4">Teachers</h1>

      {loading ? (
        <p>Loading teachers...</p>
      ) : (
        <table className="w-full border">

          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Name</th>
              <th className="border p-2">Subject</th>
              <th className="border p-2">School</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>

          <tbody>
            {teachers.map((teacher) => (
              <tr key={teacher.id}>

                <td className="border p-2">{teacher.name}</td>

                <td className="border p-2">{teacher.subject}</td>

                <td className="border p-2">
                  {teacher.school?.name || "-"}
                </td>

                <td className="border p-2">

                  <button
                    onClick={() => handleDelete(teacher.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>

                </td>

              </tr>
            ))}
          </tbody>

        </table>
      )}
    </div>
  )
}