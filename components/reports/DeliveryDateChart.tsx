"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import type { TrackingEntry } from "@/utils/storage"

interface DeliveryDateChartProps {
  data: TrackingEntry[]
}

export function DeliveryDateChart({ data }: DeliveryDateChartProps) {
  const chartData = data.reduce((acc: { date: string; count: number }[], entry) => {
    if (entry.deliveryDate) {
      const date = new Date(entry.deliveryDate).toLocaleDateString()
      const existingDate = acc.find((item) => item.date === date)

      if (existingDate) {
        existingDate.count++
      } else {
        acc.push({ date, count: 1 })
      }
    }
    return acc
  }, [])

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
        <Tooltip />
        <Bar dataKey="count" fill="#8884d8" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

