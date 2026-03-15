import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, OutpassRequest, MeetingRequest, StaffMember } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { StaffPresenceWidget } from "@/components/student/StaffPresenceWidget";
import { toast } from "sonner";
import {
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Circle,
} from "lucide-react";

type QuickStatus = "available" | "busy" | "not_available";

const statusConfig: Record<QuickStatus, { label: string; color: string; bg: string }> = {
  available: { label: "Available", color: "text-success", bg: "bg-success" },
  busy: { label: "Busy", color: "text-warning", bg: "bg-warning" },
  not_available: { label: "Not Available", color: "text-destructive", bg: "bg-destructive" },
};

const StaffDashboard = () => {
  const { profile, isHod } = useAuth();
  const [outpassRequests, setOutpassRequests] = useState<OutpassRequest[]>([]);
  const [meetingRequests, setMeetingRequests] = useState<MeetingRequest[]>([]);
  const [staffInfo, setStaffInfo] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [quickStatus, setQuickStatus] = useState<QuickStatus>("available");
  const [statusSaving, setStatusSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;

      const { data: staffData } = await supabase
        .from("staff_members")
        .select("*")
        .eq("profile_id", profile.id)
        .single();

      if (staffData) {
        setStaffInfo(staffData as StaffMember);

        const { data: meetings } = await supabase
          .from("meeting_requests")
          .select("*")
          .eq("staff_id", staffData.id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (meetings) setMeetingRequests(meetings as MeetingRequest[]);

        // Check current availability status
        const today = new Date().getDay();
        const { data: todaySlots } = await supabase
          .from("staff_availability")
          .select("*")
          .eq("staff_id", staffData.id)
          .eq("day_of_week", today);

        if (todaySlots && todaySlots.length > 0) {
          const hasAvailable = todaySlots.some((s: any) => s.is_available);
          setQuickStatus(hasAvailable ? "available" : "not_available");
        } else {
          setQuickStatus("not_available");
        }
      }

      if (isHod) {
        const { data: outpasses } = await supabase
          .from("outpass_requests")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10);
        if (outpasses) setOutpassRequests(outpasses as OutpassRequest[]);
      }

      setLoading(false);
    };

    fetchData();
  }, [profile, isHod]);

  const handleStatusChange = async (status: QuickStatus) => {
    if (!staffInfo) return;
    setStatusSaving(true);
    const today = new Date().getDay();

    try {
      if (status === "not_available") {
        // Set all today's slots to unavailable
        await supabase
          .from("staff_availability")
          .update({ is_available: false })
          .eq("staff_id", staffInfo.id)
          .eq("day_of_week", today);
      } else {
        // Check if slot exists for today
        const { data: existing } = await supabase
          .from("staff_availability")
          .select("*")
          .eq("staff_id", staffInfo.id)
          .eq("day_of_week", today);

        if (!existing || existing.length === 0) {
          // Create a default slot
          await supabase.from("staff_availability").insert({
            staff_id: staffInfo.id,
            day_of_week: today,
            start_time: "09:00",
            end_time: "17:00",
            is_available: status === "available",
          });
        } else {
          await supabase
            .from("staff_availability")
            .update({ is_available: status === "available" })
            .eq("staff_id", staffInfo.id)
            .eq("day_of_week", today);
        }
      }
      setQuickStatus(status);
      toast.success(`Status set to ${statusConfig[status].label}`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setStatusSaving(false);
    }
  };

  const pendingOutpasses = outpassRequests.filter((r) => r.status === "pending").length;
  const pendingMeetings = meetingRequests.filter((r) => r.status === "pending").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">
            Welcome, {profile?.full_name}
          </h1>
          <p className="text-muted-foreground">
            {isHod ? "Manage outpass approvals and meeting requests" : "Manage meeting requests and availability"}
          </p>
        </div>

        {/* Quick Status Toggle */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Circle className={`w-3 h-3 fill-current ${statusConfig[quickStatus].color}`} />
              My Status Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {(Object.keys(statusConfig) as QuickStatus[]).map((status) => {
                const config = statusConfig[status];
                const isActive = quickStatus === status;
                return (
                  <Button
                    key={status}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    disabled={statusSaving}
                    className={isActive ? `${config.bg} text-white hover:opacity-90` : ""}
                    onClick={() => handleStatusChange(status)}
                  >
                    <Circle className={`w-2 h-2 mr-1.5 fill-current ${isActive ? "text-white" : config.color}`} />
                    {config.label}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${isHod ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-4`}>
          {isHod && (
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingOutpasses}</p>
                  <p className="text-sm text-muted-foreground">Pending Outpasses</p>
                </div>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingMeetings}</p>
                <p className="text-sm text-muted-foreground">Pending Meetings</p>
              </div>
            </CardContent>
          </Card>
          {isHod && (
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {outpassRequests.filter((r) => r.status === "approved").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Approved Today</p>
                </div>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{meetingRequests.length}</p>
                <p className="text-sm text-muted-foreground">Total Meetings</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Staff Presence Widget */}
        <StaffPresenceWidget />

        {/* Quick Actions */}
        <div className={`grid grid-cols-1 ${isHod ? 'md:grid-cols-2' : ''} gap-6`}>
          {isHod && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Recent Outpass Requests</CardTitle>
                  <Link to="/staff/outpass">
                    <Button variant="ghost" size="sm">View All</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                ) : outpassRequests.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6">No outpass requests</p>
                ) : (
                  <div className="space-y-3">
                    {outpassRequests.slice(0, 5).map((request: any) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-sm">{request.destination}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(request.departure_time).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                            request.status === "approved"
                              ? "bg-success/10 text-success"
                              : request.status === "rejected"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-warning/10 text-warning"
                          }`}
                        >
                          {request.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">My Meeting Requests</CardTitle>
                <Link to="/staff/meetings">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : meetingRequests.length === 0 ? (
                <p className="text-muted-foreground text-center py-6">No meeting requests</p>
              ) : (
                <div className="space-y-3">
                  {meetingRequests.slice(0, 5).map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm">{request.meeting_type}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(request.requested_time).toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                          request.status === "approved" || request.status === "completed"
                            ? "bg-success/10 text-success"
                            : request.status === "rejected"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-warning/10 text-warning"
                        }`}
                      >
                        {request.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StaffDashboard;
