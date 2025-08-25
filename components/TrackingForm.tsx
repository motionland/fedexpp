"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import {
  type TrackingEntry,
  getCustomStatusTypes,
  type CustomStatusType,
  addTrackingEntry, // Declare the variable here
} from "../utils/storage"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUppy } from "../contexts/UppyContext"
import { useRealtime } from "../contexts/RealtimeContext"

import "@uppy/core/dist/style.min.css"
import "@uppy/dashboard/dist/style.min.css"
import "@uppy/webcam/dist/style.min.css"
import "@uppy/image-editor/dist/style.min.css"
import { useFetch } from "@/hooks/useFetch"
import { useRouter, useSearchParams } from "next/navigation"
import ImageUploadDialog from "./ImageUploadDialog"

export default function TrackingForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { refetch } = useFetch("/api/fedex-tracking")

  const [trackingNumber, setTrackingNumber] = useState("")
  const [status, setStatus] = useState<string>("Received")
  const [statusQuery, setStatusQuery] = useState<string>("")
  const [capturedImages, setCapturedImages] = useState<string[]>([])
  const { toast } = useToast()
  const [duplicate, setDuplicate] = useState<TrackingEntry | null>(null)
  const [isInputDisabled, setIsInputDisabled] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [customStatusTypes, setCustomStatusTypes] = useState<CustomStatusType[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  const uppy = useUppy()
  const { emitPackageAdded } = useRealtime()

  useEffect(() => {
    inputRef.current?.focus()
    setCustomStatusTypes(getCustomStatusTypes())
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())

    if (statusQuery) {
      params.set("status", statusQuery)
    } else {
      params.delete("status")
    }

    router.replace(`?${params.toString()}`)
  }, [statusQuery, router, searchParams])

  const uploadBlobImagesId = async (blobUrls: string[], id: string) => {
    try {
      const formData = new FormData()
      formData.append("trackingId", id)

      await Promise.all(
        blobUrls.map(async (blobUrl) => {
          const response = await fetch(blobUrl)
          const blob = await response.blob()

          const mimeToExtension: Record<string, string> = {
            "image/png": "png",
            "image/jpeg": "jpg",
            "image/webp": "webp",
            "image/gif": "gif",
          }

          const extension = mimeToExtension[blob.type] || "bin"
          const uniqueFilename = `uploaded_${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${extension}`

          const file = new File([blob], uniqueFilename, { type: blob.type })

          formData.append("file", file)
        }),
      )

      await fetch("/api/fedex-tracking/upload", {
        method: "POST",
        body: formData,
      })

      refetch()
    } catch (error) {
      console.error("Upload failed:", error)
    } finally {
      if (uppy) {
        uppy.getFiles().forEach((file) => uppy.removeFile(file.id))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!trackingNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter a tracking number.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Check for duplicate and add tracking in a single optimized call
      const response = await fetch("/api/fedex-tracking/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trackingNumber: trackingNumber.trim(),
          status,
          checkDuplicate: true,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.isDuplicate) {
          setDuplicate(data.existingEntry)
          setIsInputDisabled(true)
          return
        }
        throw new Error(data.error || "Failed to process tracking information")
      }

      // Handle successful submission
      if (data.tracking && capturedImages.length > 0) {
        await uploadBlobImagesId(capturedImages, data.tracking.id)
      }

      resetForm()
      refetch()

      toast({
        title: "Tracking number added",
        description: `${trackingNumber} has been logged successfully.`,
      })

      emitPackageAdded()
    } catch (error) {
      console.error("Error processing tracking info:", error)
      setError(error instanceof Error ? error.message : "Failed to process tracking information. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setTrackingNumber("")
    setStatus("Received")
    setCapturedImages([])
    setDuplicate(null)
    setIsInputDisabled(false)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
    setIsLoading(false)
  }

  const handleCaptureImages = () => {
    if (uppy) {
      uppy.getFiles().forEach((file) => uppy.removeFile(file.id))
    }
    setIsDialogOpen(true)
  }

  const handleOverrideDuplicate = () => {
    addTrackingEntry() // Use the declared variable here
  }

  const handleCancelDuplicate = () => {
    resetForm()
  }

  const handleUploadComplete = (imageUrls: string[]) => {
    setCapturedImages((prev) => [...prev, ...imageUrls])
    if (uppy) {
      uppy.getFiles().forEach((file) => uppy.removeFile(file.id))
    }
  }

  useEffect(() => {
    if (capturedImages.length > 0) {
      inputRef.current?.focus()
    }
  }, [capturedImages])

  return (
    <div className="mb-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-4">
        <div className="flex gap-4">
          <Input
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Enter or scan FedEx tracking number"
            className="flex-grow"
            disabled={isInputDisabled}
            ref={inputRef}
          />
          <Select
            value={customStatusTypes.find((statusType) => statusType.id === status)?.name}
            onValueChange={(value) => {
              const selectedStatus = customStatusTypes.find((statusType) => statusType.name === value)

              if (selectedStatus) {
                setStatusQuery(selectedStatus.id)
              } else {
                setStatusQuery("")
              }
            }}
            disabled={isInputDisabled}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {[...[{ id: 0, name: "All" }], ...customStatusTypes].map((statusType) => (
                <SelectItem key={statusType.id} value={statusType.name}>
                  {statusType.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" disabled={isInputDisabled}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Tracking...
              </>
            ) : (
              "Log"
            )}
          </Button>
          <Button type="button" onClick={handleCaptureImages} disabled={isInputDisabled}>
            Capture Images
          </Button>
        </div>
        {capturedImages.length > 0 && (
          <div className="mt-4 flex gap-2 overflow-x-auto">
            {capturedImages.map((image, index) => (
              <img
                key={image}
                src={image || "/placeholder.svg"}
                alt={`Captured ${index + 1}`}
                className="w-20 h-20 object-cover"
              />
            ))}
          </div>
        )}
      </form>
      {duplicate && (
        <div className="mt-4 p-4 border border-yellow-500 bg-yellow-50 rounded-md">
          <p className="text-yellow-700">
            Warning: This tracking number has already been scanned on {new Date(duplicate.timestamp).toLocaleString()}.
          </p>
          <div className="mt-2 flex gap-2">
            <Button onClick={handleCancelDuplicate} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleOverrideDuplicate} variant="destructive">
              Override and Add Anyway
            </Button>
          </div>
        </div>
      )}
      <ImageUploadDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onUploadComplete={handleUploadComplete} />
    </div>
  )
}
