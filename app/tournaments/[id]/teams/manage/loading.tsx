import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function TeamsManageLoading() {
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
      <LoadingSpinner size="lg" />
      <span className="ml-2 text-muted-foreground">Teams werden geladen...</span>
    </div>
  )
}
