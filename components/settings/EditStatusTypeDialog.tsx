import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { CustomStatusType } from "@/utils/storage"

interface EditStatusTypeDialogProps {
  statusType: CustomStatusType | null
  onClose: () => void
  onSave: (updatedStatusType: CustomStatusType) => void
}

export function EditStatusTypeDialog({ statusType, onClose, onSave }: EditStatusTypeDialogProps) {
  const [editedName, setEditedName] = useState("")

  useEffect(() => {
    if (statusType) {
      setEditedName(statusType.name)
    }
  }, [statusType])

  const handleSave = () => {
    if (statusType && editedName.trim()) {
      onSave({ ...statusType, name: editedName.trim() })
    }
  }

  return (
    <Dialog open={!!statusType} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Status Type</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="statusTypeName">Status Type Name</Label>
            <Input
              id="statusTypeName"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              placeholder="Enter status type name"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

