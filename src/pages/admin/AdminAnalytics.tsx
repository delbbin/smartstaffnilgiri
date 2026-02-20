import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase, StaffMember, OutpassRequest, MeetingRequest, StaffAvailability } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3, TrendingUp, Users, FileText, Calendar, Download,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

const COLORS = ["hsl(217, 91%, 50%)", "hsl(199, 89%, 48%)", "hsl(142, 76%, 36%)", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)"];

interface StaffAttendanceData {
  name: string;
  department: string;
  outpassesHandled: number;
  meetingsCompleted: number;
  availableSlots: number;
  attendancePercentage: number;
}

const AdminAnalytics = () => {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [outpasses, setOutpasses] = useState<OutpassRequest[]>([]);
  const [meetings, setMeetings] = useState<MeetingRequest[]>([]);
  const [availability, setAvailability] = useState<StaffAvailability[]>([]);
  const [attendanceData, setAttendanceData] = useState<StaffAttendanceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [staffRes, outpassRes, meetingRes, availRes] = await Promise.all([
        supabase.from("staff_members").select("*"),
        supabase.from("outpass_requests").select("*"),
        supabase.from("meeting_requests").select("*"),
        supabase.from("staff_availability").select("*"),
      ]);

      const staff = (staffRes.data || []) as StaffMember[];
      const ops = (outpassRes.data || []) as OutpassRequest[];
      const mts = (meetingRes.data || []) as MeetingRequest[];
      const avs = (availRes.data || []) as StaffAvailability[];

      setStaffMembers(staff);
      setOutpasses(ops);
      setMeetings(mts);
      setAvailability(avs);

      // Calculate attendance for each staff
      const data: StaffAttendanceData[] = staff.map(s => {
        const handled = ops.filter(o => o.approved_by === s.id && o.status !== "pending").length;
        const completed = mts.filter(m => m.staff_id === s.id && m.status === "completed").length;
        const totalMeetings = mts.filter(m => m.staff_id === s.id).length;
        const availSlots = avs.filter(a => a.staff_id === s.id && a.is_available).length;
        const totalSlots = avs.filter(a => a.staff_id === s.id).length;

        const earned = handled * 2 + completed * 3 + availSlots;
        const max = Math.max(ops.filter(o => o.approved_by === s.id).length * 2 + totalMeetings * 3 + totalSlots, 1);
        const pct = Math.min(Math.round((earned / max) * 100), 100);

        return {
          name: s.name,
          department: s.department || "N/A",
          outpassesHandled: handled,
          meetingsCompleted: completed,
          availableSlots: availSlots,
          attendancePercentage: pct,
        };
      });

      setAttendanceData(data);
      setLoading(false);
    };
    fetchData();
  }, []);

  const exportCSV = () => {
    const headers = "Name,Department,Outpasses Handled,Meetings Completed,Available Slots,Attendance %\n";
    const rows = attendanceData.map(d =>
      `${d.name},${d.department},${d.outpassesHandled},${d.meetingsCompleted},${d.availableSlots},${d.attendancePercentage}%`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "staff_attendance_report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const avgAttendance = attendanceData.length > 0
    ? Math.round(attendanceData.reduce((a, b) => a + b.attendancePercentage, 0) / attendanceData.length)
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Analytics & Attendance</h1>
            <p className="text-muted-foreground">Staff attendance reports and system analytics</p>
          </div>
          <Button onClick={exportCSV} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{staffMembers.length}</p>
                <p className="text-xs text-muted-foreground">Staff Members</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgAttendance}%</p>
                <p className="text-xs text-muted-foreground">Avg Attendance</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-secondary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{outpasses.length}</p>
                <p className="text-xs text-muted-foreground">Total Outpasses</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-warning/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{meetings.length}</p>
                <p className="text-xs text-muted-foreground">Total Meetings</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Staff Attendance Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Staff Attendance Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis type="number" domain={[0, 100]} unit="%" />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Bar dataKey="attendancePercentage" name="Attendance" radius={[0, 6, 6, 0]}>
                  {attendanceData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.attendancePercentage >= 75 ? "hsl(142, 76%, 36%)" : entry.attendancePercentage >= 50 ? "hsl(38, 92%, 50%)" : "hsl(0, 84%, 60%)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Activity Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Staff Activity Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="outpassesHandled" name="Outpasses" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="meetingsCompleted" name="Meetings" fill={COLORS[2]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="availableSlots" name="Avail. Slots" fill={COLORS[1]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detailed Staff Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-3 font-semibold">Staff Name</th>
                    <th className="p-3 font-semibold">Department</th>
                    <th className="p-3 font-semibold text-center">Outpasses</th>
                    <th className="p-3 font-semibold text-center">Meetings</th>
                    <th className="p-3 font-semibold text-center">Slots</th>
                    <th className="p-3 font-semibold text-center">Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceData.map((d, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="p-3 font-medium">{d.name}</td>
                      <td className="p-3 text-muted-foreground">{d.department}</td>
                      <td className="p-3 text-center">{d.outpassesHandled}</td>
                      <td className="p-3 text-center">{d.meetingsCompleted}</td>
                      <td className="p-3 text-center">{d.availableSlots}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          d.attendancePercentage >= 75 ? "bg-accent/10 text-accent" :
                          d.attendancePercentage >= 50 ? "bg-warning/10 text-warning" :
                          "bg-destructive/10 text-destructive"
                        }`}>
                          {d.attendancePercentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminAnalytics;
