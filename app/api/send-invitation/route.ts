import { NextResponse } from "next/server"
import formData from "form-data"
import Mailgun from "mailgun.js"
import type { Invitation } from "@/utils/storage"
import { getEmailSettings } from "@/utils/storage"

const mailgun = new Mailgun(formData)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { invitation }: { invitation: Invitation } = body

    const emailSettings = getEmailSettings()

    if (!emailSettings) {
      throw new Error("Email settings not configured")
    }

    const { MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_FROM_EMAIL, NEXT_PUBLIC_APP_URL } = emailSettings

    if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN || !MAILGUN_FROM_EMAIL || !NEXT_PUBLIC_APP_URL) {
      throw new Error("Incomplete email settings")
    }

    const mg = mailgun.client({
      username: "api",
      key: MAILGUN_API_KEY,
      url: "https://api.mailgun.net",
    })

    const data = {
      from: MAILGUN_FROM_EMAIL,
      to: invitation.email,
      subject: "Invitation to Join Receiving Track Logs",
      template: "user_invitation",
      "h:X-Mailgun-Variables": JSON.stringify({
        username: invitation.email.split("@")[0],
        role: invitation.role,
        invitationLink: `${NEXT_PUBLIC_APP_URL}/accept-invitation?id=${invitation.id}`,
      }),
    }

    const response = await mg.messages.create(MAILGUN_DOMAIN, data)

    if (response.status !== 200) {
      throw new Error(`Mailgun API error: ${response.status}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error sending invitation:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 },
    )
  }
}

