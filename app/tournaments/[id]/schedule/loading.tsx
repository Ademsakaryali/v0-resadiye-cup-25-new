import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function TournamentScheduleLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] p-8">
      <LoadingSpinner size="lg" />
      <h2 className="mt-4 text-xl font-semibold text-gray-300">Spielplan wird geladen...</h2>
      <p className="mt-2 text-sm text-gray-400">
        Bitte warten Sie, während wir die Spieldaten für dieses Turnier abrufen.
      </p>
    </div>
  )
}
