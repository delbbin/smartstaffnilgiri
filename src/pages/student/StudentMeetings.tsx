import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, MeetingRequest, StaffMember } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
} from "lucide-react";

const meetingTypes = [
  "Notebook Signing",
  "No Due Certificate",
  "Project Discussion",
  "Academic Counseling",
  "Attendance Query",
  "Other",
];

const StudentMeetings = () => {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<MeetingRequest[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedStaff, setSelectedStaff] = useState("");
  const [meetingType, setMeetingType] = useState("");
  const [purpose, setPurpose] = useState("");
  const [requestedTime, setRequestedTime] = useState("");

  const fetchData = async () => {
    if (!profile) return;

    const [meetingsRes, staffRes] = await Promise.all([
      supabase
        .from("meeting_requests")
        .select("*")
        .eq("student_id", profile.id)
        .order("created_at", { ascending: false }),
      supabase.from("staff_members").select("*").order("name"),
    ]);

    if (meetingsRes.data) setRequests(meetingsRes.data as MeetingRequest[]);
    if (staffRes.data) setStaffMembers(staffRes.data as StaffMember[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("meeting_requests").insert({
        student_id: profile.id,
        staff_id: selectedStaff,
        meeting_type: meetingType,
        purpose,
        requested_time: requestedTime,
      });

      if (error) throw error;

      // Get selected tutor's email to send notification
      const selectedTutor = staffMembers.find((s) => s.id === selectedStaff);
      if (selectedTutor?.email) {
        await supabase.functions.invoke("send-email", {
          body: {
            to: selectedTutor.email,
            subject: `New Meeting Request from ${profile.full_name}`,
            html: `
              <h2>New Meeting Request</h2>
              <p><strong>Student:</strong> ${profile.full_name}</p>
              <p><strong>Meeting Type:</strong> ${meetingType}</p>
              <p><strong>Purpose:</strong> ${purpose}</p>
              <p><strong>Requested Time:</strong> ${new Date(requestedTime).toLocaleString()}</p>
              <p>Please review and respond to this meeting request.</p>
            `,
          },
        });
      }

      toast.success("Meeting request submitted!");
      setDialogOpen(false);
      setSelectedStaff("");
      setMeetingType("");
      setPurpose("");
      setRequestedTime("");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
      case "completed":
        return <CheckCircle className="w-5 h-5 text-success" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-destructive" />;
      default:
        return <AlertCircle className="w-5 h-5 text-warning" />;
    }
  };

  const getStatusStyles = (status: string) => {
    const styles = {
      pending: "border-warning/50 bg-warning/5",
      approved: "border-success/50 bg-success/5",
      rejected: "border-destructive/50 bg-destructive/5",
      completed: "border-primary/50 bg-primary/5",
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const getStaffName = (staffId: string) => {
    return staffMembers.find((s) => s.id === staffId)?.name || "Unknown";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Meeting Requests</h1>
            <p className="text-muted-foreground">
              Schedule meetings with tutors for notebook signing, no-due certificates, etc.
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground gap-2">
                <Plus className="w-4 h-4" />
                Schedule Meeting
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Schedule a Meeting</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Tutor</Label>
                  <Select value={selectedStaff} onValueChange={setSelectedStaff} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a tutor" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffMembers.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.name} {staff.is_hod && "(HOD)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Meeting Type</Label>
                  <Select value={meetingType} onValueChange={setMeetingType} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {meetingTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purpose">Purpose / Details</Label>
                  <Textarea
                    id="purpose"
                    placeholder="Describe the purpose of your meeting..."
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Preferred Date & Time</Label>
                  <Input
                    id="time"
                    type="datetime-local"
                    value={requestedTime}
                    onChange={(e) => setRequestedTime(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full gradient-primary text-primary-foreground"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Meeting Requests</h3>
              <p className="text-muted-foreground mb-4">
                You haven't scheduled any meetings yet.
              </p>
              <Button onClick={() => setDialogOpen(true)} className="gradient-primary text-primary-foreground">
                Schedule Your First Meeting
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {requests.map((request) => (
              <Card key={request.id} className={`border-2 ${getStatusStyles(request.status)}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {getStatusIcon(request.status)}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <h3 className="font-semibold">{getStaffName(request.staff_id)}</h3>
                          <span className="text-sm text-muted-foreground">•</span>
                          <span className="text-sm font-medium text-primary">{request.meeting_type}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{request.purpose}</p>
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(request.requested_time).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Requested {new Date(request.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        {request.staff_remarks && (
                          <div className="mt-3 p-2 bg-muted rounded text-sm">
                            <span className="font-medium">Staff Remarks: </span>
                            {request.staff_remarks}
                          </div>
                        )}
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                        request.status === "approved" || request.status === "completed"
                          ? "bg-success text-success-foreground"
                          : request.status === "rejected"
                          ? "bg-destructive text-destructive-foreground"
                          : "bg-warning text-warning-foreground"
                      }`}
                    >
                      {request.status}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentMeetings;
