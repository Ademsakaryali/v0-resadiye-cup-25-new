"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

type RequireAuthProps = {
  children: React.ReactNode
  allowedRoles?: Array<"Admin" | "Trainer" | "Spieler">
}

export function RequireAuth({ children, allowedRoles }: RequireAuthProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    } else if (!loading && user && allowedRoles && !allowedRoles.includes(user.rolle)) {
      router.push("/")
    }
  }, [user, loading, router, allowedRoles])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (allowedRoles && !allowedRoles.includes(user.rolle)) {
    return null
  }

  return <>{children}</>
}
