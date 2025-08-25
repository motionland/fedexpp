"use client"

import { useState, useEffect } from "react"
import { getTrackingEntries } from "../utils/storage"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import { useRealtimeListener } from "../contexts/RealtimeContext"
import { TrackingEntry } from "@/utils/storage"

interface Props {
  data: TrackingEntry[] | undefined,
  isLoading: boolean
}

export default function DateCounter({ data = [], isLoading }: Props) {
  const [count, setCount] = useState(0)
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const updateCount = async () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
  
    const todayCount = data.filter((entry) => 
      new Date(entry.timestamp) >= todayStart
    ).length;
  
    setCount(todayCount);
  };

  useRealtimeListener(() => {
    updateCount()
  })

  useEffect(() => {
    updateCount()
    window.addEventListener("storage", updateCount)

    return () => {
      window.removeEventListener("storage", updateCount)
    }
  }, [isLoading, data])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Today&apos;s Progress</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-2">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </div>
        <div className="text-center">
          <p className="text-5xl font-bold mb-3">{count} Packages</p>
          <p className="text-xl text-muted-foreground">{today}</p>
        </div>
      </CardContent>
    </Card>
  )
}

