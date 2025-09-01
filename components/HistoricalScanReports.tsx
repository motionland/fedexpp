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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  getHistoricalScanReports,
  type DailyScanReport,
  getTrackingEntries,
  type TrackingEntry,
} from "@/utils/storage";
import { DatePicker } from "@/components/reports/DatePicker";
import { Download, Package } from "lucide-react";
import { format } from "date-fns";

export function HistoricalScanReports() {
  const [selectedReport, setSelectedReport] = useState<DailyScanReport | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entriesPerPage = 5;

  // Single date state - default to today
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );

  // Fetch data for the selected date
  useEffect(() => {
    async function fetchReportForDate() {
      if (!selectedDate) {
        setSelectedReport(null);
        setCurrentPage(1);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Format selected date to match the date format in reports (YYYY-MM-DD)
        const selectedDateStr = selectedDate.toLocaleDateString("en-CA"); // en-CA gives YYYY-MM-DD format

        // Create date range for the selected day (start and end of day)
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Fetch tracking entries for the specific date range
        const dailyEntries = await getTrackingEntries({
          fromDate: startOfDay.toISOString(),
          toDate: endOfDay.toISOString(),
          limit: 10000, // High limit to get all entries for the day
        });

        // Create the daily report
        if (dailyEntries.length > 0) {
          setSelectedReport({
            date: selectedDateStr,
            scannedItems: dailyEntries.length,
            trackingDetails: dailyEntries,
          });
        } else {
          setSelectedReport(null);
        }

        setCurrentPage(1); // Reset to first page when date changes
      } catch (err) {
        console.error("Error fetching report for date:", err);
        setError(
          "Failed to load report for the selected date. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchReportForDate();
  }, [selectedDate]);

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  // Pagination calculations for selected day
  const totalPages = selectedReport
    ? Math.ceil(selectedReport.trackingDetails.length / entriesPerPage)
    : 0;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentEntries = selectedReport
    ? selectedReport.trackingDetails.slice(startIndex, endIndex)
    : [];

  const convertToDateTime = (date: string) => {
    // Convert to local time for display consistency
    const localDate = new Date(date);
    return localDate
      .toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      .replace(",", "");
  };

  const convertWeeksToDaysHours = (weeks: string) => {
    const match = weeks.match(/([\d.]+)\s*weeks?/i);
    if (!match) return weeks;

    const weekValue = parseFloat(match[1]);
    const days = Math.floor(weekValue * 7);
    const hours = Math.round((weekValue * 7 - days) * 24);

    return `${days} days ${hours} hours`;
  };

  const handleDownload = async (date: string) => {
    // Use the selectedReport data that's already loaded for the date
    const dailyEntries = selectedReport?.trackingDetails || [];

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
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <DatePicker
            date={selectedDate}
            setDate={handleDateChange}
            placeholder="Select a date to view reports"
          />
        </div>
        <div className="flex justify-center items-center py-8">
          <div className="text-lg">Loading historical reports...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <DatePicker
            date={selectedDate}
            setDate={handleDateChange}
            placeholder="Select a date to view reports"
          />
        </div>
        <div className="flex justify-center items-center py-8">
          <div className="text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  if (!selectedDate) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <DatePicker
            date={selectedDate}
            setDate={handleDateChange}
            placeholder="Select a date to view reports"
          />
        </div>
        <div className="flex justify-center items-center py-8">
          <div className="text-gray-500">
            Please select a date to view historical reports.
          </div>
        </div>
      </div>
    );
  }

  if (!selectedReport) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <DatePicker
            date={selectedDate}
            setDate={handleDateChange}
            placeholder="Select a date to view reports"
          />
        </div>
        <div className="flex justify-center items-center py-8">
          <div className="text-gray-500">
            No reports available for{" "}
            {selectedDate ? format(selectedDate, "PPP") : "the selected date"}.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Picker */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <DatePicker
          date={selectedDate}
          setDate={handleDateChange}
          placeholder="Select a date"
        />
        <div className="text-sm text-muted-foreground">
          {selectedReport && (
            <>
              {selectedReport.scannedItems} total entr
              {selectedReport.scannedItems !== 1 ? "ies" : "y"}
              {totalPages > 1 && (
                <>
                  {" "}
                  • Page {currentPage} of {totalPages}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Single Day Report */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 mb-4 border-b">
          <h2 className="flex gap-3 text-lg font-semibold">
            <Package />
            Scanned on{" "}
            {new Date(selectedReport.date).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}{" "}
            ({selectedReport.scannedItems}{" "}
            {selectedReport.scannedItems === 1 ? "item" : "items"})
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownload(selectedReport.date)}
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
            {currentEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center">
                  No data available for {selectedReport.date}
                </TableCell>
              </TableRow>
            ) : (
              currentEntries.map((entry) => (
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className={
                      currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>

                {/* Page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => {
                    // Show first page, last page, current page, and pages around current page
                    const showPage =
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1;

                    if (!showPage) {
                      // Show ellipsis for gaps
                      if (page === 2 && currentPage > 4) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      if (
                        page === totalPages - 1 &&
                        currentPage < totalPages - 3
                      ) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      return null;
                    }

                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                )}

                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
}
