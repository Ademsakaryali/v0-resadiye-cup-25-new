import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function TournamentsLoading() {
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
      <LoadingSpinner size="lg" />
    </div>
  )
}
