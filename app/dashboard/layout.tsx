"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  Bell,
  BookOpen,
  Building2,
  CalendarCheck2,
  ChevronDown,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  School,
  UserCircle2,
  Users,
  X,
} from "lucide-react"
import { getToken, getUser, logout } from "@/lib/auth"

type UserRole = "SUPER_ADMIN" | "SCHOOL_ADMIN" | "TEACHER" | "PARENT"

type AppUser = {
  id?: string
  name?: string
  email?: string
  role?: UserRole | string
}

type NotificationItem = {
  id: number
  title: string
  message: string
  time: string
  read: boolean
  href?: string
}

type MenuItem = {
  name: string
  href: string
  roles: UserRole[]
  icon: React.ComponentType<{ className?: string }>
  showNotificationBadge?: boolean
}

const notificationsSeed: NotificationItem[] = [
  {
    id: 1,
    title: "New student registered",
    message: "A new student profile was added successfully.",
    time: "2 mins ago",
    read: false,
    href: "/dashboard/students",
  },
  {
    id: 2,
    title: "Attendance update",
    message: "Today’s attendance has pending entries for one class.",
    time: "12 mins ago",
    read: false,
    href: "/dashboard/attendance",
  },
  {
    id: 3,
    title: "Results uploaded",
    message: "Term results were uploaded for review.",
    time: "1 hour ago",
    read: true,
    href: "/dashboard/results",
  },
]

const menuItems: MenuItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    roles: ["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER", "PARENT"],
    icon: LayoutDashboard,
  },
  {
    name: "Schools",
    href: "/dashboard/schools",
    roles: ["SUPER_ADMIN"],
    icon: Building2,
  },
  {
    name: "Students",
    href: "/dashboard/students",
    roles: ["SCHOOL_ADMIN", "TEACHER"],
    icon: GraduationCap,
  },
  {
    name: "Attendance",
    href: "/dashboard/attendance",
    roles: ["SCHOOL_ADMIN", "TEACHER"],
    icon: CalendarCheck2,
  },
  {
    name: "Teachers",
    href: "/dashboard/teachers",
    roles: ["SCHOOL_ADMIN"],
    icon: Users,
  },
  {
    name: "Classes",
    href: "/dashboard/classes",
    roles: ["SCHOOL_ADMIN", "TEACHER"],
    icon: School,
  },
  {
    name: "Subjects",
    href: "/dashboard/subjects",
    roles: ["SCHOOL_ADMIN", "TEACHER"],
    icon: BookOpen,
  },
  {
    name: "Results",
    href: "/dashboard/results",
    roles: ["SCHOOL_ADMIN", "TEACHER"],
    icon: BookOpen,
  },
  {
    name: "My Child",
    href: "/dashboard/children",
    roles: ["PARENT"],
    icon: UserCircle2,
  },
  {
    name: "Notifications",
    href: "/dashboard/notifications",
    roles: ["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER", "PARENT"],
    icon: Bell,
    showNotificationBadge: true,
  },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [checkedAuth, setCheckedAuth] = useState(false)
  const [user, setUser] = useState<AppUser | null>(null)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(notificationsSeed)

  const notificationRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const token = getToken()
    const currentUser = getUser()

    if (!token) {
      router.replace("/login")
      return
    }

    setUser(currentUser)
    setCheckedAuth(true)
  }, [router])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setNotificationOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  )

  const visibleMenuItems = useMemo(() => {
    if (!user?.role) return []
    return menuItems.filter((item) =>
      item.roles.includes(user.role as UserRole)
    )
  }, [user])

  const handleLogout = () => {
    logout()
    router.replace("/login")
  }

  const markAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, read: true } : item
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, read: true }))
    )
  }

  const isActivePath = (href: string) => {
    if (href === "/dashboard") return pathname === href
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const linkClass = (href: string) =>
    [
      "group flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition-all",
      isActivePath(href)
        ? "bg-white text-blue-700 shadow-sm"
        : "text-blue-50 hover:bg-blue-600/80 hover:text-white",
    ].join(" ")

  const iconClass = (href: string) =>
    [
      "h-5 w-5 transition",
      isActivePath(href)
        ? "text-blue-700"
        : "text-blue-100 group-hover:text-white",
    ].join(" ")

  const panelTitle =
    user?.role === "SUPER_ADMIN"
      ? "EduNerve Super Admin"
      : user?.role === "SCHOOL_ADMIN"
      ? "EduNerve School Admin"
      : user?.role === "TEACHER"
      ? "EduNerve Teacher Panel"
      : user?.role === "PARENT"
      ? "EduNerve Parent Portal"
      : "EduNerve Dashboard"

  const panelSubtitle =
    user?.role === "SUPER_ADMIN"
      ? "Manage schools, users, growth and platform settings"
      : user?.role === "SCHOOL_ADMIN"
      ? "Monitor students, teachers, classes and performance"
      : user?.role === "TEACHER"
      ? "Track classes, attendance, assessments and results"
      : user?.role === "PARENT"
      ? "Follow your child’s attendance, results and school updates"
      : "Manage your school system"

  const userInitial = user?.name?.trim()?.charAt(0)?.toUpperCase() || "A"

  if (!checkedAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-2xl bg-white px-6 py-5 shadow-sm">
          <p className="text-sm font-medium text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="md:hidden border-b border-blue-600 bg-blue-700 px-4 py-3 text-white shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white font-extrabold text-blue-700 shadow-sm">
              E
            </div>
            <div>
              <h1 className="text-lg font-bold">EduNerve</h1>
              <p className="text-xs text-blue-100">School Management</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={() => setNotificationOpen((prev) => !prev)}
                className="relative rounded-xl bg-blue-600 p-2.5 transition hover:bg-blue-500"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {notificationOpen && (
                <div className="absolute right-0 z-50 mt-2 w-[310px] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <div>
                      <h3 className="text-sm font-semibold">Notifications</h3>
                      <p className="text-xs text-slate-500">
                        {unreadCount} unread message{unreadCount === 1 ? "" : "s"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Mark all read
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-slate-500">
                        No notifications available.
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <Link
                          key={item.id}
                          href={item.href || "#"}
                          onClick={() => {
                            markAsRead(item.id)
                            setNotificationOpen(false)
                          }}
                          className={`block border-b border-slate-100 px-4 py-3 transition hover:bg-slate-50 ${
                            !item.read ? "bg-blue-50/70" : "bg-white"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              <span
                                className={`block h-2.5 w-2.5 rounded-full ${
                                  item.read ? "bg-slate-300" : "bg-blue-600"
                                }`}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-800">
                                {item.title}
                              </p>
                              <p className="mt-1 text-sm text-slate-600">
                                {item.message}
                              </p>
                              <p className="mt-2 text-xs text-slate-400">{item.time}</p>
                            </div>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>

                  <div className="bg-slate-50 px-4 py-3">
                    <Link
                      href="/dashboard/notifications"
                      onClick={() => setNotificationOpen(false)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      View all notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="rounded-xl bg-blue-600 p-2.5 transition hover:bg-blue-500"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {sidebarOpen && (
        <div className="md:hidden border-b border-blue-600 bg-blue-700 px-4 pb-4 shadow-sm">
          <div className="mb-4 rounded-2xl bg-blue-800 p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white font-bold text-blue-700">
                {userInitial}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold">{user?.name || "User"}</p>
                <p className="truncate text-sm text-blue-100">{user?.email || "No email"}</p>
                <p className="mt-1 text-xs font-medium text-blue-200">
                  {user?.role || "USER"}
                </p>
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-2">
            {visibleMenuItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={linkClass(item.href)}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="flex items-center gap-3">
                    <Icon className={iconClass(item.href)} />
                    <span>{item.name}</span>
                  </span>

                  {item.showNotificationBadge && unreadCount > 0 ? (
                    <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white shadow-sm">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  ) : (
                    <ChevronDown className="h-4 w-4 opacity-0" />
                  )}
                </Link>
              )
            })}

            <button
              onClick={handleLogout}
              className="mt-3 flex items-center gap-3 rounded-2xl bg-red-600 px-4 py-3 text-left text-sm font-medium text-white transition hover:bg-red-700"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </nav>
        </div>
      )}

      <div className="flex min-h-screen">
        <aside className="hidden w-72 flex-col bg-blue-700 text-white shadow-2xl md:flex">
          <div className="border-b border-blue-600 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl font-extrabold text-blue-700 shadow-sm">
                E
              </div>
              <div>
                <h1 className="text-2xl font-bold">EduNerve</h1>
                <p className="text-sm text-blue-100">School Management System</p>
              </div>
            </div>
          </div>

          <div className="border-b border-blue-600 px-4 py-4">
            <div className="rounded-2xl bg-blue-800 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white font-bold text-blue-700">
                  {userInitial}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{user?.name || "Administrator"}</p>
                  <p className="truncate text-sm text-blue-100">{user?.email || "No email"}</p>
                  <p className="mt-1 text-xs font-medium text-blue-200">
                    {user?.role || "ADMIN"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4">
            <div className="flex flex-col gap-2">
              {visibleMenuItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link key={item.href} href={item.href} className={linkClass(item.href)}>
                    <span className="flex items-center gap-3">
                      <Icon className={iconClass(item.href)} />
                      <span>{item.name}</span>
                    </span>

                    {item.showNotificationBadge && unreadCount > 0 ? (
                      <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white shadow-sm">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-transparent" />
                    )}
                  </Link>
                )
              })}
            </div>
          </nav>

          <div className="border-t border-blue-600 p-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-red-700"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="hidden items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm md:flex">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{panelTitle}</h2>
              <p className="text-sm text-slate-500">{panelSubtitle}</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative" ref={notificationRef}>
                <button
                  type="button"
                  onClick={() => setNotificationOpen((prev) => !prev)}
                  className="relative rounded-2xl border border-slate-200 bg-white p-3 text-slate-700 transition hover:bg-slate-50"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>

                {notificationOpen && (
                  <div className="absolute right-0 z-50 mt-3 w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
                        <p className="text-xs text-slate-500">
                          {unreadCount} unread message{unreadCount === 1 ? "" : "s"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                      >
                        Mark all read
                      </button>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-slate-500">
                          No notifications available.
                        </div>
                      ) : (
                        notifications.map((item) => (
                          <Link
                            key={item.id}
                            href={item.href || "#"}
                            onClick={() => {
                              markAsRead(item.id)
                              setNotificationOpen(false)
                            }}
                            className={`block border-b border-slate-100 px-4 py-3 transition hover:bg-slate-50 ${
                              !item.read ? "bg-blue-50/70" : "bg-white"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-1">
                                <span
                                  className={`block h-2.5 w-2.5 rounded-full ${
                                    item.read ? "bg-slate-300" : "bg-blue-600"
                                  }`}
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-800">
                                  {item.title}
                                </p>
                                <p className="mt-1 text-sm text-slate-600">
                                  {item.message}
                                </p>
                                <p className="mt-2 text-xs text-slate-400">{item.time}</p>
                              </div>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>

                    <div className="bg-slate-50 px-4 py-3">
                      <Link
                        href="/dashboard/notifications"
                        onClick={() => setNotificationOpen(false)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        View all notifications
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                  {userInitial}
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-slate-800">
                    {user?.name || "Administrator"}
                  </p>
                  <p className="text-slate-500">{user?.role || "ADMIN"}</p>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  )
}