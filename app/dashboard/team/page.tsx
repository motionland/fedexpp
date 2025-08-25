'use client'

import { useState } from "react"

import { TeamManagement } from "@/components/team/TeamManagement"
import { RouteGuard } from "@/components/RouteGuard"
import TeamForm from "@/components/team/TeamForm"

interface Team {
  id: string
  name: string
  email: string
  pin: string
  role: string
  department: string
  status: string
}

export default function TeamPage() {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)  

  return (
    <RouteGuard allowedRoles={["admin"]}>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Team Management</h1>
        <TeamManagement onEdit={setSelectedTeam} />
        {selectedTeam && <TeamForm selectedTeam={selectedTeam} onClose={() => setSelectedTeam(null)} />}  
      </div>
    </RouteGuard>
  )
}