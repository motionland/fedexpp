import { useEffect, useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ImageType } from "@/utils/storage"
import { useFetch } from "@/hooks/useFetch";
import {X} from "lucide-react"

interface ImageGalleryProps {
  images: ImageType[]
}

export default function ImageGallery({ images }: ImageGalleryProps) {
  const { refetch } = useFetch("/api/fedex-tracking");
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const handleDeleteImage = async (data: ImageType) => {
    const url = data.url.split('/');
    const fileName = url[4].split('?')[0];

    await fetch('/api/fedex-tracking/upload', {
      method: "DELETE",
      body: JSON.stringify({
        id: data.id,
        fileName: fileName,
      }),
    });

    refetch();
  }

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto">
        {images?.map((image, index) => (
          <div className="relative">
            <Image
              key={index}
              src={image.url || "/placeholder.svg"}
              alt={`Image ${index + 1}`}
              width={100}
              height={100}
              className="object-cover cursor-pointer"
              onClick={() => setSelectedImage(image.url)}
            />
            <button className="absolute top-0 right-0" onClick={() => handleDeleteImage(image)}>
              <X size={16} color="#fb0404" strokeWidth={5} />
            </button>
          </div>
        ))}
      </div>
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl">
          {selectedImage && (
            <Image
              src={selectedImage || "/placeholder.svg"}
              alt="Selected image"
              width={800}
              height={600}
              className="object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

