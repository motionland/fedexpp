"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePickerWithRange } from "@/components/reports/DateRangePicker"
import { Button } from "@/components/ui/button"
import { Download, Package, Truck, CheckCircle } from "lucide-react"
import { TrackingChart } from "@/components/reports/TrackingChart"
import { StatusChart } from "@/components/reports/StatusChart"
import { getTrackingEntries, type TrackingEntry, getCSTDate } from "@/utils/storage"
import { addDays, startOfDay, endOfDay } from "date-fns"
import { toCsv } from "@/utils/csv"

export function ReportsOverview() {
  const [dateRange, setDateRange] = useState<{
    from: Date
    to: Date
  }>({
    from: startOfDay(addDays(new Date(), -30)),
    to: endOfDay(new Date()),
  })

  const [filteredEntries, setFilteredEntries] = useState<TrackingEntry[]>([])

  useEffect(() => {
    const fetchEntries = async () => {
      const entries = await getTrackingEntries()
      setFilteredEntries(
        entries
          .filter((entry) => {
            const entryDate = new Date(entry.timestamp);
            return entryDate >= dateRange.from && entryDate <= dateRange.to;
          })
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      );
    }

    fetchEntries()
  }, [dateRange])

  const handleDateRangeChange = (range: { from: Date | undefined; to?: Date | undefined }) => {
    setDateRange({
      from: range.from || startOfDay(addDays(new Date(), -30)),
      to: range.to || endOfDay(new Date()),
    })
  }

  const calculationTransittime = (entry: TrackingEntry): string => {
    const pickupEvent = entry.history?.find((history) => history.status === "Picked up")
    const deliveryEvent = entry.history?.find((history) => history.status === "Delivered")
    if (!pickupEvent || !deliveryEvent) {
      return entry.transitTime || "N/A"
    }

    const pickeupDate = getCSTDate(new Date(pickupEvent.date))
    const deliveryDate = getCSTDate(new Date(deliveryEvent.date))

    const diffMs = deliveryDate.getTime() - pickeupDate.getTime()
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diffMs / (1000 * 60)) % 60);

    return `${days}d ${hours}h ${minutes}m`
  }

  const downloadCSV = () => {
    const csv = toCsv(filteredEntries.map(entry => ({
      ...entry,
      transitTime: calculationTransittime(entry)
    })))
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `tracking_report_${dateRange.from.toISOString().split("T")[0]}_${dateRange.to.toISOString().split("T")[0]}.csv`,
    )
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const stats = {
    total: filteredEntries.length,
    inTransit: filteredEntries.filter((entry) => entry.status.name === "In Transit").length,
    delivered: filteredEntries.filter((entry) => entry.status.name === "Delivered").length,
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <DatePickerWithRange date={dateRange} setDate={handleDateRangeChange} />
        <Button onClick={downloadCSV}>
          <Download className="mr-2 h-4 w-4" />
          Download Report
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Packages</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inTransit}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.delivered}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily Tracking Volume</CardTitle>
            <CardDescription>Number of packages tracked per day</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 text-black">
            <TrackingChart data={filteredEntries} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>Package status breakdown</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <StatusChart data={filteredEntries} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

