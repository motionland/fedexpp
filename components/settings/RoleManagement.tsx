"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { useFetch } from "@/hooks/useFetch"

type Permission = {
  id: string
  name: string
  description: string
}

export interface Role {
  id: string
  name: string
  permissions: Permission[]
}

export function RoleManagement() {
  const [roles, setRolesState] = useState<Role[]>([])
  const [permissions, setPermissionsState] = useState<Permission[]>([])
  const [newRoleName, setNewRoleName] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([])
  const { data, refetch } = useFetch<Role[]>('/api/role')
  const { toast } = useToast()

  useEffect(() => {
    setRolesState(data ?? []);
  }, [data])

  useEffect(() => {
    async function fetchPermission(): Promise<TrackingEntry[]> {
      const response = await fetch('/api/permissions', {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
    
      const data: TrackingEntry[] = await response.json();
    
      setPermissionsState(data);
      return data;
    }    

    fetchPermission();
  }, [])

  const handleAddRole = async () => {
    const dataBody = {
      name: newRoleName
    }
    
    const response = await fetch(`/api/role`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataBody),
    });

    if (!response.ok) {
      console.error("Failed to save role member");
      return;
    }

    refetch();
  }

  const handleDeleteRole = async (id: string) => {
    let c = confirm("Are you sure you want to remove this role?")
    if (!c) return
    
    const response = await fetch(`/api/role`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: id }),
    });

    if (!response.ok) {
      console.error("Failed to delete role");
      return;
    }

    refetch()
  }
  
  const handleEditRole = (role: Role) => {
    setEditingRole({ ...role });
    setSelectedPermissionIds(role.permissions.map((p) => p.id)); // Sync permission state
  };

  const handleSaveRole = async (role: Role) => {
    const dataBody = {
      id: role.id,
      permissions: selectedPermissionIds,
    };
  
    const response = await fetch(`/api/role`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataBody),
    });
  
    if (!response.ok) {
      console.error("Failed to save role permissions");
      return;
    }
  
    toast({ title: "Role updated successfully" });
    setEditingRole(null);
    setSelectedPermissionIds([]);
    setIsDialogOpen(false)
    refetch();
  };
  

  const togglePermission = (permissionId: string) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };
  

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-4 text-2xl font-semibold">Roles & Permissions</h2>
        <div className="flex gap-4 mb-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="newRoleName">New Role Name</Label>
            <Input
              type="text"
              id="newRoleName"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              placeholder="Enter new role name"
            />
          </div>
          <Button onClick={handleAddRole} className="mt-auto">
            Add Role
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role Name</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles?.map((role) => (
              <TableRow key={role.id}>
                <TableCell>{role.name}</TableCell>
                <TableCell>{role.permissions.length} permissions</TableCell>
                <TableCell>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => {
                        handleEditRole(role);
                        setIsDialogOpen(true);
                      }}>
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Role: {editingRole?.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {permissions.map((permission) => (
                          <div key={permission.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`permission-${permission.id}`}
                              checked={selectedPermissionIds?.includes(permission.id)}
                              onCheckedChange={() => togglePermission(permission.id)}
                            />
                            <Label htmlFor={`permission-${permission.id}`}>{permission.description}</Label>
                          </div>
                        ))}
                        <Button onClick={() => handleSaveRole(role)}>Save Changes</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteRole(role.id)} className="ml-2">
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

