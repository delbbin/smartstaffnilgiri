import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, OutpassRequest, MeetingRequest } from "@/lib/supabase";
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
} from "lucide-react";

const StudentDashboard = () => {
  const { profile } = useAuth();
  const [outpassRequests, setOutpassRequests] = useState<OutpassRequest[]>([]);
  const [meetingRequests, setMeetingRequests] = useState<MeetingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;

      const [outpassRes, meetingRes] = await Promise.all([
        supabase
          .from("outpass_requests")
          .select("*")
          .eq("student_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("meeting_requests")
          .select("*")
          .eq("student_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      if (outpassRes.data) setOutpassRequests(outpassRes.data as OutpassRequest[]);
      if (meetingRes.data) setMeetingRequests(meetingRes.data as MeetingRequest[]);
      setLoading(false);
    };

    fetchData();
  }, [profile]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <AlertCircle className="w-4 h-4 text-warning" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-warning/10 text-warning",
      approved: "bg-success/10 text-success",
      rejected: "bg-destructive/10 text-destructive",
      completed: "bg-primary/10 text-primary",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.pending}`}>
        {status}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">
            Welcome back, {profile?.full_name}!
          </h1>
          <p className="text-muted-foreground">
            Manage your outpass requests and meeting schedules
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{outpassRequests.length}</p>
                <p className="text-sm text-muted-foreground">Outpass Requests</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{meetingRequests.length}</p>
                <p className="text-sm text-muted-foreground">Meeting Requests</p>
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
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {outpassRequests.filter((r) => r.status === "pending").length +
                    meetingRequests.filter((r) => r.status === "pending").length}
                </p>
                <p className="text-sm text-muted-foreground">Pending</p>
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
                <Link to="/student/outpass">
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
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">No outpass requests yet</p>
                  <Link to="/student/outpass">
                    <Button className="gradient-primary text-primary-foreground">
                      Request Outpass
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {outpassRequests.slice(0, 3).map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(request.status)}
                        <div>
                          <p className="font-medium text-sm">{request.destination}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(request.departure_time).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Recent Meeting Requests</CardTitle>
                <Link to="/student/meetings">
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
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">No meeting requests yet</p>
                  <Link to="/student/meetings">
                    <Button className="gradient-primary text-primary-foreground">
                      Schedule Meeting
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {meetingRequests.slice(0, 3).map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(request.status)}
                        <div>
                          <p className="font-medium text-sm">{request.meeting_type}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(request.requested_time).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
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

export default StudentDashboard;
