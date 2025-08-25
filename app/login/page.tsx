"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [pin, setPin] = useState("")
  const [email, setEmail] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [isCodeSent, setIsCodeSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login, loginWithEmail, user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  if (user) {
    router.push('/')
  }

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await login(username, pin)
      toast({
        title: "Login successful",
        description: "Welcome back!",
      })
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Invalid username or PIN",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    if (!isCodeSent) {
      try {
        const response = await fetch("/api/send-verification-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        })
        if (response.ok) {
          setIsCodeSent(true)
          toast({
            title: "Verification code sent",
            description: "Please check your email for the verification code.",
          })
        } else {
          throw new Error("Failed to send verification code")
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to send verification code. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    } else {
      try {
        await loginWithEmail(email, verificationCode)
        toast({
          title: "Login successful",
          description: "Welcome back!",
        })
      } catch (error) {
        toast({
          title: "Login failed",
          description: "Invalid email or verification code",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value.length <= 4 && /^\d*$/.test(value)) {
      setPin(value)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
      <h1 className="text-4xl font-bold text-center mb-8">Kasandra Health</h1>
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-xl shadow-lg">
        <Tabs defaultValue="pin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pin">PIN Login</TabsTrigger>
            <TabsTrigger value="email">Email Login</TabsTrigger>
          </TabsList>
          <TabsContent value="pin">
            <form onSubmit={handlePinSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">Email</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pin">4-Digit PIN</Label>
                <Input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  pattern="\d{4}"
                  maxLength={4}
                  value={pin}
                  onChange={handlePinChange}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Log in with PIN"
                )}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="email">
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              {isCodeSent && (
                <div className="space-y-2">
                  <Label htmlFor="verificationCode">Verification Code</Label>
                  <Input
                    id="verificationCode"
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    required
                  />
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isCodeSent ? "Logging in..." : "Sending code..."}
                  </>
                ) : isCodeSent ? (
                  "Log in with Code"
                ) : (
                  "Send Verification Code"
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

