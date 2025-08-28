"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { useRealtimeListener } from "../contexts/RealtimeContext";

export default function DateCounter() {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const fetchTodayCount = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/fedex-tracking/today-count");
      if (!response.ok) throw new Error("Failed to fetch count");
      const data = await response.json();
      setCount(data.count || 0);
    } catch (error) {
      console.error("Error fetching today count:", error);
      setCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  useRealtimeListener(() => {
    fetchTodayCount();
  });

  useEffect(() => {
    fetchTodayCount();
    window.addEventListener("storage", fetchTodayCount);

    return () => {
      window.removeEventListener("storage", fetchTodayCount);
    };
  }, []);

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
  );
}
