"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getHistoricalScanReports, type DailyScanReport, getTrackingEntries } from "@/utils/storage"
import { Download, Package } from "lucide-react"

export function HistoricalScanReports() {
  const [reports, setReports] = useState<DailyScanReport[]>([])

  useEffect(() => {
    async function getHistory() {
      setReports(await getHistoricalScanReports(10))
    }
    
    getHistory()
  }, [])

  const convertToDateTime = (date: string) => (new Date(date).toISOString().replace("T", " ").substring(0, 16))

  const convertWeeksToDaysHours = (weeks: string) => {
    const match = weeks.match(/([\d.]+)\s*weeks?/i);
    if (!match) return weeks;

    const weekValue = parseFloat(match[1]);
    const days = Math.floor(weekValue * 7);
    const hours = Math.round((weekValue * 7 - days) * 24);

    return `${days} days ${hours} hours`;
  };

  const handleDownload = async (date: string) => {
    const entries = await getTrackingEntries()
    const dailyEntries = entries.filter((entry) => entry.timestamp.startsWith(date))

    const csvContent = [
      ["Timestamp", "Tracking Number", "Status"].join(","),
      ...dailyEntries.map((entry) => [entry.timestamp, entry.number, entry.status].join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `scan_report_${date}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div>
      {reports.map((report) => (
        <div key={report.date} className="mb-5">
          <div className="flex items-center justify-between pb-2 mb-4 border-b">
            <h2 className="flex gap-3 text-lg font-semibold">
              <Package /> 
              Scanned on {report.date} ({report.scannedItems})
            </h2>
            <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(report.date)}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>KAS ID</TableHead>
                <TableHead>Tracking Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>FedEx Delivery Status</TableHead>
                <TableHead>Delivery Date</TableHead>
                <TableHead>Scan Time</TableHead>
                <TableHead>Shipping Date</TableHead>
                <TableHead>Transit Time</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Origin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.trackingDetails.length == 0 ? (
                <TableCell colSpan={10} className="text-center">Empty</TableCell>
              ) : (
                report.trackingDetails.map((entry) => (
                  <TableRow key={entry.trackingNumber}>
                    <TableCell>{entry.kasId}</TableCell>
                    <TableCell>{entry.trackingNumber}</TableCell>
                    <TableCell>{entry.status.description}</TableCell>
                    <TableCell>{entry.fedexDeliveryStatus}</TableCell>
                    <TableCell>{entry.deliveryDate ? convertToDateTime(entry.deliveryDate) : "N/A"}</TableCell>
                    <TableCell>{entry.timestamp ? convertToDateTime(entry.timestamp) : "N/A"}</TableCell>
                    <TableCell>{entry.shippingDate ? convertToDateTime(entry.shippingDate) : "N/A"}</TableCell>
                    <TableCell>{convertWeeksToDaysHours(entry.transitTime)}</TableCell>
                    <TableCell>{entry.destination || "N/A"}</TableCell>
                    <TableCell>{entry.origin || "N/A"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  )
}

