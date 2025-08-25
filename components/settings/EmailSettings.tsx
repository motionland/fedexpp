"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { getEmailSettings, setEmailSettings, type EmailSettings as EmailSettingsType } from "@/utils/storage"

export function EmailSettings() {
  const [settings, setSettings] = useState<EmailSettingsType>({
    MAILGUN_API_KEY: "",
    MAILGUN_DOMAIN: "",
    MAILGUN_FROM_EMAIL: "",
    NEXT_PUBLIC_APP_URL: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    const storedSettings = getEmailSettings()
    if (storedSettings) {
      setSettings(storedSettings)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSettings((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    setEmailSettings(settings)
    toast({
      title: "Settings saved",
      description: "Email settings have been updated successfully.",
    })
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold mb-4">Email Settings</h2>
      <div className="space-y-4">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="MAILGUN_API_KEY">Mailgun API Key</Label>
          <Input
            type="password"
            id="MAILGUN_API_KEY"
            name="MAILGUN_API_KEY"
            value={settings.MAILGUN_API_KEY}
            onChange={handleInputChange}
            placeholder="Enter Mailgun API Key"
          />
        </div>
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="MAILGUN_DOMAIN">Mailgun Domain</Label>
          <Input
            type="text"
            id="MAILGUN_DOMAIN"
            name="MAILGUN_DOMAIN"
            value={settings.MAILGUN_DOMAIN}
            onChange={handleInputChange}
            placeholder="Enter Mailgun Domain"
          />
        </div>
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="MAILGUN_FROM_EMAIL">From Email</Label>
          <Input
            type="email"
            id="MAILGUN_FROM_EMAIL"
            name="MAILGUN_FROM_EMAIL"
            value={settings.MAILGUN_FROM_EMAIL}
            onChange={handleInputChange}
            placeholder="Enter From Email"
          />
        </div>
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="NEXT_PUBLIC_APP_URL">App URL</Label>
          <Input
            type="url"
            id="NEXT_PUBLIC_APP_URL"
            name="NEXT_PUBLIC_APP_URL"
            value={settings.NEXT_PUBLIC_APP_URL}
            onChange={handleInputChange}
            placeholder="Enter App URL"
          />
        </div>
        <Button onClick={handleSave}>Save Settings</Button>
      </div>
    </div>
  )
}

