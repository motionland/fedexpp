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
import { Trash2, ImagePlus, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

import { useUppy } from "../contexts/UppyContext";
import { useRealtime } from "../contexts/RealtimeContext";
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

interface PaginationMeta {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface PaginatedResponse {
  data: TrackingEntry[];
  pagination: PaginationMeta;
}

interface Props {
  data: PaginatedResponse | undefined;
  isLoading: boolean;
  refetch: () => void;
  searchQuery: string;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export default function TrackingList({
  data,
  isLoading,
  refetch,
  searchQuery,
  currentPage,
  onPageChange,
}: Props) {
  const [selectedTrackingId, setSelectedTrackingId] = useState<string | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [customStatusTypes, setCustomStatusTypes] = useState<
    CustomStatusType[]
  >([]);
  const [filteredData, setFilteredData] = useState<TrackingEntry[]>([]);
  const pathname = usePathname();
  const { toast } = useToast();
  const uppy = useUppy();
  const { emitPackageDeleted } = useRealtime();

  useEffect(() => {
    const loadCustomStatusTypes = () => {
      setCustomStatusTypes(getCustomStatusTypes());
    };
    loadCustomStatusTypes();
  }, []);

  // Filter data based on search query
  useEffect(() => {
    if (data?.data) {
      if (searchQuery.trim() === "") {
        setFilteredData(data.data);
      } else {
        const filtered = data.data.filter(
          (entry) =>
            entry.trackingNumber
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            entry.kasId?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredData(filtered);
      }
    }
  }, [data, searchQuery]);

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

  const handleRemove = (id: string) => {
    let c = confirm("Are you sure you want to remove this tracking number?");
    if (!c) return;

    removeTrackingNumber(id)
      .then((success) => {
        toast({
          title: "Tracking number removed",
          description: "The tracking number has been deleted from the log.",
        });

        // Emit realtime event to update DateCounter
        emitPackageDeleted();
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
    const pickupEvent = entry.history.find(
      (history) => history.status === "Picked up"
    );
    const deliveryEvent = entry.history.find(
      (history) => history.status === "Delivered"
    );
    if (!pickupEvent || !deliveryEvent) {
      return entry.transitTime || "N/A";
    }

    const pickeupDate = getCSTDate(new Date(pickupEvent.date));
    const deliveryDate = getCSTDate(new Date(deliveryEvent.date));

    const diffMs = deliveryDate.getTime() - pickeupDate.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diffMs / (1000 * 60)) % 60);

    return `${days}d ${hours}h ${minutes}m`;
  };

  const handleAddImage = (entry: TrackingEntry) => {
    setSelectedTrackingId(entry.id);
    if (uppy) {
      uppy.getFiles().forEach((file) => uppy.removeFile(file.id));
    }
    setIsDialogOpen(true);
  };

  const handleUploadComplete = (imageUrls: string[]) => {
    if (selectedTrackingId) {
      uploadBlobImagesId(imageUrls, selectedTrackingId);
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
              <TableHead>Date/Time</TableHead>
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
            {filteredData.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>
                  {entry.timestamp
                    ? new Date(entry.timestamp).toLocaleString("en-US", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })
                    : "N/A"}
                </TableCell>
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
                  <Link
                    href={`https://www.fedex.com/fedextrack/?trknbr=${entry.trackingNumber}`}
                    target="_blank"
                  >
                    {entry.trackingNumber?.slice(-12)}
                  </Link>
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
                    <TableCell>{calculationTransittime(entry)}</TableCell>
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
        {filteredData.length === 0 && (
          <p className="mt-4 text-center text-muted-foreground">
            No packages logged yet today.
          </p>
        )}
        {isLoading && (
          <div className="flex justify-center mt-4">
            <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary-foreground"></div>
          </div>
        )}
        {/* Pagination Controls */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * data.pagination.limit + 1} to{" "}
              {Math.min(
                currentPage * data.pagination.limit,
                data.pagination.totalCount
              )}{" "}
              of {data.pagination.totalCount} entries
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={!data.pagination.hasPrevPage || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex items-center space-x-1">
                {Array.from(
                  { length: Math.min(5, data.pagination.totalPages) },
                  (_, i) => {
                    let pageNum: number;
                    if (data.pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= data.pagination.totalPages - 2) {
                      pageNum = data.pagination.totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={
                          currentPage === pageNum ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => onPageChange(pageNum)}
                        disabled={isLoading}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  }
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={!data.pagination.hasNextPage || isLoading}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
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
