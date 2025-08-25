"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import Uppy from "@uppy/core"
import Webcam from "@uppy/webcam"
import ImageEditor from "@uppy/image-editor"

const UppyContext = createContext<Uppy | null>(null)

export const useUppy = () => {
  const context = useContext(UppyContext)
  if (!context) {
    throw new Error("useUppy must be used within an UppyProvider")
  }
  return context
}

export const UppyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [uppy, setUppy] = useState<Uppy | null>(null)
    
  useEffect(() => {
    const uppyInstance = new Uppy({
      restrictions: {
        maxNumberOfFiles: 10,
        allowedFileTypes: ["image/*"],
      },
      autoProceed: false,
    })
      .use(Webcam, { modes: ["picture"] })
      .use(ImageEditor, {
        cropperOptions: {
          aspectRatio: 1,
          minCropBoxWidth: 200,
          minCropBoxHeight: 200,
        },
      })

    setUppy(uppyInstance)

    return () => {
      if (uppyInstance && typeof uppyInstance.cancelAll === "function") {
        uppyInstance.cancelAll()
      }
    }
  }, [])

  if (!uppy) return null

  return <UppyContext.Provider value={uppy}>{children}</UppyContext.Provider>
}

