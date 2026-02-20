import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, StaffMember, OutpassRequest, MeetingRequest, StaffAvailability } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle,
  Clock,
  FileText,
  Calendar,
  TrendingUp,
  Activity,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from "recharts";

const COLORS = {
  primary: "hsl(217, 91%, 50%)",
  secondary: "hsl(199, 89%, 48%)",
  accent: "hsl(142, 76%, 36%)",
  warning: "hsl(38, 92%, 50%)",
  destructive: "hsl(0, 84%, 60%)",
};

const StaffAttendance = () => {
  const { profile } = useAuth();
  const [staffInfo, setStaffInfo] = useState<StaffMember | null>(null);
  const [outpasses, setOutpasses] = useState<OutpassRequest[]>([]);
  const [meetings, setMeetings] = useState<MeetingRequest[]>([]);
  const [availability, setAvailability] = useState<StaffAvailability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;

      const { data: staffData } = await supabase
        .from("staff_members")
        .select("*")
        .eq("profile_id", profile.id)
        .single();

      if (!staffData) { setLoading(false); return; }
      setStaffInfo(staffData as StaffMember);

      const [outpassRes, meetingRes, availRes] = await Promise.all([
        supabase.from("outpass_requests").select("*").eq("approved_by", staffData.id),
        supabase.from("meeting_requests").select("*").eq("staff_id", staffData.id),
        supabase.from("staff_availability").select("*").eq("staff_id", staffData.id),
      ]);

      if (outpassRes.data) setOutpasses(outpassRes.data as OutpassRequest[]);
      if (meetingRes.data) setMeetings(meetingRes.data as MeetingRequest[]);
      if (availRes.data) setAvailability(availRes.data as StaffAvailability[]);
      setLoading(false);
    };
    fetchData();
  }, [profile]);

  // Attendance calculation
  const handledOutpasses = outpasses.filter(o => o.status !== "pending").length;
  const completedMeetings = meetings.filter(m => m.status === "completed").length;
  const totalMeetings = meetings.length;
  const availableSlots = availability.filter(a => a.is_available).length;
  const totalSlots = availability.length;

  // Weighted attendance score
  const outpassScore = handledOutpasses * 2; // 2 points per handled outpass
  const meetingScore = completedMeetings * 3; // 3 points per completed meeting
  const availabilityScore = availableSlots * 1; // 1 point per available slot
  const maxPossibleScore = Math.max(
    (outpasses.length * 2) + (totalMeetings * 3) + (totalSlots * 1),
    1
  );
  const attendancePercentage = Math.min(
    Math.round(((outpassScore + meetingScore + availabilityScore) / maxPossibleScore) * 100),
    100
  );

  const pieData = [
    { name: "Attendance", value: attendancePercentage },
    { name: "Remaining", value: 100 - attendancePercentage },
  ];

  const activityData = [
    { name: "Outpasses Handled", value: handledOutpasses },
    { name: "Meetings Completed", value: completedMeetings },
    { name: "Meetings Pending", value: meetings.filter(m => m.status === "pending").length },
    { name: "Available Slots", value: availableSlots },
  ];

  // Monthly breakdown (last 6 months)
  const getMonthlyData = () => {
    const months: { name: string; outpasses: number; meetings: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const month = d.toLocaleString("default", { month: "short" });
      const year = d.getFullYear();
      const m = d.getMonth();
      months.push({
        name: month,
        outpasses: outpasses.filter(o => {
          const od = new Date(o.updated_at);
          return od.getMonth() === m && od.getFullYear() === year && o.status !== "pending";
        }).length,
        meetings: meetings.filter(mt => {
          const md = new Date(mt.updated_at);
          return md.getMonth() === m && md.getFullYear() === year && mt.status === "completed";
        }).length,
      });
    }
    return months;
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">My Attendance</h1>
          <p className="text-muted-foreground">
            Automatically calculated from your activity
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{attendancePercentage}%</p>
                <p className="text-xs text-muted-foreground">Attendance</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{handledOutpasses}</p>
                <p className="text-xs text-muted-foreground">Outpasses Handled</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-secondary/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedMeetings}</p>
                <p className="text-xs text-muted-foreground">Meetings Done</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-warning/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{availableSlots}</p>
                <p className="text-xs text-muted-foreground">Available Slots</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attendance Gauge */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Attendance Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={95}
                      startAngle={90}
                      endAngle={-270}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      <Cell fill={COLORS.accent} />
                      <Cell fill="hsl(210, 20%, 90%)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center -mt-4">
                <p className="text-4xl font-bold text-accent">{attendancePercentage}%</p>
                <p className="text-sm text-muted-foreground">Overall Attendance</p>
              </div>
            </CardContent>
          </Card>

          {/* Activity Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Activity Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {activityData.map((_, i) => (
                      <Cell key={i} fill={Object.values(COLORS)[i % 5]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Activity Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={getMonthlyData()}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="outpasses" name="Outpasses Handled" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                <Bar dataKey="meetings" name="Meetings Completed" fill={COLORS.accent} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Calculation Info */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-2">How is attendance calculated?</h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• <strong>Outpass handling:</strong> 2 points per approved/rejected request</li>
              <li>• <strong>Completed meetings:</strong> 3 points per completed student meeting</li>
              <li>• <strong>Availability slots:</strong> 1 point per active availability slot</li>
              <li>• <strong>Score:</strong> (earned points / max possible points) × 100%</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StaffAttendance;
