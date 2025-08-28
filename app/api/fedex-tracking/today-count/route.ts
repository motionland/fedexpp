import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Force this route to be dynamic
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Get today's date at midnight
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Get tomorrow's date at midnight (to get all of today)
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    // Count all packages created today
    const todayCount = await prisma.tracking.count({
      where: {
        timestamp: {
          gte: todayStart,
          lt: todayEnd,
        },
      },
    });

    return NextResponse.json({ count: todayCount });
  } catch (error) {
    console.error("Error fetching today's count:", error);
    return NextResponse.json(
      { error: "Failed to fetch today's count" },
      { status: 500 }
    );
  }
}
