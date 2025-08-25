"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import type { TrackingEntry } from "@/utils/storage"

interface TrackingChartProps {
  data: TrackingEntry[]
}

export function TrackingChart({ data }: TrackingChartProps) {
  const chartData = data.reduce((acc: { date: string; count: number }[], entry) => {
    const date = new Date(entry.timestamp).toLocaleDateString()
    const existingDate = acc.find((item) => item.date === date)

    if (existingDate) {
      existingDate.count++
    } else {
      acc.push({ date, count: 1 })
    }

    return acc
  }, [])

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData}>
        <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
        <Tooltip />
        <Bar dataKey="count" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
      </BarChart>
    </ResponsiveContainer>
  )
}

