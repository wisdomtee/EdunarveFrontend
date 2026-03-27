"use client"

import { ReactNode, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getUser } from "@/lib/auth"

type UserRole = "SUPER_ADMIN" | "SCHOOL_ADMIN" | "TEACHER" | "PARENT"

type RoleGuardProps = {
  allowedRoles: UserRole[]
  children: ReactNode
}

export default function RoleGuard({
  allowedRoles,
  children,
}: RoleGuardProps) {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const [isAllowed, setIsAllowed] = useState(false)

  useEffect(() => {
    const user = getUser()

    if (!user) {
      router.replace("/login")
      return
    }

    if (!allowedRoles.includes(user.role)) {
      router.replace("/login")
      return
    }

    setIsAllowed(true)
    setIsChecking(false)
  }, [allowedRoles, router])

  if (isChecking) {
    return <div className="p-6">Checking access...</div>
  }

  if (!isAllowed) {
    return null
  }

  return <>{children}</>
}