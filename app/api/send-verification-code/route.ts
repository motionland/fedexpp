import { NextResponse } from "next/server"
import formData from "form-data"
import Mailgun from "mailgun.js"
import { getEmailSettings, addVerificationCode } from "@/utils/storage"

const mailgun = new Mailgun(formData)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    const emailSettings = getEmailSettings()

    if (!emailSettings) {
      throw new Error("Email settings not configured")
    }

    const { MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_FROM_EMAIL } = emailSettings

    if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN || !MAILGUN_FROM_EMAIL) {
      throw new Error("Incomplete email settings")
    }

    const mg = mailgun.client({
      username: "api",
      key: MAILGUN_API_KEY,
      url: "https://api.mailgun.net",
    })

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    addVerificationCode(email, verificationCode)

    const data = {
      from: MAILGUN_FROM_EMAIL,
      to: email,
      subject: "Your Kasandra Health Login Verification Code",
      text: `Your verification code is: ${verificationCode}`,
    }

    const response = await mg.messages.create(MAILGUN_DOMAIN, data)

    if (response.status !== 200) {
      throw new Error(`Mailgun API error: ${response.status}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error sending verification code:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 },
    )
  }
}

