"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getTrackingEntries, type TrackingEntry } from "@/utils/storage"

export function DeliveryShippingInfo() {
  const [entries, setEntries] = useState<TrackingEntry[]>([])

  useEffect(() => {
    const loadTrackingEntries = async () => {
      const entries = await getTrackingEntries()

      setEntries(entries)
    }

    loadTrackingEntries()
  }, [])

  const sortedEntries = entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Delivery and Shipping Information</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tracking Number</TableHead>
              <TableHead>Shipping Date</TableHead>
              <TableHead>Delivery Date</TableHead>
              <TableHead>Transit Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedEntries.slice(0, 10).map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{entry.number}</TableCell>
                <TableCell>{entry.shippingDate || "N/A"}</TableCell>
                <TableCell>{entry.deliveryDate || "N/A"}</TableCell>
                <TableCell>{entry.transitTime || "N/A"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

