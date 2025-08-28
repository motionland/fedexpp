"use client";

import DateCounter from "@/components/DateCounter";
import dynamic from "next/dynamic";
import { UppyProvider } from "@/contexts/UppyContext";
import { useFetch } from "@/hooks/useFetch";
import { useSearchParams } from "next/navigation";
import TrackingList from "@/components/TrackingList";
import TrackingForm from "@/components/TrackingForm";
// const TrackingForm = dynamic(() => import("@/components/TrackingForm"), {
//   ssr: false,
// });
// const TrackingList = dynamic(() => import(""), {
//   ssr: false,
// });

interface PaginatedResponse {
  data: any[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export default function Home() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");

  const { data, isLoading, refetch } = useFetch<PaginatedResponse>(
    `/api/fedex-tracking${status ? `?status=${status}` : ""}`
  );

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
          <TrackingForm />
        </UppyProvider>
        <UppyProvider>
          <TrackingList
            searchQuery="q"
            data={data}
            isLoading={isLoading}
            refetch={refetch}
            currentPage={1}
            onPageChange={() => {}}
          />
        </UppyProvider>
      </div>
    </div>
  );
}
