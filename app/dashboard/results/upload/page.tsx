"use client"

import { useState } from "react"
import { API_BASE_URL } from "@/lib/api"

function getToken() {
  if (typeof window === "undefined") return ""
  return localStorage.getItem("token") || ""
}

type UploadResponse = {
  message: string
  totalRows: number
  successCount: number
  failedCount: number
  failedRows: Array<{
    row: number
    error: string
    data: Record<string, any>
  }>
}

export default function UploadResultsPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<UploadResponse | null>(null)

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)
      setError("")
      setResult(null)

      if (!file) {
        throw new Error("Please select a CSV file")
      }

      const formData = new FormData()
      formData.append("file", file)

      const token = getToken()

      const response = await fetch(`${API_BASE_URL}/results/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to upload results")
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bulk Result Upload</h1>
        <p className="mt-1 text-gray-600">
          Upload student results in CSV format
        </p>
      </div>

      <a
  href={`${API_BASE_URL}/results/template`}
  target="_blank"
  className="inline-block rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
>
  Download CSV Template
</a>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">CSV Format</h2>
        <pre className="overflow-x-auto rounded-lg bg-gray-50 p-4 text-sm text-gray-800">
{`studentId,subject,score,term,session
STD001,Mathematics,75,First Term,2025/2026
STD001,English,68,First Term,2025/2026
STD002,Mathematics,81,First Term,2025/2026`}
        </pre>
      </div>

      <form
        onSubmit={handleUpload}
        className="rounded-2xl border bg-white p-6 shadow-sm space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select CSV File
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full rounded-lg border px-3 py-2"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Uploading..." : "Upload Results"}
        </button>
      </form>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Upload Summary</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <SummaryCard label="Total Rows" value={String(result.totalRows)} />
            <SummaryCard label="Successful" value={String(result.successCount)} />
            <SummaryCard label="Failed" value={String(result.failedCount)} />
          </div>

          {result.failedRows.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Failed Rows</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                        Row
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                        Error
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                        Data
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.failedRows.map((row, index) => (
                      <tr key={index} className="border-b">
                        <td className="px-4 py-3 text-sm text-gray-800">{row.row}</td>
                        <td className="px-4 py-3 text-sm text-red-700">{row.error}</td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          <pre className="whitespace-pre-wrap text-xs">
                            {JSON.stringify(row.data, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-gray-50 p-4">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}