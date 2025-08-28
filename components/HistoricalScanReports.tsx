"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getHistoricalScanReports,
  type DailyScanReport,
  getTrackingEntries,
} from "@/utils/storage";
import { Download, Package } from "lucide-react";

export function HistoricalScanReports() {
  const [reports, setReports] = useState<DailyScanReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getHistory() {
      try {
        setLoading(true);
        setError(null);
        const data = await getHistoricalScanReports(10);
        setReports(data);
      } catch (err) {
        console.error("Error fetching historical reports:", err);
        setError("Failed to load historical reports. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    getHistory();
  }, []);

  const convertToDateTime = (date: string) =>
    new Date(date).toISOString().replace("T", " ").substring(0, 16);

  const convertWeeksToDaysHours = (weeks: string) => {
    const match = weeks.match(/([\d.]+)\s*weeks?/i);
    if (!match) return weeks;

    const weekValue = parseFloat(match[1]);
    const days = Math.floor(weekValue * 7);
    const hours = Math.round((weekValue * 7 - days) * 24);

    return `${days} days ${hours} hours`;
  };

  const handleDownload = async (date: string) => {
    const entries = await getTrackingEntries();
    const dailyEntries = entries.filter((entry) =>
      entry.timestamp.startsWith(date)
    );

    const csvContent = [
      ["Timestamp", "Tracking Number", "Status"].join(","),
      ...dailyEntries.map((entry) =>
        [
          entry.timestamp,
          entry.number,
          entry.status?.name || entry.status?.description || "Unknown",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `scan_report_${date}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-lg">Loading historical reports...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-500">No historical reports available.</div>
      </div>
    );
  }

  return (
    <div>
      {reports.map((report) => (
        <div key={report.date} className="mb-5">
          <div className="flex items-center justify-between pb-2 mb-4 border-b">
            <h2 className="flex gap-3 text-lg font-semibold">
              <Package />
              Scanned on{" "}
              {new Date(report.date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}{" "}
              ({report.scannedItems}{" "}
              {report.scannedItems === 1 ? "item" : "items"})
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
                <TableRow>
                  <TableCell colSpan={10} className="text-center">
                    No data available for {report.date}
                  </TableCell>
                </TableRow>
              ) : (
                report.trackingDetails.map((entry) => (
                  <TableRow
                    key={entry.id || entry.trackingNumber || entry.number}
                  >
                    <TableCell>{entry.kasId || "N/A"}</TableCell>
                    <TableCell>
                      {entry.trackingNumber || entry.number || "N/A"}
                    </TableCell>
                    <TableCell>
                      {entry.status?.description || entry.status?.name || "N/A"}
                    </TableCell>
                    <TableCell>{entry.fedexDeliveryStatus || "N/A"}</TableCell>
                    <TableCell>
                      {entry.deliveryDate
                        ? convertToDateTime(entry.deliveryDate)
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {entry.timestamp
                        ? convertToDateTime(entry.timestamp)
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {entry.shippingDate
                        ? convertToDateTime(entry.shippingDate)
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {entry.transitTime
                        ? convertWeeksToDaysHours(entry.transitTime)
                        : "N/A"}
                    </TableCell>
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
  );
}
