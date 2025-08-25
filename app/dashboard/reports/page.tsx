import { ReportsOverview } from "@/components/reports/ReportsOverview"

export default function ReportsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container py-8">
          <h1 className="text-4xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            View tracking statistics, generate reports, and download data for your records.
          </p>
        </div>
      </header>
      <div className="flex-1 container py-8">
        <ReportsOverview />
      </div>
    </div>
  )
}

