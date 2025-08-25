import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const trackingNumber = searchParams.get("trackingNumber")

    if (!trackingNumber) {
      return NextResponse.json({ error: "Tracking number is required" }, { status: 400 })
    }

    // Efficient database query to check for existing tracking number
    const existingTracking = await prisma.tracking.findFirst({
      where: {
        trackingNumber: trackingNumber,
      },
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
      return NextResponse.json({
        exists: true,
        tracking: {
          id: existingTracking.id,
          kasId: existingTracking.kasId,
          number: existingTracking.trackingNumber,
          timestamp: existingTracking.createdAt.toISOString(),
          status: { id: existingTracking.statusId },
          fedexDeliveryStatus: existingTracking.fedexDeliveryStatus,
        },
      })
    }

    return NextResponse.json({ exists: false })
  } catch (error) {
    console.error("Error checking duplicate tracking:", error)
    return NextResponse.json({ error: "Failed to check duplicate tracking" }, { status: 500 })
  }
}
