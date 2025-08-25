"use client"

import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell, Legend } from "recharts"
import type { TrackingEntry } from "@/utils/storage"

interface TransitTimeChartProps {
  data: TrackingEntry[]
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

export function TransitTimeChart({ data }: TransitTimeChartProps) {
  const chartData = data.reduce((acc: { transitTime: string; count: number }[], entry) => {
    if (entry.transitTime) {
      const existingTime = acc.find((item) => item.transitTime === entry.transitTime)

      if (existingTime) {
        existingTime.count++
      } else {
        acc.push({ transitTime: entry.transitTime, count: 1 })
      }
    }
    return acc
  }, [])

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="count"
          nameKey="transitTime"
          cx="50%"
          cy="50%"
          outerRadius={80}
          fill="#8884d8"
          label
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

