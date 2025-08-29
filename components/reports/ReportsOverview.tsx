"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DatePickerWithRange } from "@/components/reports/DateRangePicker";
import { Button } from "@/components/ui/button";
import {
  Download,
  Package,
  Truck,
  CheckCircle,
  Inbox,
  Search,
  RefreshCw,
} from "lucide-react";
import { TrackingChart } from "@/components/reports/TrackingChart";
import { StatusChart } from "@/components/reports/StatusChart";
import { type TrackingEntry, getCSTDate } from "@/utils/storage";
import { addDays, startOfDay, endOfDay } from "date-fns";
import { toCsv } from "@/utils/csv";
import { toast } from "@/hooks/use-toast";

export function ReportsOverview() {
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: startOfDay(addDays(new Date(), -30)),
    to: endOfDay(new Date()),
  });

  const [filteredEntries, setFilteredEntries] = useState<TrackingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDateRange, setCurrentDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: startOfDay(addDays(new Date(), -30)),
    to: endOfDay(new Date()),
  });

  const fetchReportData = useCallback(
    async (targetDateRange = dateRange) => {
      try {
        setIsLoading(true);
        setError(null);

        let allEntries: TrackingEntry[] = [];
        let page = 1;
        let hasMore = true;

        // Use the optimized API with date range filtering
        const fromParam = encodeURIComponent(
          targetDateRange.from.toISOString()
        );
        const toParam = encodeURIComponent(targetDateRange.to.toISOString());

        while (hasMore) {
          const response = await fetch(
            `/api/fedex-tracking?page=${page}&limit=500&from=${fromParam}&to=${toParam}&includeImages=false`
          );

          if (!response.ok) {
            throw new Error(
              `Failed to fetch tracking data: ${response.statusText}`
            );
          }

          const data = await response.json();
          allEntries = [...allEntries, ...data.data];

          hasMore = data.pagination.hasNextPage;
          page++;
        }

        // Data is already filtered by date range on the server, just sort it
        const sortedEntries = allEntries.sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        setFilteredEntries(sortedEntries);
        setCurrentDateRange(targetDateRange);
        setHasData(true);

        toast({
          title: "Report Generated",
          description: `Successfully loaded ${sortedEntries.length} tracking entries`,
        });
      } catch (error) {
        console.error("Error fetching tracking entries:", error);
        const errorMessage =
          error instanceof Error ? error.message : "An unknown error occurred";
        setError(errorMessage);
        setFilteredEntries([]);
        setHasData(false);

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [dateRange]
  );

  // Auto-fetch data when component mounts
  useEffect(() => {
    fetchReportData();
  }, []);

  const handleDateRangeChange = (range: {
    from: Date | undefined;
    to?: Date | undefined;
  }) => {
    setDateRange({
      from: range.from || startOfDay(addDays(new Date(), -30)),
      to: range.to || endOfDay(new Date()),
    });
    // Keep previous data when date range changes - don't clear until user clicks generate
    setError(null);
  };

  const calculationTransittime = (entry: TrackingEntry): string => {
    const pickupEvent = entry.history?.find(
      (history) => history.status === "Picked up"
    );
    const deliveryEvent = entry.history?.find(
      (history) => history.status === "Delivered"
    );
    if (!pickupEvent || !deliveryEvent) {
      return entry.transitTime || "N/A";
    }

    const pickeupDate = getCSTDate(new Date(pickupEvent.date));
    const deliveryDate = getCSTDate(new Date(deliveryEvent.date));

    const diffMs = deliveryDate.getTime() - pickeupDate.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diffMs / (1000 * 60)) % 60);

    return `${days}d ${hours}h ${minutes}m`;
  };

  const downloadCSV = () => {
    if (!hasData || filteredEntries.length === 0) {
      toast({
        title: "No Data",
        description: "Please generate a report first before downloading",
        variant: "destructive",
      });
      return;
    }

    try {
      const csv = toCsv(
        filteredEntries.map((entry) => ({
          ...entry,
          transitTime: calculationTransittime(entry),
        }))
      );
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `tracking_report_${dateRange.from.toISOString().split("T")[0]}_${
          dateRange.to.toISOString().split("T")[0]
        }.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download Started",
        description: "CSV report is being downloaded",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to generate CSV file",
        variant: "destructive",
      });
    }
  };

  const stats = {
    total: filteredEntries.length,
    pending: filteredEntries.filter((entry) => entry.status?.name === "Pending")
      .length,
    inTransit: filteredEntries.filter(
      (entry) => entry.status?.name === "In Transit"
    ).length,
    received: filteredEntries.filter(
      (entry) => entry.status?.name === "Received"
    ).length,
    delivered: filteredEntries.filter(
      (entry) => entry.fedexDeliveryStatus === "Delivered"
    ).length,
  };

  const renderEmptyState = () => (
    <div className="text-center py-12">
      <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">No Report Data</h3>
      <p className="text-muted-foreground mb-4">
        Click "Generate Report" to load analytics for the selected date range
      </p>
    </div>
  );

  // Check if current date range is different from the data's date range
  const isDataOutdated =
    hasData &&
    (currentDateRange.from.getTime() !== dateRange.from.getTime() ||
      currentDateRange.to.getTime() !== dateRange.to.getTime());

  const renderErrorState = () => (
    <div className="text-center py-12">
      <div className="mx-auto h-12 w-12 text-destructive mb-4">⚠️</div>
      <h3 className="text-lg font-semibold mb-2">Error Loading Report</h3>
      <p className="text-muted-foreground mb-4">{error}</p>
      <Button onClick={() => fetchReportData()} variant="outline">
        <RefreshCw className="mr-2 h-4 w-4" />
        Try Again
      </Button>
    </div>
  );

  const renderLoadingState = () => (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily Tracking Volume</CardTitle>
            <CardDescription>Loading chart data...</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[350px] flex items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>Loading chart data...</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[350px] flex items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <DatePickerWithRange
            date={dateRange}
            setDate={handleDateRangeChange}
          />
          <Button
            onClick={() => fetchReportData(dateRange)}
            disabled={isLoading}
            variant={hasData ? "outline" : "default"}
          >
            {isLoading ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            {isLoading
              ? "Generating..."
              : isDataOutdated
              ? "Update Report"
              : hasData
              ? "Refresh Report"
              : "Generate Report"}
          </Button>
        </div>
        <Button
          onClick={downloadCSV}
          disabled={!hasData || isLoading}
          variant="secondary"
        >
          <Download className="mr-2 h-4 w-4" />
          Download CSV
        </Button>
      </div>

      {isLoading && renderLoadingState()}
      {error && !isLoading && renderErrorState()}
      {!hasData && !isLoading && !error && renderEmptyState()}

      {hasData && !isLoading && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Packages
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  In Transit
                </CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.inTransit}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Received</CardTitle>
                <Inbox className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.received}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  FedEx Delivered
                </CardTitle>
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
                <CardDescription>
                  Number of packages tracked per day
                </CardDescription>
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
        </>
      )}
    </div>
  );
}
