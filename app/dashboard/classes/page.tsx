"use client"

import { useEffect, useState } from "react"
import { API_BASE_URL, getAuthHeaders } from "@/lib/api"

type School = {
  id: string
  name: string
}

type ClassItem = {
  id: string
  name: string
  schoolId: string
  school?: {
    id: string
    name: string
  }
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [schoolId, setSchoolId] = useState("")

  const fetchClasses = async () => {
    try {
      setLoading(true)

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

  useEffect(() => {
    fetchClasses()
    fetchSchools()
  }, [])

  const resetForm = () => {
    setName("")
    setSchoolId("")
    setEditingId(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !schoolId) {
      alert("Please fill all fields")
      return
    }

    try {
      setFormLoading(true)

      const isEditing = Boolean(editingId)
      const url = isEditing
        ? `${API_BASE_URL}/classes/${editingId}`
        : `${API_BASE_URL}/classes/create`

      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          name,
          schoolId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Failed to save class")
      }

      resetForm()
      fetchClasses()
    } catch (error) {
      console.error(error)
      alert("Failed to save class")
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = (cls: ClassItem) => {
    setEditingId(cls.id)
    setName(cls.name)
    setSchoolId(cls.schoolId)
  }

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Delete this class?")
    if (!confirmed) return

    try {
      const res = await fetch(`${API_BASE_URL}/classes/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete class")
      }

      if (editingId === id) {
        resetForm()
      }

      fetchClasses()
    } catch (error) {
      console.error(error)
      alert("Failed to delete class")
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-xl shadow border">
        <h2 className="text-xl font-bold mb-4">
          {editingId ? "Edit Class" : "Add Class"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Class Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border px-4 py-2 rounded-lg"
          />

          <select
            value={schoolId}
            onChange={(e) => setSchoolId(e.target.value)}
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

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={formLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              {formLoading
                ? "Saving..."
                : editingId
                ? "Update Class"
                : "Add Class"}
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
        <h2 className="text-xl font-bold mb-4">Classes</h2>

        {loading ? (
          <p>Loading classes...</p>
        ) : (
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Class Name</th>
                <th className="border p-2">School</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>

            <tbody>
              {classes.map((cls) => (
                <tr key={cls.id}>
                  <td className="border p-2">{cls.name}</td>
                  <td className="border p-2">{cls.school?.name || "-"}</td>
                  <td className="border p-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(cls)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(cls.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {classes.length === 0 && (
                <tr>
                  <td colSpan={3} className="border p-4 text-center text-gray-500">
                    No classes found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}