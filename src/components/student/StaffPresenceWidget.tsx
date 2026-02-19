import { useEffect, useState } from "react";
import { supabase, StaffMember, MeetingRequest } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Circle } from "lucide-react";

interface StaffPresence {
  staff: StaffMember;
  status: "in-meeting" | "available" | "unavailable";
  currentMeeting?: MeetingRequest;
}

export const StaffPresenceWidget = ({ compact = false }: { compact?: boolean }) => {
  const [presenceList, setPresenceList] = useState<StaffPresence[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPresence = async () => {
    const now = new Date().toISOString();

    const [staffRes, meetingRes] = await Promise.all([
      supabase.from("staff_members").select("*").order("name"),
      supabase
        .from("meeting_requests")
        .select("*")
        .eq("status", "approved")
        .lte("requested_time", now),
    ]);

    const staffMembers = (staffRes.data || []) as StaffMember[];
    const approvedMeetings = (meetingRes.data || []) as MeetingRequest[];

    // A meeting is "active" if it was approved and requested_time is within last 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const presence: StaffPresence[] = staffMembers.map((staff) => {
      const activeMeeting = approvedMeetings.find(
        (m) => m.staff_id === staff.id && m.requested_time >= oneHourAgo
      );

      if (activeMeeting) {
        return { staff, status: "in-meeting", currentMeeting: activeMeeting };
      }

      // Check if staff has any approved meetings today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const todayMeetings = approvedMeetings.filter(
        (m) =>
          m.staff_id === staff.id &&
          m.requested_time >= todayStart.toISOString() &&
          m.requested_time <= todayEnd.toISOString()
      );

      return {
        staff,
        status: todayMeetings.length > 0 ? "available" : "unavailable",
      };
    });

    setPresenceList(presence);
    setLoading(false);
  };

  useEffect(() => {
    fetchPresence();

    // Subscribe to realtime changes on meeting_requests
    const channel = supabase
      .channel("staff-presence")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "meeting_requests" },
        () => {
          fetchPresence();
        }
      )
      .subscribe();

    // Refresh every 30 seconds
    const interval = setInterval(fetchPresence, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const statusConfig = {
    "in-meeting": { color: "text-warning", bg: "bg-warning/10", label: "In Meeting" },
    available: { color: "text-success", bg: "bg-success/10", label: "Available" },
    unavailable: { color: "text-muted-foreground", bg: "bg-muted", label: "Not Available" },
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Staff Presence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayList = compact ? presenceList.slice(0, 6) : presenceList;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Live Staff Presence
          </CardTitle>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Circle className="w-2 h-2 fill-success text-success animate-pulse" />
            Live
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {displayList.map((item) => {
            const config = statusConfig[item.status];
            return (
              <div
                key={item.staff.id}
                className={`flex items-center justify-between p-3 rounded-lg ${config.bg}`}
              >
                <div className="flex items-center gap-3">
                  <Circle className={`w-3 h-3 fill-current ${config.color}`} />
                  <div>
                    <p className="font-medium text-sm">{item.staff.name}</p>
                    <p className="text-xs text-muted-foreground">{item.staff.title}</p>
                  </div>
                </div>
                <span className={`text-xs font-medium ${config.color}`}>
                  {config.label}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
