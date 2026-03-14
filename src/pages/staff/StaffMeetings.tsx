import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, MeetingRequest, Profile, StaffMember } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Clock, CheckCircle, XCircle, AlertCircle, Calendar, User, FileText,
} from "lucide-react";

interface MeetingWithStudent extends MeetingRequest {
  student?: Profile;
  scheduled_time?: string | null;
}

const StaffMeetings = () => {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<MeetingWithStudent[]>([]);
  const [staffInfo, setStaffInfo] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<MeetingWithStudent | null>(null);
  const [remarks, setRemarks] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchData = async () => {
    if (!profile) return;
    const { data: staffData } = await supabase
      .from("staff_members").select("*").eq("profile_id", profile.id).single();
    if (staffData) {
      setStaffInfo(staffData as StaffMember);
      const { data } = await supabase
        .from("meeting_requests")
        .select(`*, student:profiles!meeting_requests_student_id_fkey(*)`)
        .eq("staff_id", staffData.id)
        .order("created_at", { ascending: false });
      if (data) setRequests(data as MeetingWithStudent[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [profile]);

  const handleAction = async (action: "approved" | "rejected" | "completed") => {
    if (!selectedRequest) return;
    setProcessing(true);
    try {
      const updateData: any = { status: action, staff_remarks: remarks || null };
      if (action === "approved" && scheduledTime) {
        updateData.scheduled_time = scheduledTime;
      }
      const { error } = await supabase.from("meeting_requests").update(updateData).eq("id", selectedRequest.id);
      if (error) throw error;

      // Notify the student
      if (selectedRequest.student) {
        const statusText = action === "approved" ? "approved" : action === "rejected" ? "rejected" : "marked as completed";
        let message = `Your meeting request for "${selectedRequest.meeting_type}" has been ${statusText}.`;
        if (action === "approved" && scheduledTime) {
          message += ` Scheduled for: ${new Date(scheduledTime).toLocaleString()}.`;
        }
        if (remarks) message += ` Remarks: ${remarks}`;

        await supabase.from("notifications").insert({
          user_id: selectedRequest.student.user_id,
          title: `Meeting ${action === "approved" ? "Approved" : action === "rejected" ? "Rejected" : "Completed"}`,
          message,
          type: "meeting",
          related_id: selectedRequest.id,
        });
      }

      toast.success(`Meeting ${action} successfully`);
      setSelectedRequest(null);
      setRemarks("");
      setScheduledTime("");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to process request");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": case "completed": return <CheckCircle className="w-5 h-5 text-success" />;
      case "rejected": return <XCircle className="w-5 h-5 text-destructive" />;
      default: return <AlertCircle className="w-5 h-5 text-warning" />;
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const approvedRequests = requests.filter((r) => r.status === "approved");
  const otherRequests = requests.filter((r) => r.status === "completed" || r.status === "rejected");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Meeting Requests</h1>
          <p className="text-muted-foreground">Review and manage student meeting requests</p>
        </div>

        {/* Pending */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-warning" />
            Pending Requests ({pendingRequests.length})
          </h2>
          {loading ? (
            <div className="grid gap-4">{[1, 2].map((i) => <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />)}</div>
          ) : pendingRequests.length === 0 ? (
            <Card><CardContent className="py-8 text-center"><CheckCircle className="w-12 h-12 text-success mx-auto mb-4" /><p className="text-muted-foreground">No pending requests</p></CardContent></Card>
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
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="w-4 h-4 text-primary" />
                            <span className="font-medium text-primary">{request.meeting_type}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{request.purpose}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>Requested: {new Date(request.requested_time).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <Button onClick={() => { setSelectedRequest(request); setScheduledTime(""); setRemarks(""); }} className="gradient-primary text-primary-foreground">Review</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming */}
        {approvedRequests.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              Upcoming Meetings ({approvedRequests.length})
            </h2>
            <div className="grid gap-4">
              {approvedRequests.map((request) => (
                <Card key={request.id} className="border-2 border-success/50 bg-success/5">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <CheckCircle className="w-5 h-5 text-success mt-1" />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{request.student?.full_name || "Unknown Student"}</span>
                            <span className="text-sm text-muted-foreground">•</span>
                            <span className="text-sm font-medium text-primary">{request.meeting_type}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{request.purpose}</p>
                          {request.scheduled_time && (
                            <p className="text-sm font-medium text-success mt-1">📅 Scheduled: {new Date(request.scheduled_time).toLocaleString()}</p>
                          )}
                        </div>
                      </div>
                      <Button onClick={() => { setSelectedRequest(request); setRemarks(""); }} variant="outline">Mark Complete</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Past */}
        {otherRequests.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              Past Meetings ({otherRequests.length})
            </h2>
            <div className="grid gap-4">
              {otherRequests.slice(0, 5).map((request) => (
                <Card key={request.id} className={`border ${request.status === "completed" ? "border-primary/30" : "border-destructive/30"}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {getStatusIcon(request.status)}
                        <div>
                          <p className="font-medium">{request.student?.full_name} - {request.meeting_type}</p>
                          <p className="text-xs text-muted-foreground">{new Date(request.requested_time).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs capitalize ${request.status === "completed" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>{request.status}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Review Dialog */}
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedRequest?.status === "approved" ? "Complete Meeting" : "Review Meeting Request"}</DialogTitle>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <p><span className="font-medium">Student:</span> {selectedRequest.student?.full_name}</p>
                  <p><span className="font-medium">Type:</span> {selectedRequest.meeting_type}</p>
                  <p><span className="font-medium">Purpose:</span> {selectedRequest.purpose}</p>
                  <p><span className="font-medium">Requested Time:</span> {new Date(selectedRequest.requested_time).toLocaleString()}</p>
                </div>
                {selectedRequest.status === "pending" && (
                  <div className="space-y-2">
                    <Label htmlFor="scheduled-time">Set Meeting Date & Time</Label>
                    <Input id="scheduled-time" type="datetime-local" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} />
                    <p className="text-xs text-muted-foreground">Set the actual meeting date and time. This will be visible to the student.</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Remarks (Optional)</Label>
                  <Textarea placeholder="Add any remarks..." value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                </div>
                {selectedRequest.status === "approved" ? (
                  <Button onClick={() => handleAction("completed")} className="w-full gradient-primary text-primary-foreground" disabled={processing}>
                    <CheckCircle className="w-4 h-4 mr-2" />Mark as Completed
                  </Button>
                ) : (
                  <div className="flex gap-3">
                    <Button onClick={() => handleAction("rejected")} variant="destructive" className="flex-1" disabled={processing}>
                      <XCircle className="w-4 h-4 mr-2" />Reject
                    </Button>
                    <Button onClick={() => handleAction("approved")} className="flex-1 bg-success hover:bg-success/90" disabled={processing}>
                      <CheckCircle className="w-4 h-4 mr-2" />Approve
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default StaffMeetings;
