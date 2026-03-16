"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { API_BASE_URL, getAuthHeaders } from "@/lib/api"

type School = {
  id: string
  name: string
}

type ClassItem = {
  id: string
  name: string
  schoolId: string
}

type Student = {
  id: string
  name: string
  studentId: string
  schoolId: string
  classId: string
  photo?: string | null
  school?: {
    name: string
  }
  classItem?: {
    name: string
  }
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [studentId, setStudentId] = useState("")
  const [classId, setClassId] = useState("")
  const [schoolId, setSchoolId] = useState("")
  const [photo, setPhoto] = useState<File | null>(null)

  const limit = 10

  const fetchStudents = async () => {
    try {
      setLoading(true)

      const res = await fetch(
        `${API_BASE_URL}/students?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`,
        {
          headers: getAuthHeaders(),
        }
      )

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch students")
      }

      setStudents(data.students || [])
      setPages(data.pages || 1)
    } catch (error) {
      console.error(error)
      alert("Failed to fetch students")
    } finally {
      setLoading(false)
    }
  }

  const fetchSchools = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/schools`, {
        headers: getAuthHeaders(),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch schools")
      }

      setSchools(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error(error)
      alert("Failed to fetch schools")
    }
  }

  const fetchClasses = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/classes`, {
        headers: getAuthHeaders(),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch classes")
      }

      setClasses(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error(error)
      alert("Failed to fetch classes")
    }
  }

  useEffect(() => {
    fetchSchools()
    fetchClasses()
  }, [])

  useEffect(() => {
    fetchStudents()
  }, [search, page])

  const resetForm = () => {
    setName("")
    setStudentId("")
    setClassId("")
    setSchoolId("")
    setPhoto(null)
    setEditingId(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !studentId || !classId || !schoolId) {
      alert("Please fill all fields")
      return
    }

    try {
      setFormLoading(true)

      const formData = new FormData()
      formData.append("name", name)
      formData.append("studentId", studentId)
      formData.append("classId", classId)
      formData.append("schoolId", schoolId)

      if (photo) {
        formData.append("photo", photo)
      }

      const token = localStorage.getItem("token")
      const url = editingId
        ? `${API_BASE_URL}/students/${editingId}`
        : `${API_BASE_URL}/students/create`

      const method = editingId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Failed to save student")
      }

      resetForm()
      fetchStudents()
    } catch (error) {
      console.error(error)
      alert("Failed to save student")
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = (student: Student) => {
    setEditingId(student.id)
    setName(student.name)
    setStudentId(student.studentId)
    setClassId(student.classId)
    setSchoolId(student.schoolId)
    setPhoto(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this student?")) return

    try {
      const res = await fetch(`${API_BASE_URL}/students/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Delete failed")
      }

      fetchStudents()
    } catch (error) {
      console.error(error)
      alert("Delete failed")
    }
  }

  const filteredClasses = schoolId
    ? classes.filter((cls) => cls.schoolId === schoolId)
    : []

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-xl shadow border">
        <h2 className="text-xl font-bold mb-4">
          {editingId ? "Edit Student" : "Add Student"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Student Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border px-4 py-2 rounded-lg"
          />

          <input
            type="text"
            placeholder="Student ID"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="w-full border px-4 py-2 rounded-lg"
          />

          <select
            value={schoolId}
            onChange={(e) => {
              setSchoolId(e.target.value)
              setClassId("")
            }}
            className="w-full border px-4 py-2 rounded-lg"
          >
            <option value="">
              {schools.length === 0 ? "No schools available" : "Select school"}
            </option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>

          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            disabled={!schoolId || filteredClasses.length === 0}
            className="w-full border px-4 py-2 rounded-lg disabled:bg-gray-100"
          >
            <option value="">
              {!schoolId
                ? "Select school first"
                : filteredClasses.length === 0
                ? "No classes for this school"
                : "Select class"}
            </option>
            {filteredClasses.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files?.[0] || null)}
            className="w-full border px-4 py-2 rounded-lg"
          />

          <div className="flex gap-3">
            <button
              disabled={formLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              {formLoading
                ? "Saving..."
                : editingId
                ? "Update Student"
                : "Add Student"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-xl shadow border overflow-x-auto">
        <div className="flex justify-between mb-4 gap-4">
          <h2 className="text-xl font-bold">Students</h2>

          <input
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={(e) => {
              setPage(1)
              setSearch(e.target.value)
            }}
            className="border px-4 py-2 rounded-lg"
          />
        </div>

        {loading ? (
          <p>Loading students...</p>
        ) : (
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Photo</th>
                <th className="border p-2">Name</th>
                <th className="border p-2">Student ID</th>
                <th className="border p-2">School</th>
                <th className="border p-2">Class</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>

            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td className="border p-2">
                    {student.photo ? (
                      <img
                        src={`${API_BASE_URL}${student.photo}`}
                        alt={student.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                        N/A
                      </div>
                    )}
                  </td>

                  <td className="border p-2">{student.name}</td>
                  <td className="border p-2">{student.studentId}</td>
                  <td className="border p-2">{student.school?.name || "-"}</td>
                  <td className="border p-2">{student.classItem?.name || "-"}</td>
                  <td className="border p-2">
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/students/${student.id}`}
                        className="bg-blue-600 text-white px-3 py-1 rounded"
                      >
                        View
                      </Link>

                      <button
                        onClick={() => handleEdit(student)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(student.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {students.length === 0 && (
                <tr>
                  <td colSpan={6} className="border p-4 text-center text-gray-500">
                    No students found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        <div className="flex justify-center gap-3 mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 bg-gray-200 rounded"
          >
            Prev
          </button>

          <span>
            Page {page} of {pages}
          </span>

          <button
            disabled={page === pages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 bg-gray-200 rounded"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}