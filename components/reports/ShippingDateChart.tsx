"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import type { TrackingEntry } from "@/utils/storage"

interface ShippingDateChartProps {
  data: TrackingEntry[]
}

export function ShippingDateChart({ data }: ShippingDateChartProps) {
  const chartData = data.reduce((acc: { date: string; count: number }[], entry) => {
    if (entry.shippingDate) {
      const date = new Date(entry.shippingDate).toLocaleDateString()
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
        <Bar dataKey="count" fill="#82ca9d" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

