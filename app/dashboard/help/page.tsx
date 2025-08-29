import { HelpCenter } from "@/components/help/HelpCenter";
import { RouteGuard } from "@/components/RouteGuard";

export default function HelpPage() {
  return (
    <RouteGuard requiredPermissions={["view_dashboard"]}>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Help Center</h1>
        <HelpCenter />
      </div>
    </RouteGuard>
  );
}
