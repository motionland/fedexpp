import FadexTracksDetail from "@/components/FadexTracksDetail";
import { RouteGuard } from "@/components/RouteGuard";

export default function FedexTracksPage() {
  return (
    <RouteGuard requiredPermissions={["view_dashboard"]}>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">FedEx Tracking Details</h1>
        <FadexTracksDetail />
      </div>
    </RouteGuard>
  );
}
