import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  LogOut,
  LogIn,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";

interface VerifyOutpassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified?: () => void;
}

interface VerifiedOutpass {
  id: string;
  reason: string;
  destination: string;
  departure_time: string;
  return_time: string;
  status: string;
  gate_status: string;
  gate_verified_at: string | null;
  created_at: string;
  student?: {
    full_name: string;
    roll_number?: string;
    department?: string;
  };
  approver?: {
    name: string;
  };
}

export const VerifyOutpassDialog: React.FC<VerifyOutpassDialogProps> = ({
  open,
  onOpenChange,
  onVerified,
}) => {
  const [outpassId, setOutpassId] = useState("");
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [result, setResult] = useState<VerifiedOutpass | null>(null);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!outpassId.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("outpass_requests")
        .select(`
          *,
          student:profiles!outpass_requests_student_id_fkey(full_name, roll_number, department),
          approver:staff_members!outpass_requests_approved_by_fkey(name)
        `)
        .eq("id", outpassId.trim())
        .single();

      if (fetchError || !data) {
        setError("No outpass found with this ID.");
        return;
      }
      setResult(data as any);
    } catch {
      setError("Failed to verify outpass.");
    } finally {
      setLoading(false);
    }
  };

  const handleGateAction = async (newStatus: "left" | "returned") => {
    if (!result) return;
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("outpass_requests")
        .update({
          gate_status: newStatus,
          gate_verified_at: new Date().toISOString(),
        })
        .eq("id", result.id);

      if (error) throw error;

      setResult({ ...result, gate_status: newStatus, gate_verified_at: new Date().toISOString() });
      toast.success(`Student marked as ${newStatus === "left" ? "left campus" : "returned to campus"}`);
      onVerified?.();
    } catch {
      toast.error("Failed to update gate status");
    } finally {
      setUpdating(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setOutpassId("");
      setResult(null);
      setError("");
    }
    onOpenChange(open);
  };

  const isExpired = result ? new Date(result.return_time) < new Date() : false;
  const isValid = result?.status === "approved" && !isExpired;

  const getGateStatusBadge = (status: string) => {
    switch (status) {
      case "left":
        return <Badge className="bg-orange-600 text-white"><LogOut className="w-3 h-3 mr-1" />Left Campus</Badge>;
      case "returned":
        return <Badge className="bg-green-600 text-white"><LogIn className="w-3 h-3 mr-1" />Returned</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />On Campus</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Verify Outpass</DialogTitle>
          <DialogDescription>Enter outpass ID or scan QR code to verify</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter Outpass ID..."
              value={outpassId}
              onChange={(e) => setOutpassId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={loading || !outpassId.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <XCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Validity Banner */}
              <div className={`p-3 rounded-lg text-center font-medium ${
                isValid ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
                "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
              }`}>
                {isValid ? (
                  <span className="flex items-center justify-center gap-2"><CheckCircle className="w-5 h-5" /> VALID OUTPASS</span>
                ) : result.status !== "approved" ? (
                  <span className="flex items-center justify-center gap-2"><XCircle className="w-5 h-5" /> NOT APPROVED</span>
                ) : (
                  <span className="flex items-center justify-center gap-2"><AlertTriangle className="w-5 h-5" /> EXPIRED</span>
                )}
              </div>

              {/* QR Code for valid */}
              {isValid && (
                <div className="flex justify-center">
                  <QRCodeSVG value={result.id} size={120} />
                </div>
              )}

              {/* Details */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Student</p>
                  <p className="font-medium">{result.student?.full_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">ID Number</p>
                  <p className="font-medium">{result.student?.roll_number || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Department</p>
                  <p className="font-medium">{result.student?.department || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Destination</p>
                  <p className="font-medium">{result.destination}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Approved By</p>
                  <p className="font-medium">{result.approver?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Gate Status</p>
                  {getGateStatusBadge(result.gate_status)}
                </div>
                <div>
                  <p className="text-muted-foreground">Departure</p>
                  <p className="font-medium">{format(new Date(result.departure_time), "MMM dd, HH:mm")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Return By</p>
                  <p className="font-medium">{format(new Date(result.return_time), "MMM dd, HH:mm")}</p>
                </div>
              </div>

              {/* Gate Actions */}
              {isValid && (
                <div className="flex gap-3">
                  {result.gate_status === "on_campus" && (
                    <Button
                      onClick={() => handleGateAction("left")}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                      disabled={updating}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Mark Exit
                    </Button>
                  )}
                  {result.gate_status === "left" && (
                    <Button
                      onClick={() => handleGateAction("returned")}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      disabled={updating}
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Mark Return
                    </Button>
                  )}
                  {result.gate_status === "returned" && (
                    <p className="text-sm text-muted-foreground text-center w-full">Student has already returned.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
