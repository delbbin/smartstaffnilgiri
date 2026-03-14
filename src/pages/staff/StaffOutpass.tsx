import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, OutpassRequest, Profile } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Clock, CheckCircle, XCircle, AlertCircle, MapPin, Calendar, User,
} from "lucide-react";

interface OutpassWithStudent extends OutpassRequest {
  student?: Profile;
}

const StaffOutpass = () => {
  const { profile, isHod } = useAuth();
  const [requests, setRequests] = useState<OutpassWithStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<OutpassWithStudent | null>(null);
  const [remarks, setRemarks] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  if (profile?.role === "staff" && !isHod) {
    return <Navigate to="/staff" replace />;
  }

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from("outpass_requests")
      .select(`*, student:profiles!outpass_requests_student_id_fkey(*)`)
      .order("created_at", { ascending: false });
    if (!error && data) setRequests(data as OutpassWithStudent[]);
    setLoading(false);
  };

  const handleAction = async (action: "approved" | "rejected") => {
    if (!selectedRequest || !profile) return;
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("outpass_requests")
        .update({ status: action, hod_remarks: remarks || null })
        .eq("id", selectedRequest.id);
      if (error) throw error;

      // Notify the student
      if (selectedRequest.student) {
        await supabase.from("notifications").insert({
          user_id: selectedRequest.student.user_id,
          title: `Outpass ${action === "approved" ? "Approved" : "Rejected"}`,
          message: `Your outpass request to ${selectedRequest.destination} has been ${action} by HOD.${remarks ? ` Remarks: ${remarks}` : ""}`,
          type: "outpass",
          related_id: selectedRequest.id,
        });
      }

      toast.success(`Outpass ${action} successfully`);
      setSelectedRequest(null);
      setRemarks("");
      fetchRequests();
    } catch (error: any) {
      toast.error(error.message || "Failed to process request");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle className="w-5 h-5 text-success" />;
      case "rejected": return <XCircle className="w-5 h-5 text-destructive" />;
      default: return <AlertCircle className="w-5 h-5 text-warning" />;
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const processedRequests = requests.filter((r) => r.status !== "pending");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Outpass Requests (HOD)</h1>
          <p className="text-muted-foreground">Review and approve/reject student outpass requests</p>
        </div>

        {/* Pending Requests */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-warning" />
            Pending Requests ({pendingRequests.length})
          </h2>
          {loading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />)}
            </div>
          ) : pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
                <p className="text-muted-foreground">No pending requests</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingRequests.map((request) => (
                <Card key={request.id} className="border-2 border-warning/50 bg-warning/5">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <AlertCircle className="w-5 h-5 text-warning mt-1" />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-semibold">{request.student?.full_name || "Unknown Student"}</span>
                            {request.student?.roll_number && (
                              <span className="text-sm text-muted-foreground">({request.student.roll_number})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <h3 className="font-medium">{request.destination}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{request.reason}</p>
                          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(request.departure_time).toLocaleString()} - {new Date(request.return_time).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button onClick={() => setSelectedRequest(request)} className="gradient-primary text-primary-foreground">Review</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Processed Requests */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            Processed Requests ({processedRequests.length})
          </h2>
          {processedRequests.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No processed requests yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {processedRequests.slice(0, 10).map((request) => (
                <Card key={request.id} className={`border-2 ${request.status === "approved" ? "border-success/50 bg-success/5" : "border-destructive/50 bg-destructive/5"}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        {getStatusIcon(request.status)}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{request.student?.full_name || "Unknown Student"}</span>
                            <span className="text-sm text-muted-foreground">•</span>
                            <span className="text-sm">{request.destination}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{request.reason}</p>
                          {request.hod_remarks && (
                            <p className="text-sm mt-2 p-2 bg-muted rounded">
                              <span className="font-medium">Remarks:</span> {request.hod_remarks}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                        request.status === "approved" ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"
                      }`}>{request.status}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Review Dialog */}
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Review Outpass Request</DialogTitle>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <p><span className="font-medium">Student:</span> {selectedRequest.student?.full_name}</p>
                  <p><span className="font-medium">Destination:</span> {selectedRequest.destination}</p>
                  <p><span className="font-medium">Reason:</span> {selectedRequest.reason}</p>
                  <p><span className="font-medium">Departure:</span> {new Date(selectedRequest.departure_time).toLocaleString()}</p>
                  <p><span className="font-medium">Return:</span> {new Date(selectedRequest.return_time).toLocaleString()}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Remarks (Optional)</label>
                  <Textarea placeholder="Add any remarks..." value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => handleAction("rejected")} variant="destructive" className="flex-1" disabled={processing}>
                    <XCircle className="w-4 h-4 mr-2" />Reject
                  </Button>
                  <Button onClick={() => handleAction("approved")} className="flex-1 bg-success hover:bg-success/90" disabled={processing}>
                    <CheckCircle className="w-4 h-4 mr-2" />Approve
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default StaffOutpass;
