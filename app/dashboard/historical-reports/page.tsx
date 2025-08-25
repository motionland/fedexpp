import { HistoricalScanReports } from "@/components/HistoricalScanReports"
import { RouteGuard } from "@/components/RouteGuard"

export default function HistoricalReportsPage() {
  return (
    <RouteGuard allowedRoles={["admin", "manager"]}>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Historical Scan Reports</h1>
        <HistoricalScanReports />
      </div>
    </RouteGuard>
  )
}

