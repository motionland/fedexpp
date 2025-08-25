import { NextResponse } from "next/server"
import { getUserByEmail, getOTPByUserIdAndCode, deleteOTP } from "@/lib/db"
import { sign } from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function POST(req: Request) {
  const { email, otp } = await req.json()

  const user = getUserByEmail.get(email)
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }

  const storedOTP = getOTPByUserIdAndCode.get(user.id, otp, Date.now())
  if (!storedOTP) {
    return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 401 })
  }

  // Delete the used OTP
  deleteOTP.run(storedOTP.id)

  // Generate JWT token
  const token = sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "1d" })

  return NextResponse.json({ token })
}

