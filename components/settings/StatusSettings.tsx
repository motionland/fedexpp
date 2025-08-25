"use client"

import { useState, useEffect } from "react"
import { Switch } from "@/components/ui/switch"

interface StatusData {
  id: number
  name: string
  description: string
  is_active: boolean
}

interface StatusSettingsProps {
  initialStatusData: StatusData[]
}

export function StatusSettings({ initialStatusData }: StatusSettingsProps) {
  const [statusData, setStatusData] = useState<StatusData[]>(initialStatusData)

  useEffect(() => {
    if (initialStatusData.length > 0) {
      setStatusData(initialStatusData)
    }
  }, [initialStatusData])

  const handleStatusChange = async (id: number, isActive: boolean) => {
    const response = await fetch("/api/status", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_active: isActive }),
    })

    if (response.ok) {
      setStatusData(statusData.map((status) => (status.id === id ? { ...status, is_active: isActive } : status)))
    }
  }

  if (statusData.length === 0) {
    return <div>Loading status data...</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Status Settings</h2>
      {statusData.map((status) => (
        <div key={status.id} className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h3 className="font-semibold">{status.name}</h3>
            {/* <p className="text-sm text-gray-500">{status.description}</p> */}
          </div>
          <Switch checked={status.is_active} onCheckedChange={(isActive) => handleStatusChange(status.id, isActive)} />
        </div>
      ))}
    </div>
  )
}