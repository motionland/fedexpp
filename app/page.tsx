"use client";

import DateCounter from "@/components/DateCounter";
import dynamic from "next/dynamic";
import { UppyProvider } from "@/contexts/UppyContext";
import { useFetch } from "@/hooks/useFetch";
import { TrackingEntry } from "@/utils/storage";
import { useSearchParams } from "next/navigation";
import TrackingList from "@/components/TrackingList";
import TrackingForm from "@/components/TrackingForm";
// const TrackingForm = dynamic(() => import("@/components/TrackingForm"), {
//   ssr: false,
// });
// const TrackingList = dynamic(() => import(""), {
//   ssr: false,
// });

export default function Home() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");

  const { data, isLoading, refetch } = useFetch<TrackingEntry[]>(
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
        <DateCounter data={data} isLoading={isLoading} />
        <UppyProvider>
          <TrackingForm />
        </UppyProvider>
        <UppyProvider>
          <TrackingList
            searchQuery="q"
            data={data}
            isLoading={isLoading}
            refetch={refetch}
          />
        </UppyProvider>
      </div>
    </div>
  );
}
