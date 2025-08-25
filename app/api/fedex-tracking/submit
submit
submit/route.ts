import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const start = Date.now()

  try {
    const body = await request.json()
    const { trackingNumber, checkDuplicate = true } = body

    if (!trackingNumber) {
      return NextResponse.json({ error: "Tracking number is required" }, { status: 400 })
    }

    // Check for duplicate if requested
    if (checkDuplicate) {
      const existingTracking = await prisma.tracking.findFirst({
        where: { trackingNumber },
        select: {
          id: true,
          kasId: true,
          trackingNumber: true,
          createdAt: true,
          statusId: true,
          fedexDeliveryStatus: true,
        },
      })

      if (existingTracking) {
        return NextResponse.json(
          {
            isDuplicate: true,
            existingEntry: {
              id: existingTracking.id,
              kasId: existingTracking.kasId,
              number: existingTracking.trackingNumber,
              timestamp: existingTracking.createdAt.toISOString(),
              status: { id: existingTracking.statusId },
              fedexDeliveryStatus: existingTracking.fedexDeliveryStatus,
            },
          },
          { status: 409 },
        )
      }
    }

    // Fetch FedEx tracking data
    const fedexResponse = await fetch("/api/fedex-tracking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackingNumber }),
    })

    if (!fedexResponse.ok) {
      throw new Error("Failed to fetch tracking information from FedEx")
    }

    const fedexData = await fedexResponse.json()

    if (!fedexData.output?.completeTrackResults?.[0]?.trackResults) {
      throw new Error("Invalid tracking data received")
    }

    // Process and save tracking data
    const savedTracking = await fetch("/api/fedex-packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fedexData),
    })

    if (!savedTracking.ok) {
      throw new Error("Failed to save tracking data")
    }

    const tracking = await savedTracking.json()

    console.log("Total request duration:", Date.now() - start, "ms")

    return NextResponse.json({
      success: true,
      tracking,
      message: "Tracking information processed successfully",
    })
  } catch (error) {
    console.error("Error in submit route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process tracking information" },
      { status: 500 },
    )
  }
}
