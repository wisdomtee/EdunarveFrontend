"use client";

import { useState } from "react";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];

    if (!selected) return;

    if (!selected.name.endsWith(".csv")) {
      alert("Only CSV files are allowed");
      return;
    }

    setFile(selected);
    setMessage("");
  }

  function downloadTemplate() {
    const csvContent =
      "studentId,courseId,continuousAssessment,examScore,term,session\n";

    const blob = new Blob([csvContent], {
      type: "text/csv",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "result_template.csv";
    a.click();
  }

  async function uploadFile() {
    if (!file) {
      alert("Select CSV file first");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        "http://localhost:5000/api/results/bulk-upload",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      setMessage(data.message || "Upload completed");
    } catch {
      setMessage("Upload failed");
    }

    setLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 bg-white shadow-2xl rounded-2xl p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">
        🚀 Ultra Pro Result Upload Engine
      </h1>

      <div className="flex justify-between mb-6">
        <button
          onClick={downloadTemplate}
          className="bg-gray-800 text-white px-5 py-2 rounded-lg"
        >
          Download CSV Template
        </button>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center mb-6 hover:border-blue-400 transition">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="mx-auto"
        />

        {file && (
          <p className="mt-4 text-sm text-gray-600">
            Selected File: {file.name}
          </p>
        )}
      </div>

      <button
        onClick={uploadFile}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition text-lg font-semibold"
      >
        {loading ? "Uploading Results..." : "Start Upload"}
      </button>

      {message && (
        <p className="mt-6 text-center text-green-600 font-semibold">
          {message}
        </p>
      )}
    </div>
  );
}