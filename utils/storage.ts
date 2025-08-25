const STORAGE_KEY = "fedexTrackingNumbers"
const CUSTOM_STATUS_TYPES_KEY = "customStatusTypes"
const ROLES_KEY = "roles"
const INVITATIONS_KEY = "invitations"
const USERS_KEY = "users"
const EMAIL_SETTINGS_KEY = "emailSettings"
const VERIFICATION_CODES_KEY = "verificationCodes"

export interface ImageType {
  id: number
  url: string
  createdAt: string
  trackingId: number
}

export interface TrackingEntry {
  id: string
  kasId: string
  number: string
  trackingNumber?: string
  timestamp: string
  imageData: string[]
  status: CustomStatusType
  statusId?: string
  deliveryDate: string
  shippingDate: string
  transitTime: string
  destination: string
  origin: string
  fedexDeliveryStatus: string
  images: ImageType[]
  history: HistoryTracking[]
}

export interface CustomStatusType {
  id: string
  name: string
  description?: string
}

export interface HistoryTracking {
  id: string
  trackingId: string
  location: string
  description: string
  date: any
  time: any
  status: any
}

export async function addTrackingNumber(data: any) {
  try {
    const response = await fetch("/api/fedex-packages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error("Failed to save tracking information")
    }
    return await response.json()
  } catch (error) {
    console.error("Error adding FedEx tracking info:", error)
    return error
  }
}

export function getCSTDate(date: Date): Date {
  // Convert a Date object into CST-localized string and back to Date
  const cstString = date.toLocaleString("en-US", { timeZone: "America/Chicago" })
  return new Date(cstString) // Will be treated as local time
}

export async function updateTrackingNumber(id: string, updates: Partial<TrackingEntry>) {
  try {
    const response = await fetch(`/api/fedex-packages`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
        ...updates,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to update tracking information")
    }

    return { message: "update tracking success" }
  } catch (error) {
    console.error("Error updating FedEx tracking info:", error)
    return error
  }
}

export async function removeTrackingNumber(id: string) {
  try {
    const response = await fetch(`/api/fedex-tracking`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    })

    if (!response.ok) {
      throw new Error("Failed to delete tracking information")
    }

    return { message: "remove tracking success" }
  } catch (error) {
    console.error("Error deleting FedEx tracking info:", error)
    return error
  }

  // const entries = await getTrackingEntries()
  // const updatedEntries = entries.filter((entry) => entry.id !== id)
  // localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries))
  window.dispatchEvent(new Event("storage"))
}

export async function getTrackingEntries(): Promise<TrackingEntry[]> {
  try {
    const response = await fetch("/api/fedex-tracking", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch tracking information")
    }

    let data = await response.json()

    data = data.map((r: any) => {
      return {
        ...r,
        number: r.trackingNumber,
        imageData: r.capturedImages ? JSON.parse(r.capturedImages) : [],
      }
    })
    return data
  } catch (error) {
    console.error("Error fetching FedEx tracking info:", error)
    return []
  }
}

export async function addImageToTracking(id: string, imageData: string) {
  const entries = await getTrackingEntries()
  const updatedEntries = entries.map((entry) =>
    entry.id === id ? { ...entry, imageData: [...entry.imageData, imageData] } : entry,
  )
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries))
  window.dispatchEvent(new Event("storage"))
}

export async function checkDuplicateTracking(trackingNumber: string): Promise<TrackingEntry | null> {
  try {
    const response = await fetch(
      `/api/fedex-tracking/check-duplicate?trackingNumber=${encodeURIComponent(trackingNumber)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.exists ? data.tracking : null
  } catch (error) {
    console.error("Error checking duplicate tracking:", error)
    return null
  }
}

export function getCustomStatusTypes(): CustomStatusType[] {
  const storedTypes = localStorage.getItem(CUSTOM_STATUS_TYPES_KEY)
  return storedTypes
    ? JSON.parse(storedTypes)
    : [
        { id: 1, name: "Pending" },
        { id: 2, name: "In Transit" },
        { id: 3, name: "Received" },
        { id: 4, name: "Delivered" },
      ]
}

export function setCustomStatusTypes(types: CustomStatusType[]) {
  localStorage.setItem(CUSTOM_STATUS_TYPES_KEY, JSON.stringify(types))
  window.dispatchEvent(new Event("storage"))
}

export function updateCustomStatusType(id: string, updatedStatusType: CustomStatusType) {
  const statusTypes = getCustomStatusTypes()
  const updatedStatusTypes = statusTypes.map((statusType) => (statusType.id === id ? updatedStatusType : statusType))
  setCustomStatusTypes(updatedStatusTypes)
}

export interface Role {
  id: string
  name: string
  permissions: string[]
}

export interface Invitation {
  id: string
  email: string
  role: string
  status: "Pending" | "Accepted" | "Expired"
}

export function getRoles(): Role[] {
  const storedRoles = localStorage.getItem(ROLES_KEY)
  return storedRoles ? JSON.parse(storedRoles) : []
}

export function setRoles(roles: Role[]) {
  localStorage.setItem(ROLES_KEY, JSON.stringify(roles))
  window.dispatchEvent(new Event("storage"))
}

export function getInvitations(): Invitation[] {
  const storedInvitations = localStorage.getItem(INVITATIONS_KEY)
  return storedInvitations ? JSON.parse(storedInvitations) : []
}

export function setInvitations(invitations: Invitation[]) {
  localStorage.setItem(INVITATIONS_KEY, JSON.stringify(invitations))
  window.dispatchEvent(new Event("storage"))
}

export function addInvitation(invitation: Invitation) {
  const invitations = getInvitations()
  invitations.push(invitation)
  setInvitations(invitations)
}

export function updateInvitation(id: string, updates: Partial<Invitation>) {
  const invitations = getInvitations()
  const updatedInvitations = invitations.map((invitation) =>
    invitation.id === id ? { ...invitation, ...updates } : invitation,
  )
  setInvitations(updatedInvitations)
}

export function removeInvitation(id: string) {
  const invitations = getInvitations()
  const updatedInvitations = invitations.filter((invitation) => invitation.id !== id)
  setInvitations(updatedInvitations)
}

export interface UserWithPin {
  id: string
  username: string
  role: string
  pin: string
}

export function getUsers(): UserWithPin[] {
  const storedUsers = localStorage.getItem(USERS_KEY)
  return storedUsers ? JSON.parse(storedUsers) : []
}

export function setUsers(users: UserWithPin[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
  window.dispatchEvent(new Event("storage"))
}

export function addUser(user: UserWithPin) {
  const users = getUsers()
  users.push(user)
  setUsers(users)
}

export async function getUserByUsername(username: string, pin: string): Promise<UserWithPin | undefined> {
  try {
    const request = await fetch(`/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: username, pin }),
    })

    if (!request.ok) {
      throw new Error("Invalid credentials")
    }

    const user = await request.json()
    return user
  } catch (error) {
    console.error("Error fetching user by username:", error)
    return undefined
  }
  // return users.find((user) => user.username === username)
}

export function updateUser(username: string, updates: Partial<UserWithPin>) {
  const users = getUsers()
  const updatedUsers = users.map((user) => (user.username === username ? { ...user, ...updates } : user))
  setUsers(updatedUsers)
}

export interface DailyScanReport {
  date: string
  scannedItems: number
  trackingDetails: TrackingEntry[]
}

export async function getHistoricalScanReports(days = 10): Promise<DailyScanReport[]> {
  const entries = await getTrackingEntries()
  const reports: DailyScanReport[] = []

  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const formattedDate = date.toISOString().split("T")[0]

    const dailyEntries = entries.filter((entry) => entry.timestamp.startsWith(formattedDate))

    reports.push({
      date: formattedDate,
      scannedItems: dailyEntries.length,
      trackingDetails: dailyEntries.map((entry) => ({
        ...entry,
      })),
    })
  }

  return reports
}

export interface EmailSettings {
  MAILGUN_API_KEY: string
  MAILGUN_DOMAIN: string
  MAILGUN_FROM_EMAIL: string
  NEXT_PUBLIC_APP_URL: string
}

export function getEmailSettings(): EmailSettings | null {
  const storedSettings = localStorage.getItem(EMAIL_SETTINGS_KEY)
  return storedSettings ? JSON.parse(storedSettings) : null
}

export function setEmailSettings(settings: EmailSettings) {
  localStorage.setItem(EMAIL_SETTINGS_KEY, JSON.stringify(settings))
  window.dispatchEvent(new Event("storage"))
}

interface VerificationCode {
  email: string
  code: string
  expiresAt: number
}

export function addVerificationCode(email: string, code: string) {
  const verificationCodes = getVerificationCodes()
  const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes expiration
  verificationCodes.push({ email, code, expiresAt })
  localStorage.setItem(VERIFICATION_CODES_KEY, JSON.stringify(verificationCodes))
}

function getVerificationCodes(): VerificationCode[] {
  const storedCodes = localStorage.getItem(VERIFICATION_CODES_KEY)
  return storedCodes ? JSON.parse(storedCodes) : []
}

export function verifyCode(email: string, code: string): boolean {
  const verificationCodes = getVerificationCodes()
  const index = verificationCodes.findIndex((vc) => vc.email === email && vc.code === code && vc.expiresAt > Date.now())
  if (index !== -1) {
    verificationCodes.splice(index, 1)
    localStorage.setItem(VERIFICATION_CODES_KEY, JSON.stringify(verificationCodes))
    return true
  }
  return false
}

export function getUserByEmail(email: string): UserWithPin | undefined {
  const users = getUsers()
  return users.find((user) => user.username === email.split("@")[0])
}
