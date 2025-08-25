import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();

  const fedexData = body.output.completeTrackResults[0].trackResults[0];
  const trackingNumber = fedexData.trackingNumberInfo.trackingNumber;
  const courier = fedexData.trackingNumberInfo.carrierCode;
  const status = fedexData.latestStatusDetail.description;

  const route = `${fedexData.shipperInformation.address.countryCode} → ${fedexData.recipientInformation.address.countryCode}`;
  const weight = parseFloat(
    fedexData.packageDetails.weightAndDimensions.weight[1].value
  );
  const lastUpdate = new Date(fedexData.scanEvents[0].date);
  const shippingDate = new Date(
    fedexData.dateAndTimes.find((dt: any) => dt.type === "SHIP")?.dateTime || ""
  );
  const deliveryDateStr = fedexData?.estimatedDeliveryTimeWindow?.window?.begins 
    || fedexData?.dateAndTimes?.find((dt: any) => dt.type === "ACTUAL_DELIVERY")?.dateTime 
    || null;

  const deliveryDate = deliveryDateStr ? new Date(deliveryDateStr) : null;
  
  let transitTime = null;
  if (!isNaN(shippingDate.getTime())) {
    const diffMs = Date.now() - shippingDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
    if (diffHours < 24) {
      transitTime = `${diffHours} hours`;
    } else if (diffHours < 24 * 7) {
      const diffDays = Math.floor(diffHours / 24);
      transitTime = `${diffDays} days`;
    } else {
      const diffWeeks = Math.floor(diffHours / (24 * 7));
      transitTime = `${diffWeeks} weeks`;
    }
  }

  const originAddress = fedexData.shipperInformation.address;
  const origin = `${originAddress.city}, ${originAddress.stateOrProvinceCode}, ${originAddress.countryName}`;

  const destAddress = fedexData.recipientInformation.address;
  const destination = `${destAddress.city}, ${destAddress.stateOrProvinceCode}, ${destAddress.countryName}`;

  try {
    const tracking = await prisma.tracking.create({
      data: {
        kasId: generateKasId(),
        courier: courier,
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
        history: {
          create: fedexData.scanEvents.map((event:any): any => ({
            date: new Date(event.date),
            status: event.eventDescription,
            time: new Date(event.date).toLocaleTimeString(),
            location: `${event.scanLocation.city}, ${event.scanLocation.countryCode}`,
            description: event.exceptionDescription || event.eventDescription,
          })),
        },
      },
    });

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

export async function PUT(request: Request) {
  const { id, statusId } = await request.json();

  await prisma.tracking.update({
    where: { id: parseInt(id) },
    data: { statusId: statusId },
  });

  return NextResponse.json({ success: true });
}
