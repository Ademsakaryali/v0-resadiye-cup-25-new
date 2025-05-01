"use client"

import { LoadingSpinner } from "@/components/ui/loading-spinner"

export function PageLoading() {
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
      <LoadingSpinner size="lg" />
    </div>
  )
}

export default PageLoading
