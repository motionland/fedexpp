"use client";

import DateCounter from "@/components/DateCounter";
import { UppyProvider } from "@/contexts/UppyContext";
import { usePaginatedFetch } from "@/hooks/useFetch";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import SearchBar from "@/components/SearchBar";
import TrackingForm from "@/components/TrackingForm";
import TrackingList from "@/components/TrackingList";
import { TrackingEntry } from "@/utils/storage";

interface PaginationMeta {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface PaginatedResponse {
  data: TrackingEntry[];
  pagination: PaginationMeta;
}

export default function Home() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, refetch } = usePaginatedFetch<PaginatedResponse>(
    "/api/fedex-tracking",
    currentPage,
    20,
    status || undefined
  );

  // Reset page when status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [status]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container py-8">
          {/* Removed Kasandra Health header */}
        </div>
      </header>

      <div className="flex-1 container py-8 space-y-8">
        <DateCounter />
        <UppyProvider>
          <TrackingForm refetch={refetch} />
        </UppyProvider>
        <div className="w-full mt-4">
          <SearchBar onSearch={setSearchQuery} />
        </div>
        <UppyProvider>
          <TrackingList
            data={data}
            isLoading={isLoading}
            refetch={refetch}
            searchQuery={searchQuery}
            currentPage={currentPage}
            onPageChange={handlePageChange}
          />
        </UppyProvider>
      </div>
    </div>
  );
}
