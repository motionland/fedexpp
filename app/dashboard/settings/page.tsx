"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  getCustomStatusTypes,
  setCustomStatusTypes,
  type CustomStatusType,
  updateCustomStatusType,
} from "@/utils/storage";
import { RouteGuard } from "@/components/RouteGuard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoleManagement } from "@/components/settings/RoleManagement";
import { UserInvitation } from "@/components/settings/UserInvitation";
import { EditStatusTypeDialog } from "@/components/settings/EditStatusTypeDialog";
import { EmailSettings } from "@/components/settings/EmailSettings";

export default function SettingsPage() {
  const [statusTypes, setStatusTypes] = useState<CustomStatusType[]>([]);
  const [newStatusType, setNewStatusType] = useState("");
  const [editingStatusType, setEditingStatusType] =
    useState<CustomStatusType | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchStatusData() {
      const response = await fetch("/api/status");
      const data = await response.json();

      setStatusTypes(data);
    }

    fetchStatusData();
  }, []);

  const handleAddStatusType = async () => {
    if (!newStatusType.trim()) return;
  
    try {
      const response = await fetch('/api/status', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newStatusType.trim() }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || "Failed to add status type");
      }
  
      const updatedStatusTypes = [
        ...statusTypes,
        { id: data.statusPost.id, name: data.statusPost.name },
      ];
      setStatusTypes(updatedStatusTypes);
      setCustomStatusTypes(updatedStatusTypes);
      setNewStatusType("");
  
      toast({
        title: "Status type added",
        description: `${data.statusPost.name} has been added to custom status types.`,
      });
  
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to add status: ${error.message}`,
        variant: "destructive",
      });
    }
  };
  

  const handleDeleteStatusType = async (id: string) => {
    let c = confirm("Are you sure you want to remove this status?")
    if (!c) return

    try {
      const response = await fetch("/api/status", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete status type");
      }
  
      const updatedStatusTypes = statusTypes.filter((status) => status.id !== id);
      setStatusTypes(updatedStatusTypes);
      setCustomStatusTypes(updatedStatusTypes);
  
      toast({
        title: "Status type removed",
        description: `The custom status '${data.deletedStatus?.name || "unknown"}' has been removed.`,
      });
  
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to delete status: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleEditStatusType = (statusType: CustomStatusType) => {
    setEditingStatusType(statusType);
  };

  const handleSaveStatusType = async (updatedStatusType: CustomStatusType) => {
    try {
      await fetch('/api/status', {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: updatedStatusType.id,
          name: updatedStatusType.name,
        }),
      });
  
      updateCustomStatusType(updatedStatusType.id, updatedStatusType);
      setStatusTypes(getCustomStatusTypes());
      setEditingStatusType(null);
      
      toast({
        title: "Status type updated",
        description: `${updatedStatusType.name} has been updated.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to update status: ${error.message || "Unknown error"}`,
        variant: "destructive",
      });
    }
  };
  
  
  return (
    <RouteGuard allowedRoles={["admin"]}>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        <Tabs defaultValue="status-types">
          <TabsList className="mb-4">
            <TabsTrigger value="status-types">Custom Status Types</TabsTrigger>
            <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
            <TabsTrigger value="invitations">User Invitations</TabsTrigger>
            <TabsTrigger value="email-settings">Email Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="status-types">
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-semibold mb-4">
                  Custom Status Types
                </h2>
                <div className="flex gap-4 mb-4">
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="newStatusType">New Status Type</Label>
                    <Input
                      type="text"
                      id="newStatusType"
                      value={newStatusType}
                      onChange={(e) => setNewStatusType(e.target.value)}
                      placeholder="Enter new status type"
                    />
                  </div>
                  <Button onClick={handleAddStatusType} className="mt-auto">
                    Add Status Type
                  </Button>
                </div>
                <div className="space-y-2">
                  {statusTypes.map((status) => (
                    <div
                      key={status.id}
                      className="flex items-center justify-between p-2 bg-muted rounded-md"
                    >
                      <span>{status.name}</span>
                      <div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditStatusType(status)}
                          className="mr-2"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteStatusType(status.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="roles">
            <RoleManagement />
          </TabsContent>
          <TabsContent value="invitations">
            <UserInvitation />
          </TabsContent>
          <TabsContent value="email-settings">
            <EmailSettings />
          </TabsContent>
        </Tabs>
        <EditStatusTypeDialog
          statusType={editingStatusType}
          onClose={() => setEditingStatusType(null)}
          onSave={handleSaveStatusType}
        />
      </div>
    </RouteGuard>
  );
}
