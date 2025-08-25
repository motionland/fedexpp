"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  getInvitations,
  addInvitation,
  updateInvitation,
  removeInvitation,
  type Invitation,
  addUser,
  type UserWithPin,
} from "@/utils/storage"
import { Loader2 } from "lucide-react"

export function UserInvitation() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [newInvitation, setNewInvitation] = useState({ email: "", role: "", pin: "" })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setInvitations(getInvitations())
  }, [])

  const sendInvitationEmail = async (invitation: Invitation) => {
    try {
      const response = await fetch("/api/send-invitation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ invitation }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to send invitation email")
      }

      return true
    } catch (error) {
      console.error("Error sending invitation:", error)
      throw error
    }
  }

  const handleInvite = async () => {
    if (newInvitation.email && newInvitation.role && newInvitation.pin) {
      setIsLoading(true)

      const invitation: Invitation = {
        id: Date.now().toString(),
        email: newInvitation.email,
        role: newInvitation.role,
        status: "Pending",
      }

      const newUser: UserWithPin = {
        id: invitation.id,
        username: newInvitation.email.split("@")[0],
        role: newInvitation.role,
        pin: newInvitation.pin,
      }

      try {
        await sendInvitationEmail(invitation)
        addInvitation(invitation)
        addUser(newUser)
        setInvitations(getInvitations())
        setNewInvitation({ email: "", role: "", pin: "" })
        toast({
          title: "Invitation sent",
          description: `An invitation has been sent to ${newInvitation.email}.`,
        })
      } catch (error) {
        console.error("Error in handleInvite:", error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to send invitation. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleResendInvitation = async (invitation: Invitation) => {
    setIsLoading(true)
    try {
      const emailSent = await sendInvitationEmail(invitation)

      if (emailSent) {
        updateInvitation(invitation.id, { status: "Pending" })
        setInvitations(getInvitations())
        toast({
          title: "Invitation resent",
          description: "The invitation has been resent.",
        })
      } else {
        throw new Error("Failed to resend invitation email")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend invitation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRevokeInvitation = (id: string) => {
    removeInvitation(id)
    setInvitations(getInvitations())
    toast({
      title: "Invitation revoked",
      description: "The invitation has been revoked.",
    })
  }

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value.length <= 4 && /^\d*$/.test(value)) {
      setNewInvitation({ ...newInvitation, pin: value })
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-4">User Invitations</h2>
        <div className="flex gap-4 mb-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              id="email"
              value={newInvitation.email}
              onChange={(e) => setNewInvitation({ ...newInvitation, email: e.target.value })}
              placeholder="Enter email address"
              disabled={isLoading}
            />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="role">Role</Label>
            <Select
              value={newInvitation.role}
              onValueChange={(value) => setNewInvitation({ ...newInvitation, role: value })}
              disabled={isLoading}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="pin">4-Digit PIN</Label>
            <Input
              type="password"
              id="pin"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              value={newInvitation.pin}
              onChange={handlePinChange}
              placeholder="Enter 4-digit PIN"
              disabled={isLoading}
            />
          </div>
          <Button onClick={handleInvite} className="mt-auto" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Invitation"
            )}
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.map((invitation) => (
              <TableRow key={invitation.id}>
                <TableCell>{invitation.email}</TableCell>
                <TableCell>{invitation.role}</TableCell>
                <TableCell>{invitation.status}</TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResendInvitation(invitation)}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Resend"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRevokeInvitation(invitation.id)}
                    className="ml-2"
                    disabled={isLoading}
                  >
                    Revoke
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

