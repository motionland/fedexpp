import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const start = Date.now();
  const body = await request.json();

  const fedexData = body.output.completeTrackResults[0].trackResults[0];
  const trackingNumber = fedexData.trackingNumberInfo.trackingNumber;
  const courier = fedexData.trackingNumberInfo.carrierCode;
  const status = fedexData.latestStatusDetail.description;

  const route = `${fedexData.shipperInformation.address.countryCode} → ${fedexData.recipientInformation.address.countryCode}`;

  let weight = null;
  try {
    weight = parseFloat(fedexData?.packageDetails?.weightAndDimensions?.weight?.[1]?.value);
    if (isNaN(weight)) weight = null;
  } catch {}

  const lastUpdate = new Date(fedexData.scanEvents[0].date);
  const shippingDate = new Date(
    fedexData.dateAndTimes.find((dt: any) => dt.type === "SHIP")?.dateTime || ""
  );
  const deliveryDateStr =
    fedexData?.estimatedDeliveryTimeWindow?.window?.begins ||
    fedexData?.dateAndTimes?.find((dt: any) => dt.type === "ACTUAL_DELIVERY")?.dateTime ||
    null;
  const deliveryDate = deliveryDateStr ? new Date(deliveryDateStr) : null;

  let transitTime = null;
  if (!isNaN(shippingDate.getTime())) {
    const diffMs = Date.now() - shippingDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    transitTime =
      diffHours < 24
        ? `${diffHours} hours`
        : diffHours < 24 * 7
        ? `${Math.floor(diffHours / 24)} days`
        : `${Math.floor(diffHours / (24 * 7))} weeks`;
  }

  const originAddress = fedexData.shipperInformation.address;
  const origin = `${originAddress.city}, ${originAddress.stateOrProvinceCode}, ${originAddress.countryName}`;

  const destAddress = fedexData.recipientInformation.address;
  const destination = `${destAddress.city}, ${destAddress.stateOrProvinceCode}, ${destAddress.countryName}`;

  try {
    // 1. Create main tracking record (no history yet)
    const tracking = await prisma.tracking.create({
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

    // 2. Insert scanEvents via createMany (batch insert)
    const scanEvents = fedexData.scanEvents.map((event: any) => ({
      trackingId: tracking.id,
      date: new Date(event.date),
      status: event.eventDescription,
      time: new Date(event.date).toLocaleTimeString(),
      location: `${event.scanLocation.city}, ${event.scanLocation.countryCode}`,
      description: event.exceptionDescription || event.eventDescription,
    }));

    if (scanEvents.length > 0) {
      await prisma.trackingHistory.createMany({ data: scanEvents });
    }

    console.log("Request duration:", Date.now() - start, "ms");

    return NextResponse.json(tracking, { status: 201 });
  } catch (error) {
    console.error("Error saving tracking data:", error);
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
