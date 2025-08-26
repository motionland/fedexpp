import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const start = Date.now();

  try {
    const body = await request.json();

    if (!body.output?.completeTrackResults?.[0]?.trackResults?.[0]) {
      return NextResponse.json(
        { error: "Invalid FedEx tracking data structure" },
        { status: 400 }
      );
    }

    const fedexData = body.output.completeTrackResults[0].trackResults[0];
    const trackingNumber = fedexData.trackingNumberInfo.trackingNumber;
    const courier = fedexData.trackingNumberInfo.carrierCode;
    const status = fedexData.latestStatusDetail?.description || "Unknown";

    const route = `${
      fedexData.shipperInformation?.address?.countryCode || "Unknown"
    } → ${fedexData.recipientInformation?.address?.countryCode || "Unknown"}`;

    let weight = null;
    try {
      weight = Number.parseFloat(
        fedexData?.packageDetails?.weightAndDimensions?.weight?.[1]?.value
      );
      if (isNaN(weight)) weight = null;
    } catch {}

    const lastUpdate = fedexData.scanEvents?.[0]?.date
      ? new Date(fedexData.scanEvents[0].date)
      : new Date();
    const shippingDateStr = fedexData.dateAndTimes?.find(
      (dt: any) => dt.type === "SHIP"
    )?.dateTime;
    const shippingDate =
      shippingDateStr && !isNaN(Date.parse(shippingDateStr))
        ? new Date(shippingDateStr)
        : null;

    const deliveryDateStr =
      fedexData?.estimatedDeliveryTimeWindow?.window?.begins ||
      fedexData?.dateAndTimes?.find((dt: any) => dt.type === "ACTUAL_DELIVERY")
        ?.dateTime ||
      null;
    const deliveryDate =
      deliveryDateStr && !isNaN(Date.parse(deliveryDateStr))
        ? new Date(deliveryDateStr)
        : null;

    let transitTime = null;
    if (shippingDate && !isNaN(shippingDate.getTime())) {
      const diffMs = Date.now() - shippingDate.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      transitTime =
        diffHours < 24
          ? `${diffHours} hours`
          : diffHours < 24 * 7
          ? `${Math.floor(diffHours / 24)} days`
          : `${Math.floor(diffHours / (24 * 7))} weeks`;
    }

    const originAddress = fedexData.shipperInformation?.address;
    const origin = originAddress
      ? `${originAddress.city || "Unknown"}, ${
          originAddress.stateOrProvinceCode || "Unknown"
        }, ${originAddress.countryName || "Unknown"}`
      : "Unknown";

    const destAddress = fedexData.recipientInformation?.address;
    const destination = destAddress
      ? `${destAddress.city || "Unknown"}, ${
          destAddress.stateOrProvinceCode || "Unknown"
        }, ${destAddress.countryName || "Unknown"}`
      : "Unknown";

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
      });

      // Prepare scan events for batch insert
      const scanEvents = (fedexData.scanEvents || []).map((event: any) => ({
        trackingId: tracking.id,
        date: new Date(event.date),
        status: event.eventDescription || "Unknown",
        time: new Date(event.date).toLocaleTimeString(),
        location: `${event.scanLocation?.city || "Unknown"}, ${
          event.scanLocation?.countryCode || "Unknown"
        }`,
        description:
          event.exceptionDescription || event.eventDescription || "Unknown",
      }));

      // Batch insert scan events if any exist
      if (scanEvents.length > 0) {
        await tx.trackingHistory.createMany({
          data: scanEvents,
        });
      }

      return tracking;
    });

    console.log("Database operation duration:", Date.now() - start, "ms");

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error saving tracking data:", error);

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return NextResponse.json(
          { error: "Tracking number already exists" },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to save tracking data" },
      { status: 500 }
    );
  }
}

function generateKasId(): string {
  const prefix = "K";
  const randomPart = Math.random().toString().slice(2, 11); // 9 digits
  return `${prefix}-${randomPart.slice(0, 3)}-${randomPart.slice(3)}`;
}
