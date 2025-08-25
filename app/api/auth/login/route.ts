import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
// import bcrypt from "bcryptjs";

import { sendOTP } from "@/lib/email"; // You'll need to implement this function to send emails

export async function POST(req: Request) {
  const { email, pin } = await req.json();

  const user = await prisma.team.findUnique({
    where: { email, pin },
  });

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // const isValidPassword = await bcrypt.compare(password, user.password)
  // if (!isValidPassword) {
  //   return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  // }

  // Generate and store OTP
  // const otp = Math.floor(100000 + Math.random() * 900000).toString()
  // const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes from now
  // createOTP.run(user.id, otp, expiresAt)

  // // Send OTP via email
  // await sendOTP(email, otp)

  return NextResponse.json(user);
}
