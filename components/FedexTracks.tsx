"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

interface TrackingDetails {
  status: string
  deliveryDate: string
  shippingDate: string
  transitTime: string
  destination: string
  origin: string
}

export function FedexTracks() {
  const [trackingNumber, setTrackingNumber] = useState("")
  const [trackingDetails, setTrackingDetails] = useState<TrackingDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trackingNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter a tracking number.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setError(null)
    setTrackingDetails(null)

    try {
      const response = await fetch("/api/fedex-tracking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ trackingNumber }),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch tracking information")
      }

      const data = await response.json()

      if (data.output && data.output.completeTrackResults && data.output.completeTrackResults[0].trackResults) {
        const trackInfo = data.output.completeTrackResults[0]?.trackResults[0];

        setTrackingDetails({
          status: trackInfo.latestStatusDetail.statusByLocale || "Unknown",
          deliveryDate: trackInfo.dateAndTimes.find((d: any) => d.type === "ACTUAL_PICKUP")?.dateTime
            ? new Date(trackInfo.dateAndTimes.find((d: any) => d.type === "ACTUAL_PICKUP").dateTime).toISOString().replace('T', ' ').substring(0, 16)
            : "-",
          shippingDate: trackInfo.dateAndTimes.find((d: any) => d.type === "SHIP")?.dateTime
            ? new Date(trackInfo.dateAndTimes.find((d: any) => d.type === "SHIP").dateTime).toISOString().replace('T', ' ').substring(0, 16)
            : "-",
          transitTime: "N/A", // Bisa diubah jika ada transit time di API
          destination: `${trackInfo.recipientInformation.address.city}, ${trackInfo.recipientInformation.address.stateOrProvinceCode}, ${trackInfo.recipientInformation.address.countryName}`,
          origin: `${trackInfo.originLocation.locationContactAndAddress.address.city}, ${trackInfo.originLocation.locationContactAndAddress.address.stateOrProvinceCode}, ${trackInfo.originLocation.locationContactAndAddress.address.countryName}`,
        })
      } else {
        setError("No tracking information available for this number.")
      }
    } catch (error) {
      console.error("Error fetching tracking info:", error)
      setError("Failed to fetch tracking information. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="flex gap-4">
        <Input
          type="text"
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          placeholder="Enter FedEx tracking number"
          className="flex-grow"
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Tracking...
            </>
          ) : (
            "Track"
          )}
        </Button>
      </form>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {trackingDetails && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Delivery Date</TableHead>
              <TableHead>Shipping Date</TableHead>
              <TableHead>Transit Time</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Origin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>{trackingDetails.status}</TableCell>
              <TableCell>{trackingDetails.deliveryDate}</TableCell>
              <TableCell>{trackingDetails.shippingDate}</TableCell>
              <TableCell>{trackingDetails.transitTime}</TableCell>
              <TableCell>{trackingDetails.destination}</TableCell>
              <TableCell>{trackingDetails.origin}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )}
    </div>
  )
}

