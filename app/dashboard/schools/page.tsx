"use client"

import { useEffect, useState } from "react"
import { API_BASE_URL, getAuthHeaders } from "@/lib/api"

type School = {
  id: string
  name: string
  address: string
}

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(false)
  const [formLoading, setFormLoading] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [address, setAddress] = useState("")

  const fetchSchools = async () => {
    try {
      setLoading(true)

      const res = await fetch(`${API_BASE_URL}/schools`, {
        headers: getAuthHeaders(),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.message)

      setSchools(data)
    } catch (error) {
      console.error(error)
      alert("Failed to fetch schools")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchools()
  }, [])

  const resetForm = () => {
    setName("")
    setAddress("")
    setEditingId(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !address) {
      alert("Please fill all fields")
      return
    }

    try {
      setFormLoading(true)

      const isEditing = Boolean(editingId)

      const url = isEditing
        ? `${API_BASE_URL}/schools/${editingId}`
        : `${API_BASE_URL}/schools/create`

      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          name,
          address,
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.message)

      resetForm()
      fetchSchools()

    } catch (error) {
      console.error(error)
      alert("Failed to save school")
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = (school: School) => {
    setEditingId(school.id)
    setName(school.name)
    setAddress(school.address)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this school?")) return

    try {
      const res = await fetch(`${API_BASE_URL}/schools/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.message)

      fetchSchools()
    } catch (error) {
      console.error(error)
      alert("Failed to delete school")
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">

      {/* Form */}

      <div className="bg-white p-6 rounded-xl shadow border">

        <h2 className="text-xl font-bold mb-4">
          {editingId ? "Edit School" : "Add School"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="text"
            placeholder="School Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border px-4 py-2 rounded-lg"
          />

          <input
            type="text"
            placeholder="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
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
                ? "Update School"
                : "Add School"}
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

      {/* Table */}

      <div className="bg-white p-6 rounded-xl shadow border">

        <h2 className="text-xl font-bold mb-4">Schools</h2>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="w-full border">

            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Name</th>
                <th className="border p-2">Address</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>

            <tbody>
              {schools.map((school) => (
                <tr key={school.id}>

                  <td className="border p-2">{school.name}</td>

                  <td className="border p-2">{school.address}</td>

                  <td className="border p-2 flex gap-2">

                    <button
                      onClick={() => handleEdit(school)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(school.id)}
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

    </div>
  )
}