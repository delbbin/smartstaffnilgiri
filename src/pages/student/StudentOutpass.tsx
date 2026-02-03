import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, OutpassRequest } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MapPin,
  Calendar,
} from "lucide-react";

const StudentOutpass = () => {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<OutpassRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [reason, setReason] = useState("");
  const [destination, setDestination] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [returnTime, setReturnTime] = useState("");

  const fetchRequests = async () => {
    if (!profile) return;

    const { data, error } = await supabase
      .from("outpass_requests")
      .select("*")
      .eq("student_id", profile.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setRequests(data as OutpassRequest[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("outpass_requests").insert({
        student_id: profile.id,
        reason,
        destination,
        departure_time: departureTime,
        return_time: returnTime,
      });

      if (error) throw error;

      // Get HOD email to send notification
      const { data: hodData } = await supabase
        .from("staff_members")
        .select("email, name")
        .eq("is_hod", true)
        .single();

      if (hodData?.email) {
        // Send email notification to HOD
        await supabase.functions.invoke("send-email", {
          body: {
            to: hodData.email,
            subject: `New Outpass Request from ${profile.full_name}`,
            html: `
              <h2>New Outpass Request</h2>
              <p><strong>Student:</strong> ${profile.full_name}</p>
              <p><strong>Destination:</strong> ${destination}</p>
              <p><strong>Reason:</strong> ${reason}</p>
              <p><strong>Departure:</strong> ${new Date(departureTime).toLocaleString()}</p>
              <p><strong>Return:</strong> ${new Date(returnTime).toLocaleString()}</p>
              <p>Please review and approve/reject this request.</p>
            `,
          },
        });
      }

      toast.success("Outpass request submitted! Awaiting HOD approval.");
      setDialogOpen(false);
      setReason("");
      setDestination("");
      setDepartureTime("");
      setReturnTime("");
      fetchRequests();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
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
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Outpass Requests</h1>
            <p className="text-muted-foreground">
              Request permission to leave campus. HOD approval required.
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground gap-2">
                <Plus className="w-4 h-4" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Request Outpass</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="destination">Destination</Label>
                  <Input
                    id="destination"
                    placeholder="Where are you going?"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    placeholder="Why do you need to leave?"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="departure">Departure Time</Label>
                    <Input
                      id="departure"
                      type="datetime-local"
                      value={departureTime}
                      onChange={(e) => setDepartureTime(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="return">Return Time</Label>
                    <Input
                      id="return"
                      type="datetime-local"
                      value={returnTime}
                      onChange={(e) => setReturnTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="bg-muted p-3 rounded-lg text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Note:</p>
                  <p>Your request will be sent to Dr. Archana (HOD) for approval.</p>
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
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Outpass Requests</h3>
              <p className="text-muted-foreground mb-4">
                You haven't made any outpass requests yet.
              </p>
              <Button onClick={() => setDialogOpen(true)} className="gradient-primary text-primary-foreground">
                Create Your First Request
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
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <h3 className="font-semibold">{request.destination}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{request.reason}</p>
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {new Date(request.departure_time).toLocaleString()} -{" "}
                              {new Date(request.return_time).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Requested {new Date(request.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        {request.hod_remarks && (
                          <div className="mt-3 p-2 bg-muted rounded text-sm">
                            <span className="font-medium">HOD Remarks: </span>
                            {request.hod_remarks}
                          </div>
                        )}
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                        request.status === "approved"
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

export default StudentOutpass;
