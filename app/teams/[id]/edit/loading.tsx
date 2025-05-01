import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function TeamEditLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <LoadingSpinner size="lg" />
      <h2 className="mt-4 text-xl font-semibold text-gray-700">Team-Bearbeitung wird geladen...</h2>
      <p className="mt-2 text-gray-500">Bitte warten Sie, während die Teamdaten geladen werden.</p>
    </div>
  )
}
