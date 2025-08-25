import formData from "form-data"
import Mailgun from "mailgun.js"
import { getEmailSettings } from "@/utils/storage"

const mailgun = new Mailgun(formData)

export async function sendOTP(email: string, otp: string) {
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

  const data = {
    from: MAILGUN_FROM_EMAIL,
    to: email,
    subject: "Your Kasandra Health Login Verification Code",
    text: `Your verification code is: ${otp}`,
  }

  try {
    await mg.messages.create(MAILGUN_DOMAIN, data)
  } catch (error) {
    console.error("Error sending OTP:", error)
    throw error
  }
}

