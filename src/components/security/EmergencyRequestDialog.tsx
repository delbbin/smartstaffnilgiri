import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Search } from "lucide-react";

interface EmergencyRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

interface StudentResult {
  id: string;
  full_name: string;
  roll_number?: string;
  department?: string;
}

export const EmergencyRequestDialog: React.FC<EmergencyRequestDialogProps> = ({
  open,
  onOpenChange,
  onCreated,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState<StudentResult[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [reason, setReason] = useState("");
  const [destination, setDestination] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [returnTime, setReturnTime] = useState("");

  const searchStudents = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, roll_number, department")
        .eq("role", "student")
        .or(`full_name.ilike.%${searchQuery}%,roll_number.ilike.%${searchQuery}%`)
        .limit(5);

      setStudents((data as StudentResult[]) || []);
    } catch {
      toast.error("Failed to search students");
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedStudent || !reason || !destination || !departureTime || !returnTime) {
      toast.error("Please fill all fields");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("outpass_requests").insert({
        student_id: selectedStudent.id,
        reason,
        destination,
        departure_time: new Date(departureTime).toISOString(),
        return_time: new Date(returnTime).toISOString(),
        requested_by_security: true,
      });

      if (error) throw error;

      toast.success("Emergency outpass request submitted for approval");
      handleClose(false);
      onCreated?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to create request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setSearchQuery("");
      setStudents([]);
      setSelectedStudent(null);
      setReason("");
      setDestination("");
      setDepartureTime("");
      setReturnTime("");
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Emergency Outpass Request
          </DialogTitle>
          <DialogDescription>
            Request outpass approval on behalf of a student
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Student Search */}
          {!selectedStudent ? (
            <div className="space-y-3">
              <Label>Search Student</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Name or Roll Number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchStudents()}
                />
                <Button onClick={searchStudents} disabled={searching} size="icon" variant="outline">
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
              {students.length > 0 && (
                <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
                  {students.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStudent(s)}
                      className="w-full text-left p-3 hover:bg-muted/50 transition-colors"
                    >
                      <p className="font-medium text-sm">{s.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.roll_number} • {s.department}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-muted rounded-lg flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{selectedStudent.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedStudent.roll_number} • {selectedStudent.department}
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setSelectedStudent(null)}>
                Change
              </Button>
            </div>
          )}

          {/* Form Fields */}
          {selectedStudent && (
            <>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea
                  placeholder="Emergency reason..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Destination</Label>
                <Input
                  placeholder="Where is the student going?"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Departure</Label>
                  <Input
                    type="datetime-local"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Return</Label>
                  <Input
                    type="datetime-local"
                    value={returnTime}
                    onChange={(e) => setReturnTime(e.target.value)}
                  />
                </div>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full"
              >
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Submit for Approval
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
