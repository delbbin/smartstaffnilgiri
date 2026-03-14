import { useEffect, useState } from "react";
import { supabase, StaffMember, StaffAvailability } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Circle } from "lucide-react";

interface StaffPresence {
  staff: StaffMember;
  status: "available" | "busy" | "unavailable";
  availabilitySlot?: StaffAvailability;
}

export const StaffPresenceWidget = ({ compact = false }: { compact?: boolean }) => {
  const [presenceList, setPresenceList] = useState<StaffPresence[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPresence = async () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM

    const [staffRes, availRes, meetingRes] = await Promise.all([
      supabase.from("staff_members").select("*").order("name"),
      supabase.from("staff_availability").select("*").eq("day_of_week", dayOfWeek).eq("is_available", true),
      supabase.from("meeting_requests").select("*").eq("status", "approved"),
    ]);

    const staffMembers = (staffRes.data || []) as StaffMember[];
    const availabilities = (availRes.data || []) as StaffAvailability[];
    const meetings = meetingRes.data || [];

    // Check active meetings (within 1 hour of scheduled/requested time)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const presence: StaffPresence[] = staffMembers.map((staff) => {
      const activeMeeting = meetings.find(
        (m: any) => m.staff_id === staff.id &&
          ((m.scheduled_time && m.scheduled_time >= oneHourAgo && m.scheduled_time <= oneHourFromNow) ||
           (m.requested_time >= oneHourAgo && m.requested_time <= oneHourFromNow))
      );

      if (activeMeeting) {
        return { staff, status: "busy" as const };
      }

      const slot = availabilities.find(
        (a) => a.staff_id === staff.id && a.start_time <= currentTime && a.end_time >= currentTime
      );

      return {
        staff,
        status: slot ? "available" as const : "unavailable" as const,
        availabilitySlot: slot,
      };
    });

    setPresenceList(presence);
    setLoading(false);
  };

  useEffect(() => {
    fetchPresence();
    const interval = setInterval(fetchPresence, 30000);
    const channel = supabase
      .channel("staff-presence")
      .on("postgres_changes", { event: "*", schema: "public", table: "staff_availability" }, () => fetchPresence())
      .on("postgres_changes", { event: "*", schema: "public", table: "meeting_requests" }, () => fetchPresence())
      .subscribe();
    return () => { supabase.removeChannel(channel); clearInterval(interval); };
  }, []);

  const statusConfig = {
    busy: { color: "text-warning", bg: "bg-warning/10", label: "In Meeting" },
    available: { color: "text-success", bg: "bg-success/10", label: "Available" },
    unavailable: { color: "text-muted-foreground", bg: "bg-muted", label: "Not Available" },
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><Users className="w-5 h-5" />Staff Presence</CardTitle></CardHeader>
        <CardContent><div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)}</div></CardContent>
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
            <Circle className="w-2 h-2 fill-success text-success animate-pulse" />Live
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {displayList.map((item) => {
            const config = statusConfig[item.status];
            return (
              <div key={item.staff.id} className={`flex items-center justify-between p-3 rounded-lg ${config.bg}`}>
                <div className="flex items-center gap-3">
                  <Circle className={`w-3 h-3 fill-current ${config.color}`} />
                  <div>
                    <p className="font-medium text-sm">{item.staff.name}</p>
                    <p className="text-xs text-muted-foreground">{item.staff.title} — {item.staff.department}</p>
                  </div>
                </div>
                <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
              </div>
            );
          })}
          {displayList.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No staff members found</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
