"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { API_BASE_URL, getAuthHeaders } from "@/lib/api"

export default function EditStudentPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [form, setForm] = useState({
    name: "",
    studentId: "",
    gender: "",
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  // Fetch student
  useEffect(() => {
    if (!id) return

    const fetchStudent = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/students/${id}`, {
          headers: getAuthHeaders(),
        })

        const data = await res.json()

        setForm({
          name: data.name || "",
          studentId: data.studentId || "",
          gender: data.gender || "",
        })
      } catch {
        setError("Failed to load student")
      } finally {
        setLoading(false)
      }
    }

    fetchStudent()
  }, [id])

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()

    try {
      setSaving(true)

      const res = await fetch(`${API_BASE_URL}/students/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(form),
      })

      if (!res.ok) throw new Error()

      router.push(`/dashboard/students/${id}`)
    } catch {
      alert("Failed to update student")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6">Loading...</div>

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Student</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Full Name"
          className="w-full border p-3 rounded-lg"
        />

        <input
          name="studentId"
          value={form.studentId}
          onChange={handleChange}
          placeholder="Student ID"
          className="w-full border p-3 rounded-lg"
        />

        <select
          name="gender"
          value={form.gender}
          onChange={handleChange}
          className="w-full border p-3 rounded-lg"
        >
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 text-white py-3 rounded-lg"
        >
          {saving ? "Saving..." : "Update Student"}
        </button>
      </form>
    </div>
  )
}