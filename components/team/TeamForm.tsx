"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useFetch } from "@/hooks/useFetch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from 'react';
import {
  Form,
  FormLabel,
  FormItem,
  FormField,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface Team {
  id: string;
  name: string;
  email: string;
  pin: string;
  role: string;
  department: string;
  status: string;
}

interface TeamFormProps {
  selectedTeam?: Team | null;
  onSubmit?: (team: Team) => void;
  onClose: () => void;
}

interface Role {
  id: number;
  name: string;
}

const formSchema = z.object({
  name: z
    .string()
    .nonempty({ message: "Name is required" }) // Tambahkan pesan required
    .min(3, { message: "Name must be at least 3 characters" }),
  email: z
    .string()
    .nonempty({ message: "Email is required" }) // Tambahkan pesan required
    .email({ message: "Invalid email address" })
    .min(3, { message: "Email must be at least 3 characters" }),
  pin: z
    .string()
    .nonempty({ message: "PIN is required" }) // Tambahkan pesan required
    .length(4, { message: "PIN must be exactly 4 digits" }),
  role: z.string().nonempty({ message: "Role is required" }), // Tambahkan pesan required
});

export default function TeamForm({ selectedTeam, onClose }: TeamFormProps) {
  const { refetch } = useFetch<Team[]>("/api/team-members");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: selectedTeam ?? { name: "", email: "", pin: "", role: "" },
  });

  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    async function fetchPermission(): Promise<TrackingEntry[]> {
      const response = await fetch('/api/role', {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
    
      const data: TrackingEntry[] = await response.json();
    
      setRoles(data);
      return data;
    }    

    fetchPermission();
  }, ([]));

  const onSubmit = async (data: any) => {
    const method = selectedTeam?.id ? "PUT" : "POST";
    const requestData = selectedTeam?.id
      ? { ...data, id: selectedTeam.id }
      : data;

    const response = await fetch(`/api/team-members`, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      console.error("Failed to save team member");
      return;
    }

    refetch();
    onClose();
  };

  return (
    <Dialog open={!!selectedTeam} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {selectedTeam?.id ? "Edit User" : "Add User"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field, fieldState }) => {
                return (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage>{fieldState.error?.message}</FormMessage>
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PIN</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    {/* <Input {...field} /> */}
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Choose Role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.name}>
                            {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">
              {selectedTeam?.id ? "Update" : "Save"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
