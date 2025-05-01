import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function TournamentsLoading() {
  return (
    <div className="flex justify-center items-center h-[50vh]">
      <LoadingSpinner size="lg" />
    </div>
  )
}
