"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  UserCircle2,
  CalendarCheck2,
  BookOpen,
  MessageSquare,
  Bell,
  LogOut,
} from "lucide-react"
import { logout } from "@/lib/auth"
import { clearSelectedChild } from "@/lib/parent"

const menuItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Parent Portal", href: "/dashboard/parents", icon: UserCircle2 },
  { name: "Attendance", href: "/dashboard/attendance", icon: CalendarCheck2 },
  { name: "Results", href: "/dashboard/results", icon: BookOpen },
  { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
]

export default function ParentSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`)

  const handleLogout = () => {
    clearSelectedChild()
    logout()
    router.replace("/login")
  }

  return (
    <aside className="hidden w-72 flex-col bg-blue-700 text-white md:flex">
      <div className="p-6 border-b border-blue-600">
        <h1 className="text-2xl font-bold">EduNerve</h1>
        <p className="text-sm text-blue-200">Parent Portal</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                isActive(item.href)
                  ? "bg-white text-blue-700"
                  : "hover:bg-blue-600"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-blue-600">
        <button
          onClick={handleLogout}
          className="w-full bg-red-600 hover:bg-red-700 px-4 py-3 rounded-xl flex items-center justify-center gap-2"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </aside>
  )
}