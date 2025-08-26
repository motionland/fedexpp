import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { mutate } from "swr";

interface SubmitTrackingOptions {
  trackingNumber: string;
  status: string;
  checkDuplicate?: boolean;
  onSuccess?: (data: any) => void;
  onDuplicate?: (duplicateData: any) => void;
}

export function useTrackingSubmit() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const submitTracking = async (options: SubmitTrackingOptions) => {
    const {
      trackingNumber,
      status,
      checkDuplicate = true,
      onSuccess,
      onDuplicate,
    } = options;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/fedex-tracking/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trackingNumber: trackingNumber.trim(),
          status,
          checkDuplicate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.isDuplicate) {
          onDuplicate?.(data.existingEntry);
          return { isDuplicate: true, existingEntry: data.existingEntry };
        }
        throw new Error(data.error || "Failed to process tracking information");
      }

      // Force refresh all tracking-related cache
      await Promise.all([
        // Refresh non-paginated cache
        mutate("/api/fedex-tracking"),
        // Refresh all possible paginated cache combinations
        mutate((key) => Array.isArray(key) && key[0] === "/api/fedex-tracking"),
      ]);

      const successMessage =
        checkDuplicate === false
          ? `${trackingNumber} has been logged as a new entry (KAS ID: ${data.tracking.kasId}).`
          : `${trackingNumber} has been logged successfully.`;

      toast({
        title:
          checkDuplicate === false
            ? "Duplicate entry added"
            : "Tracking number added",
        description: successMessage,
      });

      onSuccess?.(data);
      return { success: true, tracking: data.tracking };
    } catch (error) {
      console.error("Error processing tracking info:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to process tracking information. Please try again.";

      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      return { error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    submitTracking,
    isLoading,
    error,
    setError,
  };
}
