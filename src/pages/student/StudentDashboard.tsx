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
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { StaffPresenceWidget } from "@/components/student/StaffPresenceWidget";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = {
  pending: "hsl(38, 92%, 50%)",
  approved: "hsl(142, 76%, 36%)",
  rejected: "hsl(0, 84%, 60%)",
  completed: "hsl(217, 91%, 50%)",
};

const StudentDashboard = () => {
  const { profile } = useAuth();
  const [outpassRequests, setOutpassRequests] = useState<OutpassRequest[]>([]);
  const [meetingRequests, setMeetingRequests] = useState<MeetingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;
      const [outpassRes, meetingRes] = await Promise.all([
        supabase.from("outpass_requests").select("*").eq("student_id", profile.id).order("created_at", { ascending: false }).limit(10),
        supabase.from("meeting_requests").select("*").eq("student_id", profile.id).order("created_at", { ascending: false }).limit(10),
      ]);
      if (outpassRes.data) setOutpassRequests(outpassRes.data as OutpassRequest[]);
      if (meetingRes.data) setMeetingRequests(meetingRes.data as MeetingRequest[]);
      setLoading(false);
    };
    fetchData();
  }, [profile]);

  const outpassPieData = [
    { name: "Pending", value: outpassRequests.filter((r) => r.status === "pending").length, color: COLORS.pending },
    { name: "Approved", value: outpassRequests.filter((r) => r.status === "approved").length, color: COLORS.approved },
    { name: "Rejected", value: outpassRequests.filter((r) => r.status === "rejected").length, color: COLORS.rejected },
  ].filter((d) => d.value > 0);

  const meetingPieData = [
    { name: "Pending", value: meetingRequests.filter((r) => r.status === "pending").length, color: COLORS.pending },
    { name: "Approved", value: meetingRequests.filter((r) => r.status === "approved").length, color: COLORS.approved },
    { name: "Completed", value: meetingRequests.filter((r) => r.status === "completed").length, color: COLORS.completed },
    { name: "Rejected", value: meetingRequests.filter((r) => r.status === "rejected").length, color: COLORS.rejected },
  ].filter((d) => d.value > 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle className="w-4 h-4 text-success" />;
      case "rejected": return <XCircle className="w-4 h-4 text-destructive" />;
      case "completed": return <CheckCircle className="w-4 h-4 text-primary" />;
      default: return <AlertCircle className="w-4 h-4 text-warning" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-warning/10 text-warning border border-warning/20",
      approved: "bg-success/10 text-success border border-success/20",
      rejected: "bg-destructive/10 text-destructive border border-destructive/20",
      completed: "bg-primary/10 text-primary border border-primary/20",
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${styles[status] || styles.pending}`}>
        {status}
      </span>
    );
  };

  const totalRequests = outpassRequests.length + meetingRequests.length;
  const approvedCount = outpassRequests.filter((r) => r.status === "approved").length + meetingRequests.filter((r) => r.status === "approved" || r.status === "completed").length;
  const pendingCount = outpassRequests.filter((r) => r.status === "pending").length + meetingRequests.filter((r) => r.status === "pending").length;
  const approvalRate = totalRequests > 0 ? Math.round((approvedCount / totalRequests) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="gradient-primary rounded-2xl p-6 text-white">
          <h1 className="text-2xl font-display font-bold">
            Welcome back, {profile?.full_name}! 👋
          </h1>
          <p className="text-white/80 mt-1">
            Here's your activity overview. Manage outpass and meeting requests easily.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Requests", value: totalRequests, icon: FileText, gradient: "from-blue-500 to-blue-600" },
            { label: "Approved", value: approvedCount, icon: CheckCircle, gradient: "from-emerald-500 to-emerald-600" },
            { label: "Pending", value: pendingCount, icon: Clock, gradient: "from-amber-500 to-amber-600" },
            { label: "Approval Rate", value: `${approvalRate}%`, icon: TrendingUp, gradient: "from-violet-500 to-violet-600" },
          ].map((stat, i) => (
            <Card key={i} className="overflow-hidden border-0 shadow-card">
              <CardContent className="p-0">
                <div className="flex items-center gap-4 p-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shrink-0`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pie Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                Outpass Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-52 bg-muted animate-pulse rounded-xl" />
              ) : outpassPieData.length === 0 ? (
                <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">
                  No outpass requests yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={outpassPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={2}
                      stroke="hsl(var(--card))"
                    >
                      {outpassPieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "10px",
                        fontSize: "13px",
                      }}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: "12px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-secondary" />
                Meeting Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-52 bg-muted animate-pulse rounded-xl" />
              ) : meetingPieData.length === 0 ? (
                <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">
                  No meeting requests yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={meetingPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={2}
                      stroke="hsl(var(--card))"
                    >
                      {meetingPieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "10px",
                        fontSize: "13px",
                      }}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: "12px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Live Staff Presence */}
        <StaffPresenceWidget compact />

        {/* Recent Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Recent Outpasses</CardTitle>
                <Link to="/student/outpass">
                  <Button variant="ghost" size="sm" className="text-xs gap-1">
                    View All <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-muted animate-pulse rounded-xl" />)}
                </div>
              ) : outpassRequests.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm mb-4">No outpass requests yet</p>
                  <Link to="/student/outpass">
                    <Button size="sm" className="gradient-primary text-primary-foreground">Request Outpass</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {outpassRequests.slice(0, 4).map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-xl hover:bg-muted/60 transition-colors">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(request.status)}
                        <div>
                          <p className="font-medium text-sm">{request.destination}</p>
                          <p className="text-xs text-muted-foreground">{new Date(request.departure_time).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Recent Meetings</CardTitle>
                <Link to="/student/meetings">
                  <Button variant="ghost" size="sm" className="text-xs gap-1">
                    View All <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-muted animate-pulse rounded-xl" />)}
                </div>
              ) : meetingRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm mb-4">No meeting requests yet</p>
                  <Link to="/student/meetings">
                    <Button size="sm" className="gradient-primary text-primary-foreground">Schedule Meeting</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {meetingRequests.slice(0, 4).map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-xl hover:bg-muted/60 transition-colors">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(request.status)}
                        <div>
                          <p className="font-medium text-sm">{request.meeting_type}</p>
                          <p className="text-xs text-muted-foreground">{new Date(request.requested_time).toLocaleDateString()}</p>
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
