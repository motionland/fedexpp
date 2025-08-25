"use client";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "./Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth(); // ✅ Sekarang bisa dipakai karena ini Client Component

  return (
    <div className="flex min-h-screen">
      {user && <Sidebar />}
      <main className="flex-1">{children}</main>
    </div>
  );
}
