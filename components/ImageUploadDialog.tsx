"use client";

import { Dashboard } from "@uppy/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUppy } from "@/contexts/UppyContext";
import { useEffect, useRef } from "react";

interface ImageUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete: (imageUrls: string[]) => void;
}

export default function ImageUploadDialog({
  open,
  onOpenChange,
  onUploadComplete,
}: ImageUploadDialogProps) {
  const uppy = useUppy();
  const handleCompleteRef = useRef<any>();

  useEffect(() => {
    if (!uppy) return;

    handleCompleteRef.current = (result: any) => {
      if (result.successful && result.successful.length > 0) {
        const newImages = result.successful.map((file: any) =>
          URL.createObjectURL(file.data)
        );
        onUploadComplete(newImages);
        onOpenChange(false);
      }
    };

    uppy.on("complete", handleCompleteRef.current);
    return () => {
      uppy.off("complete", handleCompleteRef.current);
    };
  }, [uppy, onUploadComplete, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Upload Images</DialogTitle>
        </DialogHeader>
        {uppy && (
          <Dashboard
            className="max-w-[45rem]"
            uppy={uppy}
            plugins={["Webcam", "ImageEditor"]}
            metaFields={[
              { id: "name", name: "Name", placeholder: "File name" },
            ]}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
