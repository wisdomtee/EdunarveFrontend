"use client"

import { useEffect, useMemo, useState } from "react"
import { API_BASE_URL, getAuthHeaders } from "@/lib/api"

type NotificationItem = {
  id: number
  title: string
  message: string
  read: boolean
  time?: string
  createdAt?: string
}

type FilterType = "all" | "unread" | "read"

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [filter, setFilter] = useState<FilterType>("all")
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)
  const [error, setError] = useState("")

  const formatTime = (item: NotificationItem) => {
    if (item.time) return item.time
    if (!item.createdAt) return "Just now"

    const created = new Date(item.createdAt)
    const now = new Date()
    const diffMs = now.getTime() - created.getTime()

    const minutes = Math.floor(diffMs / (1000 * 60))
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes} min${minutes > 1 ? "s" : ""} ago`
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`
    if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`

    return created.toLocaleString()
  }

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      setError("")

      const res = await fetch(`${API_BASE_URL}/notifications`, {
        method: "GET",
        headers: getAuthHeaders(),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.error || `Request failed with status ${res.status}`)
      }

      setNotifications(Array.isArray(data) ? data : [])
    } catch (err: any) {
      console.error("fetchNotifications error:", err)
      setError(err.message || "Could not load notifications.")
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const markAsRead = async (id: number) => {
    const target = notifications.find((n) => n.id === id)
    if (!target || target.read) return

    const previous = [...notifications]

    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )

      const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.error || `Request failed with status ${res.status}`)
      }
    } catch (err) {
      console.error(err)
      setNotifications(previous)
    }
  }

  const markAllAsRead = async () => {
    if (markingAll) return
    if (!notifications.some((n) => !n.read)) return

    const previous = [...notifications]

    try {
      setMarkingAll(true)

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      )

      const res = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.error || `Request failed with status ${res.status}`)
      }
    } catch (err) {
      console.error(err)
      setNotifications(previous)
    } finally {
      setMarkingAll(false)
    }
  }

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  )

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (filter === "unread") return !n.read
      if (filter === "read") return n.read
      return true
    })
  }, [notifications, filter])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
          <p className="text-sm text-gray-500">
            You have {unreadCount} unread notification{unreadCount === 1 ? "" : "s"}
          </p>
        </div>

        <button
          onClick={markAllAsRead}
          disabled={markingAll || unreadCount === 0}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {markingAll ? "Please wait..." : "Mark all as read"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "unread", "read"] as FilterType[]).map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition ${
              filter === type
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-8 text-center text-gray-500 shadow-sm">
          Loading notifications...
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-white p-8 text-center text-red-500 shadow-sm">
          {error}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center text-gray-500 shadow-sm">
          No notifications found.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markAsRead(n.id)}
              className={`cursor-pointer rounded-2xl border p-4 shadow-sm transition hover:bg-gray-50 ${
                !n.read ? "border-blue-200 bg-blue-50" : "bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-800">{n.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{n.message}</p>
                  <span className="mt-2 block text-xs text-gray-400">
                    {formatTime(n)}
                  </span>
                </div>

                {!n.read && (
                  <span className="mt-1 h-3 w-3 shrink-0 rounded-full bg-blue-600" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}