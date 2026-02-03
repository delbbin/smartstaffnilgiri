import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, OutpassRequest, MeetingRequest, StaffMember } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
} from "lucide-react";

const StaffDashboard = () => {
  const { profile } = useAuth();
  const [outpassRequests, setOutpassRequests] = useState<OutpassRequest[]>([]);
  const [meetingRequests, setMeetingRequests] = useState<MeetingRequest[]>([]);
  const [staffInfo, setStaffInfo] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;

      // Get staff member info
      const { data: staffData } = await supabase
        .from("staff_members")
        .select("*")
        .eq("profile_id", profile.id)
        .single();

      if (staffData) {
        setStaffInfo(staffData as StaffMember);

        // Fetch meeting requests for this staff
        const { data: meetings } = await supabase
          .from("meeting_requests")
          .select("*")
          .eq("staff_id", staffData.id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (meetings) setMeetingRequests(meetings as MeetingRequest[]);
      }

      // All staff can see outpass requests (HOD approves)
      const { data: outpasses } = await supabase
        .from("outpass_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (outpasses) setOutpassRequests(outpasses as OutpassRequest[]);
      setLoading(false);
    };

    fetchData();
  }, [profile]);

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
            Manage outpass approvals and meeting requests
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  {outpassRequests.slice(0, 5).map((request) => (
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
