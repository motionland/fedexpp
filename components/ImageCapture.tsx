"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Camera, X } from "lucide-react"

interface ImageCaptureProps {
  onCapture: (imageDataUrl: string) => void
  disabled?: boolean
}

export function ImageCapture({ onCapture, disabled = false }: ImageCaptureProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const startCapture = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setIsCapturing(true)
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
    }
  }, [])

  const captureImage = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d")
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth
        canvasRef.current.height = videoRef.current.videoHeight
        context.drawImage(videoRef.current, 0, 0)
        const imageDataUrl = canvasRef.current.toDataURL("image/jpeg")
        onCapture(imageDataUrl)
        stopCapture()
        setIsOpen(false)
      }
    }
  }, [onCapture])

  const stopCapture = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
      setIsCapturing(false)
    }
  }, [])

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open)
      if (open) {
        startCapture()
      } else {
        stopCapture()
      }
    },
    [startCapture, stopCapture],
  )

  useEffect(() => {
    return () => {
      stopCapture()
    }
  }, [stopCapture])

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" disabled={disabled}>
          <Camera className="mr-2 h-4 w-4" /> Capture Image
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Capture Image</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center">
          {isCapturing ? (
            <>
              <video ref={videoRef} autoPlay playsInline className="w-full max-h-[60vh] object-contain" />
              <div className="flex justify-center mt-4 space-x-2">
                <Button onClick={captureImage}>Capture</Button>
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  <X className="mr-2 h-4 w-4" /> Cancel
                </Button>
              </div>
            </>
          ) : (
            <Button onClick={startCapture}>Start Camera</Button>
          )}
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

