"use client"

import { useEffect, useState } from "react"
import { API_BASE_URL, getAuthHeaders } from "@/lib/api"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"

type Stats = {
  totalStudents: number
  presentToday: number
  absentToday: number
  lateToday: number
}

type WeekData = {
  date: string
  present: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [weekData, setWeekData] = useState<WeekData[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      const [statsRes, weekRes] = await Promise.all([
        fetch(`${API_BASE_URL}/dashboard/stats`, {
          headers: getAuthHeaders(),
        }),
        fetch(`${API_BASE_URL}/dashboard/attendance-week`, {
          headers: getAuthHeaders(),
        }),
      ])

      const statsData = await statsRes.json()
      const weekDataRes = await weekRes.json()

      if (!statsRes.ok) {
        throw new Error(statsData.message || "Failed to fetch stats")
      }

      if (!weekRes.ok) {
        throw new Error(weekDataRes.message || "Failed to fetch weekly attendance")
      }

      setStats(statsData)
      setWeekData(Array.isArray(weekDataRes) ? weekDataRes : [])
    } catch (error) {
      console.error(error)
      alert("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow border">
        <p>Loading dashboard...</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="bg-white p-6 rounded-xl shadow border">
        <p>Failed to load dashboard.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white shadow rounded-xl p-6 border">
          <p className="text-gray-500">Total Students</p>
          <h2 className="text-3xl font-bold">{stats.totalStudents}</h2>
        </div>

        <div className="bg-green-100 shadow rounded-xl p-6 border">
          <p className="text-gray-700">Present Today</p>
          <h2 className="text-3xl font-bold">{stats.presentToday}</h2>
        </div>

        <div className="bg-red-100 shadow rounded-xl p-6 border">
          <p className="text-gray-700">Absent Today</p>
          <h2 className="text-3xl font-bold">{stats.absentToday}</h2>
        </div>

        <div className="bg-yellow-100 shadow rounded-xl p-6 border">
          <p className="text-gray-700">Late Today</p>
          <h2 className="text-3xl font-bold">{stats.lateToday}</h2>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow border">
        <h2 className="text-xl font-bold mb-4">Weekly Attendance</h2>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weekData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="present" fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}