'use client'

import { RouteGuard } from "@/components/RouteGuard"
import TrackingList from "@/components/TrackingList"
import { UppyProvider } from "@/contexts/UppyContext"
import { useFetch } from "@/hooks/useFetch"
import { TrackingEntry } from "@/utils/storage"
import { useState } from "react"
import SearchBar from "@/components/SearchBar"

export default function TrackingPage() {
  const { data, isLoading, refetch } = useFetch<TrackingEntry[]>("/api/fedex-tracking")
  const [searchQuery, setSearchQuery] = useState("")
  
  return (
    <RouteGuard allowedRoles={["admin", "manager", "user"]}>
      <UppyProvider>
        <div className="container py-8">
          <div className="flex items-center mb-6 justify-between">
            <h1 className="text-3xl font-bold">Tracking List</h1>
            <div className="w-full max-w-md mt-4"> 
              <SearchBar onSearch={setSearchQuery} />
            </div>
            <div></div>
          </div>
          <TrackingList data={data} isLoading={isLoading} refetch={refetch} searchQuery={searchQuery} />
        </div>
      </UppyProvider>
    </RouteGuard>
  )
}

