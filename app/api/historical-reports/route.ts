import { NextResponse } from "next/server"
import { getHistoricalReports } from "@/lib/db"

export async function GET() {
  const reports = getHistoricalReports.all(30) // Fetch last 30 reports
  return NextResponse.json(reports)
}

