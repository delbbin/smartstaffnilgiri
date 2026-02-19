import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase, StaffMember, StaffAvailability } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Users, Clock, Calendar, CheckCircle } from "lucide-react";
import { StaffPresenceWidget } from "@/components/student/StaffPresenceWidget";

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const StudentAvailability = () => {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [availability, setAvailability] = useState<StaffAvailability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [staffRes, availRes] = await Promise.all([
        supabase.from("staff_members").select("*").order("name"),
        supabase.from("staff_availability").select("*"),
      ]);

      if (staffRes.data) setStaffMembers(staffRes.data as StaffMember[]);
      if (availRes.data) setAvailability(availRes.data as StaffAvailability[]);
      setLoading(false);
    };

    fetchData();
  }, []);

  // Process data for chart
  const chartData = dayNames.slice(1).map((day, index) => {
    const dayNum = index + 1;
    const dayAvailability = availability.filter(
      (a) => a.day_of_week === dayNum && a.is_available
    );

    const data: Record<string, any> = { day };

    staffMembers.forEach((staff) => {
      const staffAvail = dayAvailability.filter((a) => a.staff_id === staff.id);
      const hours = staffAvail.reduce((total, a) => {
        const start = parseInt(a.start_time.split(":")[0]);
        const end = parseInt(a.end_time.split(":")[0]);
        return total + (end - start);
      }, 0);
      data[staff.name] = hours;
    });

    return data;
  });

  const colors = [
    "hsl(217, 91%, 50%)",
    "hsl(199, 89%, 48%)",
    "hsl(142, 76%, 36%)",
    "hsl(38, 92%, 50%)",
    "hsl(280, 65%, 60%)",
    "hsl(350, 80%, 55%)",
  ];

  const getStaffAvailabilityDetails = (staff: StaffMember) => {
    const staffAvail = availability.filter(
      (a) => a.staff_id === staff.id && a.is_available
    );

    return staffAvail.map((a) => ({
      day: dayNames[a.day_of_week],
      time: `${a.start_time.slice(0, 5)} - ${a.end_time.slice(0, 5)}`,
    }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Staff Availability</h1>
          <p className="text-muted-foreground">
            View when tutors are available for meetings. Most available in afternoons (Mon-Sat).
          </p>
        </div>

        {/* Live Staff Presence */}
        <StaffPresenceWidget />

        {/* Availability Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="w-5 h-5" />
              Weekly Availability Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-80 bg-muted animate-pulse rounded" />
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="day" />
                  <YAxis label={{ value: "Hours", angle: -90, position: "insideLeft" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  {staffMembers.map((staff, index) => (
                    <Bar
                      key={staff.id}
                      dataKey={staff.name}
                      fill={colors[index % colors.length]}
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Staff Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading
            ? [1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-48 bg-muted animate-pulse rounded-xl" />
              ))
            : staffMembers.map((staff, index) => {
                const details = getStaffAvailabilityDetails(staff);
                return (
                  <Card key={staff.id} className="relative overflow-hidden">
                    {staff.is_hod && (
                      <div className="absolute top-3 right-3 px-2 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                        HOD
                      </div>
                    )}
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: colors[index % colors.length] }}
                        >
                          {staff.name.charAt(0)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{staff.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{staff.title}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm font-medium flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary" />
                          Available Slots
                        </p>
                        {details.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No availability set</p>
                        ) : (
                          <div className="space-y-1">
                            {details.map((d, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-2 text-sm text-muted-foreground"
                              >
                                <CheckCircle className="w-3 h-3 text-success" />
                                <span className="font-medium">{d.day}:</span>
                                <span>{d.time}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
        </div>

        {/* Tips */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Best Times for Meetings
            </h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• <strong>Monday, Wednesday, Friday:</strong> Morning sessions available (9 AM - 11 AM)</li>
              <li>• <strong>Monday to Saturday:</strong> Afternoon sessions available (2 PM - 5 PM)</li>
              <li>• Peak availability is during afternoons from Monday to Saturday</li>
              <li>• Schedule meetings at least 24 hours in advance for better chances of approval</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StudentAvailability;
