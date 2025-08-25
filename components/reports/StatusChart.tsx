"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Legend, Tooltip } from "recharts"
import type { TrackingEntry } from "@/utils/storage"

interface StatusChartProps {
  data: TrackingEntry[]
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

export function StatusChart({ data }: StatusChartProps) {
  const statusData = data.reduce((acc: { name: string; value: number }[], entry) => {
    const existingStatus = acc.find((item) => item.name === entry.status.name)

    if (existingStatus) {
      existingStatus.value++
    } else {
      acc.push({ name: entry.status.name, value: 1 })
    }

    return acc
  }, [])

  return (
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Pie data={statusData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value">
          {statusData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

