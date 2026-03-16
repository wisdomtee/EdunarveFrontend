"use client";

import { useState } from "react";

export default function BulkResultUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleUpload() {
    if (!file) {
      alert("Please select CSV file");
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

      setMessage(data.message);
    } catch {
      setMessage("Upload failed");
    }

    setLoading(false);
  }

  return (
    <div className="p-8 max-w-xl mx-auto bg-white rounded-xl shadow-md mt-10">
      <h2 className="text-2xl font-bold mb-6">
        Bulk Result Upload
      </h2>

      <input
        type="file"
        accept=".csv"
        onChange={(e) =>
          setFile(e.target.files ? e.target.files[0] : null)
        }
        className="mb-4 block"
      />

      <button
        onClick={handleUpload}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg"
      >
        {loading ? "Uploading..." : "Upload CSV"}
      </button>

      {message && (
        <p className="mt-4 text-green-600">{message}</p>
      )}
    </div>
  );
}