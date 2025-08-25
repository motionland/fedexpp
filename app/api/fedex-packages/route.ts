import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const start = Date.now()

  try {
    const body = await request.json()

    if (!body.output?.completeTrackResults?.[0]?.trackResults?.[0]) {
      return NextResponse.json({ error: "Invalid FedEx tracking data structure" }, { status: 400 })
    }

    const fedexData = body.output.completeTrackResults[0].trackResults[0]
    const trackingNumber = fedexData.trackingNumberInfo.trackingNumber
    const courier = fedexData.trackingNumberInfo.carrierCode
    const status = fedexData.latestStatusDetail.description

    const route = `${fedexData.shipperInformation.address.countryCode} → ${fedexData.recipientInformation.address.countryCode}`

    let weight = null
    try {
      weight = Number.parseFloat(fedexData?.packageDetails?.weightAndDimensions?.weight?.[1]?.value)
      if (isNaN(weight)) weight = null
    } catch {}

    const lastUpdate = new Date(fedexData.scanEvents[0].date)
    const shippingDate = new Date(fedexData.dateAndTimes.find((dt: any) => dt.type === "SHIP")?.dateTime || "")
    const deliveryDateStr =
      fedexData?.estimatedDeliveryTimeWindow?.window?.begins ||
      fedexData?.dateAndTimes?.find((dt: any) => dt.type === "ACTUAL_DELIVERY")?.dateTime ||
      null
    const deliveryDate = deliveryDateStr ? new Date(deliveryDateStr) : null

    let transitTime = null
    if (!isNaN(shippingDate.getTime())) {
      const diffMs = Date.now() - shippingDate.getTime()
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      transitTime =
        diffHours < 24
          ? `${diffHours} hours`
          : diffHours < 24 * 7
            ? `${Math.floor(diffHours / 24)} days`
            : `${Math.floor(diffHours / (24 * 7))} weeks`
    }

    const originAddress = fedexData.shipperInformation.address
    const origin = `${originAddress.city}, ${originAddress.stateOrProvinceCode}, ${originAddress.countryName}`

    const destAddress = fedexData.recipientInformation.address
    const destination = `${destAddress.city}, ${destAddress.stateOrProvinceCode}, ${destAddress.countryName}`

    // Use a transaction for better performance and data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create main tracking record
      const tracking = await tx.tracking.create({
        data: {
          kasId: generateKasId(),
          courier,
          trackingNumber,
          statusId: 4,
          route,
          weight,
          shippingDate,
          deliveryDate,
          fedexDeliveryStatus: status,
          lastUpdate,
          transitTime,
          origin,
          destination,
        },
      })

      // Prepare scan events for batch insert
      const scanEvents = fedexData.scanEvents.map((event: any) => ({
        trackingId: tracking.id,
        date: new Date(event.date),
        status: event.eventDescription,
        time: new Date(event.date).toLocaleTimeString(),
        location: `${event.scanLocation.city}, ${event.scanLocation.countryCode}`,
        description: event.exceptionDescription || event.eventDescription,
      }))

      // Batch insert scan events if any exist
      if (scanEvents.length > 0) {
        await tx.trackingHistory.createMany({
          data: scanEvents,
          skipDuplicates: true, // Prevent duplicate entries
        })
      }

      return tracking
    })

    console.log("Database operation duration:", Date.now() - start, "ms")

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("Error saving tracking data:", error)

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return NextResponse.json({ error: "Tracking number already exists" }, { status: 409 })
      }
    }

    return NextResponse.json({ error: "Failed to save tracking data" }, { status: 500 })
  }
}

function generateKasId(): string {
  const prefix = "K"
  const randomPart = Math.random().toString().slice(2, 11) // 9 digits
  return `${prefix}-${randomPart.slice(0, 3)}-${randomPart.slice(3)}`
}
