import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const permissions = await prisma.permission.findMany();

  return NextResponse.json(permissions);
}