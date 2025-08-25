"use client";

import { useState, useEffect } from "react";
import {
  type TrackingEntry,
  removeTrackingNumber,
  updateTrackingNumber,
  getCustomStatusTypes,
  type CustomStatusType,
  getCSTDate,
} from "../utils/storage";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableHeader,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, ImagePlus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

import { useUppy } from "../contexts/UppyContext";
import ImageGallery from "@/components/ImageGallery";

import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import "@uppy/webcam/dist/style.min.css";
import "@uppy/image-editor/dist/style.min.css";
import { usePathname } from "next/navigation";
import ImageUploadDialog from "./ImageUploadDialog";
import { FedexTracks } from "./FedexTracks";
import FedexTracksPage from "@/app/dashboard/fedex-tracks/page";
import Link from "next/link";

interface Props {
  data: TrackingEntry[] | undefined;
  isLoading: boolean;
  refetch: () => void;
  searchQuery: string;
}

export default function TrackingList({
  data,
  isLoading,
  refetch,
  searchQuery,
}: Props) {
  const [selectedEntry, setSelectedEntry] = useState<TrackingEntry | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [customStatusTypes, setCustomStatusTypes] = useState<
    CustomStatusType[]
  >([]);
  const [filterData, setFilterData] = useState<TrackingEntry[]>([]);
  const [displayedItems, setDisplayedItems] = useState<TrackingEntry[]>([]);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const pathname = usePathname();
  const { toast } = useToast();
  const uppy = useUppy();

  // Add intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && filterData.length > displayedItems.length) {
          setPage((prevPage) => prevPage + 1);
        }
      },
      { threshold: 1.0 }
    );

    const loadMoreTrigger = document.getElementById('load-more-trigger');
    if (loadMoreTrigger) {
      observer.observe(loadMoreTrigger);
    }

    return () => {
      if (loadMoreTrigger) {
        observer.unobserve(loadMoreTrigger);
      }
    };
  }, [isLoading, filterData, displayedItems]);

  // Update displayed items when page or filterData changes
  useEffect(() => {
    if (filterData) {
      const newItems = filterData.slice(0, page * itemsPerPage);
      setDisplayedItems(newItems);
    }
  }, [page, filterData]);

  const uploadBlobImagesId = async (blobUrls: string[], id: string) => {
    try {
      const formData = new FormData();
      formData.append("trackingId", id);

      await Promise.all(
        blobUrls.map(async (blobUrl) => {
          const response = await fetch(blobUrl);
          const blob = await response.blob();

          const mimeToExtension: Record<string, string> = {
            "image/png": "png",
            "image/jpeg": "jpg",
            "image/webp": "webp",
            "image/gif": "gif",
          };

          const extension = mimeToExtension[blob.type] || "bin";
          const uniqueFilename = `uploaded_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 10)}.${extension}`;

          const file = new File([blob], uniqueFilename, { type: blob.type });

          formData.append("file", file);
        })
      );

      await fetch("/api/fedex-tracking/upload", {
        method: "POST",
        body: formData,
      });

      refetch();
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      if (uppy) {
        uppy.getFiles().forEach((file) => uppy.removeFile(file.id));
      }
    }
  };

  useEffect(() => {
    const loadCustomStatusTypes = () => {
      setCustomStatusTypes(getCustomStatusTypes());
    };
    loadCustomStatusTypes();
    if (!searchQuery) {
      setFilterData(data || []);
      setPage(1); // Reset page when search query changes
    } else {
      const lowerQuery = searchQuery.toLowerCase();

      const filtered = data?.filter((entry) => {
        const trackingNumber = entry.trackingNumber?.toLowerCase() || "";
        const status = typeof entry.status === "string" ? entry.status : "";
        const fedexStatus = entry.fedexDeliveryStatus?.toLowerCase() || "";
        const kasId = entry.kasId?.toLowerCase() || "";
        const destination = entry.destination?.toLowerCase() || "";
        const origin = entry.origin?.toLowerCase() || "";
        const transitTime = entry.transitTime?.toLowerCase() || "";

        const shippingDate = entry.shippingDate
          ? new Date(entry.shippingDate).toISOString().split("T")[0]
          : "";

        return (
          trackingNumber.includes(lowerQuery) ||
          status.includes(lowerQuery) ||
          fedexStatus.includes(lowerQuery) ||
          kasId.includes(lowerQuery) ||
          destination.includes(lowerQuery) ||
          origin.includes(lowerQuery) ||
          transitTime.includes(lowerQuery) ||
          shippingDate.includes(lowerQuery)
        );
      }) || [];
      setFilterData(filtered);
      setPage(1); // Reset page when search query changes
    }
  }, [searchQuery, data]);

  const handleRemove = (id: string) => {
    let c = confirm("Are you sure you want to remove this tracking number?");
    if (!c) return;

    removeTrackingNumber(id)
      .then((success) => {
        toast({
          title: "Tracking number removed",
          description: "The tracking number has been deleted from the log.",
        });

        refetch();
      })
      .catch((error) => {
        toast({
          title: "Failed to remove tracking number",
          description:
            "An error occurred while trying to delete the tracking number." +
            `${error}`,
        });
      });
  };

  const convertWeeksToDaysHours = (weeks: string) => {
    const match = weeks.match(/([\d.]+)\s*weeks?/i);
    if (!match) return weeks;

    const weekValue = parseFloat(match[1]);
    const days = Math.floor(weekValue * 7);
    const hours = Math.round((weekValue * 7 - days) * 24);

    return `${days} days ${hours} hours`;
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    updateTrackingNumber(id, { statusId: newStatus })
      .then((success) => {
        toast({
          title: "Status updated",
          description: `The status has been updated to ${newStatus}.`,
        });

        refetch();
      })
      .catch((error) => {
        toast({
          title: "Failed to update status",
          description:
            "An error occurred while trying to update the status." + `${error}`,
        });
      });
  };

  const calculationTransittime = (entry: TrackingEntry): string => {
    const pickupEvent = entry.history.find((history) => history.status === "Picked up")
    const deliveryEvent = entry.history.find((history) => history.status === "Delivered")
    if (!pickupEvent || !deliveryEvent) {
      return entry.transitTime || "N/A"
    }

    const pickeupDate = getCSTDate(new Date(pickupEvent.date))
    const deliveryDate = getCSTDate(new Date(deliveryEvent.date))


    const diffMs = deliveryDate.getTime() - pickeupDate.getTime()
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diffMs / (1000 * 60)) % 60);

    return `${days}d ${hours}h ${minutes}m`
  }

  const handleAddImage = (entry: TrackingEntry) => {
    setSelectedEntry(entry);
    if (uppy) {
      uppy.getFiles().forEach((file) => uppy.removeFile(file.id));
    }
    setIsDialogOpen(true);
  };

  const handleUploadComplete = (imageUrls: string[]) => {
    if (selectedEntry) {
      uploadBlobImagesId(imageUrls, selectedEntry.id);
    }
    if (uppy) {
      uppy.getFiles().forEach((file) => uppy.removeFile(file.id));
    }
  };

  return (
    <div className="space-y-8">
      <div className="overflow-x-auto">
        {/* //make sure to comment out the below line to see the table */}
        {/* <FedexTracksPage /> */}
        {/* <FedexTracks /> */}
        <Table className="whitespace-normal table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead>KAS ID</TableHead>
              {pathname === "/" ? <TableHead>TimeStamp</TableHead> : null}
              <TableHead>Tracking Number</TableHead>
              <TableHead>Status</TableHead>
              {pathname === "/dashboard/tracking" && (
                <>
                  <TableHead>FedEx Delivery Status</TableHead>
                  <TableHead>Delivery Date</TableHead>
                  <TableHead>Shipping Date</TableHead>
                  <TableHead>Transit Time</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Origin</TableHead>
                </>
              )}
              <TableHead className="text-center">Images</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {displayedItems.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{entry.kasId}</TableCell>
                {pathname === "/" && (
                  <TableCell>
                    {entry.timestamp
                      ? new Date(entry.timestamp)
                          .toISOString()
                          .replace("T", " ")
                          .substring(0, 16)
                      : ""}
                  </TableCell>
                )}
                <TableCell className="truncate">
                  <Link href={`https://www.fedex.com/fedextrack/?trknbr=${entry.trackingNumber}`} target="_blank">{entry.trackingNumber?.slice(-12)}</Link>
                </TableCell>
                <TableCell>
                  <Select
                    defaultValue={entry.statusId}
                    onValueChange={(value) =>
                      handleStatusChange(entry.id, value)
                    }
                  >
                    <SelectTrigger className="max-w-[120px] truncate">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="max-w-[120px]">
                      {customStatusTypes.map((statusType) => (
                        <SelectItem key={statusType.id} value={statusType.id}>
                          {statusType.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                {pathname === "/dashboard/tracking" && (
                  <>
                    <TableCell>{entry.fedexDeliveryStatus || "N/A"}</TableCell>
                    <TableCell>
                      {entry.deliveryDate
                        ? new Date(entry.deliveryDate)
                            .toISOString()
                            .replace("T", " ")
                            .substring(0, 16)
                        : ""}
                    </TableCell>
                    <TableCell>
                      {entry.shippingDate
                        ? new Date(entry.shippingDate)
                            .toISOString()
                            .replace("T", " ")
                            .substring(0, 16)
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {calculationTransittime(entry)}
                    </TableCell>
                    <TableCell>{entry.destination || "N/A"}</TableCell>
                    <TableCell>{entry.origin || "N/A"}</TableCell>
                  </>
                )}

                <TableCell>
                  <ImageGallery images={entry.images} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleAddImage(entry)}
                      title="Add Images"
                    >
                      <ImagePlus className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleRemove(entry.id)}
                      title="Remove Entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filterData.length === 0 && (
          <p className="mt-4 text-center text-muted-foreground">
            No packages logged yet today.
          </p>
        )}
        {isLoading && (
          <div className="flex justify-center mt-4">
            <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary-foreground"></div>
          </div>
        )}
        {/* Load more trigger element */}
        {!isLoading && filterData.length > displayedItems.length && (
          <div id="load-more-trigger" className="h-10 w-full" />
        )}
      </div>

      <ImageUploadDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  );
}
