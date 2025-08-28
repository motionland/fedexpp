"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DatePickerWithRange } from "@/components/reports/DateRangePicker";
import { Button } from "@/components/ui/button";
import { Download, Package, Truck, CheckCircle, Inbox } from "lucide-react";
import { TrackingChart } from "@/components/reports/TrackingChart";
import { StatusChart } from "@/components/reports/StatusChart";
import { type TrackingEntry, getCSTDate } from "@/utils/storage";
import { addDays, startOfDay, endOfDay } from "date-fns";
import { toCsv } from "@/utils/csv";

export function ReportsOverview() {
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: startOfDay(addDays(new Date(), -30)),
    to: endOfDay(new Date()),
  });

  const [filteredEntries, setFilteredEntries] = useState<TrackingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllEntries = async () => {
      try {
        setIsLoading(true);
        let allEntries: TrackingEntry[] = [];
        let page = 1;
        let hasMore = true;

        // Fetch all pages of data
        while (hasMore) {
          const response = await fetch(
            `/api/fedex-tracking?page=${page}&limit=100`
          );
          if (!response.ok) throw new Error("Failed to fetch tracking data");

          const data = await response.json();
          allEntries = [...allEntries, ...data.data];

          hasMore = data.pagination.hasNextPage;
          page++;
        }

        // Filter by date range
        const filtered = allEntries
          .filter((entry) => {
            const entryDate = new Date(entry.timestamp);
            return entryDate >= dateRange.from && entryDate <= dateRange.to;
          })
          .sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );

        setFilteredEntries(filtered);
      } catch (error) {
        console.error("Error fetching tracking entries:", error);
        setFilteredEntries([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllEntries();
  }, [dateRange]);

  const handleDateRangeChange = (range: {
    from: Date | undefined;
    to?: Date | undefined;
  }) => {
    setDateRange({
      from: range.from || startOfDay(addDays(new Date(), -30)),
      to: range.to || endOfDay(new Date()),
    });
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
  };

  const stats = {
    total: filteredEntries.length,
    pending: filteredEntries.filter((entry) => entry.status.name === "Pending")
      .length,
    inTransit: filteredEntries.filter(
      (entry) => entry.status.name === "In Transit"
    ).length,
    received: filteredEntries.filter(
      (entry) => entry.status.name === "Received"
    ).length,
    delivered: filteredEntries.filter(
      (entry) => entry.fedexDeliveryStatus === "Delivered"
    ).length,
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <DatePickerWithRange
            date={dateRange}
            setDate={handleDateRangeChange}
          />
          <Button disabled>
            <Download className="mr-2 h-4 w-4" />
            Download Report
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Loading...
                </CardTitle>
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
                Loading...
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
                Loading...
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
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
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
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
    </div>
  );
}
