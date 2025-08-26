import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import redis from "@/lib/redis";
import { getObjectLink } from "@/lib/minio";

const FEDEX_API_URL = process.env.FEDEX_API_URL;
const API_KEY = process.env.NEXT_PUBLIC_FEDEX_API_KEY;
const SECRET_KEY = process.env.FEDEX_SECRET_KEY;

async function saveToken(token: string, expiresIn: number) {
  await redis.set("fedex_token", token, "EX", expiresIn);
}

async function getToken(): Promise<string | null> {
  return await redis.get("fedex_token");
}

function identifyCarier(trackingNumber: string): string {
  const patterns = {
    fedex: /(\b96\d{20}\b)|(\b\d{15}\b)|(\b\d{12}\b)/,
    ups: /(\b1Z[a-zA-Z0-9]{16}\b)/,
    usps: /(\b(94|93|92|91|94|95|70|14|23|03)\d{20}\b)|(\b\d{26}\b)|(\b\d{30}\b)/,
    dhl: /(\b\d{10}\b)|(\b\d{9}\b)/,
  };

  for (const [carrier, pattern] of Object.entries(patterns)) {
    if (pattern.test(trackingNumber)) {
      return carrier.toUpperCase();
    }
  }
  return "UNKNOWN";
}

export async function POST(request: Request) {
  try {
    const { trackingNumber } = await request.json();

    if (!trackingNumber) {
      return NextResponse.json(
        { error: "Tracking number is required" },
        { status: 400 }
      );
    }

    const carrier = identifyCarier(trackingNumber);

    if (!API_KEY || !SECRET_KEY) {
      throw new Error("Missing API credentials");
    }

    let accessToken = await getToken();

    if (!accessToken) {
      const authBody = new URLSearchParams();
      authBody.append("grant_type", "client_credentials");
      authBody.append("client_id", API_KEY);
      authBody.append("client_secret", SECRET_KEY);

      const authResponse = await fetch(`${FEDEX_API_URL}/oauth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: authBody,
      });

      if (!authResponse.ok) {
        throw new Error(`Auth request failed: ${authResponse.statusText}`);
      }

      const { access_token: newAccessToken } = await authResponse.json();
      const decoded = jwt.decode(newAccessToken, { complete: true }) as any;
      const expiry = decoded?.payload.exp ?? Date.now() / 1000 + 3600;
      const ttl = expiry - Math.floor(Date.now() / 1000);

      await saveToken(newAccessToken, ttl);
      accessToken = newAccessToken;
    }

    const trackingResponse = await fetch(
      `${FEDEX_API_URL}/track/v1/trackingnumbers`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-locale": "en_US",
        },
        body: JSON.stringify({
          trackingInfo: [
            {
              trackingNumberInfo: { trackingNumber },
            },
          ],
          includeDetailedScans: true,
        }),
      }
    );

    if (!trackingResponse.ok) {
      throw new Error(
        `Tracking request failed: ${trackingResponse.statusText}`
      );
    }

    const trackingData = await trackingResponse.json();
    return NextResponse.json(trackingData);
  } catch (error) {
    console.error("Error fetching FedEx tracking info:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  try {
    const whereCondition = status ? { statusId: parseInt(status) } : {};

    // Get total count for pagination metadata
    const totalCount = await prisma.tracking.count({
      where: whereCondition,
    });

    const packages = await prisma.tracking.findMany({
      where: whereCondition,
      include: {
        history: {
          orderBy: { date: "desc" },
        },
        status: true,
        images: true,
      },
      orderBy: { timestamp: "desc" },
      skip: offset,
      take: limit,
    });

    const processedPackages = await Promise.all(
      packages.map(async (pkg: { images: any[] }) => ({
        ...pkg,
        images: await Promise.all(
          pkg.images.map(async (image) => ({
            ...image,
            url: await getObjectLink(image.url),
          }))
        ),
      }))
    );

    return NextResponse.json({
      data: processedPackages,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching packages:", error);
    return NextResponse.json(
      { error: "Failed to fetch packages" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  await prisma.tracking.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
