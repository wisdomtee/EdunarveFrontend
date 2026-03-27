"use client"

import { useEffect, useRef, useState } from "react"
import { Bell } from "lucide-react"
import Link from "next/link"
import { API_BASE_URL, getAuthHeaders } from "@/lib/api"

type NotificationItem = {
  id: number
  title: string
  message: string
  time?: string
  createdAt?: string
  read: boolean
  href?: string
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const dropdownRef = useRef<HTMLDivElement | null>(null)

  const unreadCount = notifications.filter((item) => !item.read).length

  const toggleDropdown = () => {
    setOpen((prev) => !prev)
  }

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

    return created.toLocaleDateString()
  }

  const fetchNotifications = async () => {
    try {
      setLoading(true)

      const res = await fetch(`${API_BASE_URL}/notifications`, {
        method: "GET",
        headers: getAuthHeaders(),
      })

      if (!res.ok) {
        throw new Error("Failed to fetch notifications")
      }

      const data = await res.json()

      if (Array.isArray(data)) {
        setNotifications(data)
      } else {
        setNotifications([])
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: number) => {
    const target = notifications.find((item) => item.id === id)
    if (!target || target.read) return

    try {
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, read: true } : item
        )
      )

      const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      })

      if (!res.ok) {
        throw new Error("Failed to mark notification as read")
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, read: false } : item
        )
      )
    }
  }

  const markAllAsRead = async () => {
    if (unreadCount === 0 || updating) return

    const previousNotifications = [...notifications]

    try {
      setUpdating(true)

      setNotifications((prev) =>
        prev.map((item) => ({ ...item, read: true }))
      )

      const res = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      })

      if (!res.ok) {
        throw new Error("Failed to mark all notifications as read")
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
      setNotifications(previousNotifications)
    } finally {
      setUpdating(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="relative rounded-full p-2 transition hover:bg-gray-100"
        type="button"
      >
        <Bell className="h-6 w-6 text-gray-700" />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-80 rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">
                Notifications
              </h3>
              <p className="text-xs text-gray-500">
                {unreadCount} unread
              </p>
            </div>

            <button
              onClick={markAllAsRead}
              disabled={updating || unreadCount === 0}
              className="text-xs font-medium text-blue-600 hover:underline disabled:cursor-not-allowed disabled:text-gray-400"
              type="button"
            >
              {updating ? "Please wait..." : "Mark all as read"}
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p className="p-4 text-sm text-gray-500">Loading notifications...</p>
            ) : notifications.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">No notifications yet.</p>
            ) : (
              notifications.map((item) => {
                const content = (
                  <div
                    className={`cursor-pointer border-b px-4 py-3 transition hover:bg-gray-50 ${
                      !item.read ? "bg-blue-50" : "bg-white"
                    }`}
                    onClick={() => markAsRead(item.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-800">
                          {item.title}
                        </h4>
                        <p className="mt-1 text-sm text-gray-600">
                          {item.message}
                        </p>
                        <span className="mt-2 block text-xs text-gray-400">
                          {formatTime(item)}
                        </span>
                      </div>

                      {!item.read && (
                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600" />
                      )}
                    </div>
                  </div>
                )

                if (item.href) {
                  return (
                    <Link key={item.id} href={item.href}>
                      {content}
                    </Link>
                  )
                }

                return <div key={item.id}>{content}</div>
              })
            )}
          </div>

          <div className="border-t bg-gray-50 px-4 py-3">
            <Link
              href="/dashboard/notifications"
              className="text-sm font-medium text-blue-600 hover:underline"
              onClick={() => setOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}