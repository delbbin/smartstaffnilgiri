import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase, Profile, OutpassRequest, MeetingRequest } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Users,
  FileText,
  Calendar,
  BarChart3,
  TrendingUp,
  CheckCircle,
  Clock,
  MessageSquare,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const AdminDashboard = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [outpasses, setOutpasses] = useState<OutpassRequest[]>([]);
  const [meetings, setMeetings] = useState<MeetingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [usersRes, outpassRes, meetingsRes] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("outpass_requests").select("*"),
        supabase.from("meeting_requests").select("*"),
      ]);

      if (usersRes.data) setUsers(usersRes.data as Profile[]);
      if (outpassRes.data) setOutpasses(outpassRes.data as OutpassRequest[]);
      if (meetingsRes.data) setMeetings(meetingsRes.data as MeetingRequest[]);
      setLoading(false);
    };

    fetchData();
  }, []);

  const studentCount = users.filter((u) => u.role === "student").length;
  const staffCount = users.filter((u) => u.role === "staff").length;
  const pendingOutpasses = outpasses.filter((o) => o.status === "pending").length;
  const pendingMeetings = meetings.filter((m) => m.status === "pending").length;

  const outpassStatusData = [
    { name: "Pending", value: outpasses.filter((o) => o.status === "pending").length },
    { name: "Approved", value: outpasses.filter((o) => o.status === "approved").length },
    { name: "Rejected", value: outpasses.filter((o) => o.status === "rejected").length },
  ];

  const meetingStatusData = [
    { name: "Pending", value: meetings.filter((m) => m.status === "pending").length },
    { name: "Approved", value: meetings.filter((m) => m.status === "approved").length },
    { name: "Completed", value: meetings.filter((m) => m.status === "completed").length },
    { name: "Rejected", value: meetings.filter((m) => m.status === "rejected").length },
  ];

  const COLORS = ["hsl(38, 92%, 50%)", "hsl(142, 76%, 36%)", "hsl(0, 84%, 60%)", "hsl(217, 91%, 50%)"];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your StaffHub workspace
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{studentCount}</p>
                <p className="text-sm text-muted-foreground">Students</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{staffCount}</p>
                <p className="text-sm text-muted-foreground">Staff Members</p>
              </div>
            </CardContent>
          </Card>
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
              <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingMeetings}</p>
                <p className="text-sm text-muted-foreground">Pending Meetings</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Outpass Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-64 bg-muted animate-pulse rounded" />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={outpassStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {outpassStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Meeting Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-64 bg-muted animate-pulse rounded" />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={meetingStatusData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(217, 91%, 50%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/admin/users">
            <Card className="hover:shadow-elevated transition-shadow cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">Manage Users</h3>
                  <p className="text-sm text-muted-foreground">View all users</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/admin/outpass">
            <Card className="hover:shadow-elevated transition-shadow cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">Outpass Overview</h3>
                  <p className="text-sm text-muted-foreground">View all requests</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/admin/feedback">
            <Card className="hover:shadow-elevated transition-shadow cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">View Feedback</h3>
                  <p className="text-sm text-muted-foreground">User feedback</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
