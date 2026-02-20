import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, StaffMember, StaffAvailability } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Clock, Save, Plus, Trash2 } from "lucide-react";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const StaffAvailabilityManage = () => {
  const { profile } = useAuth();
  const [staffInfo, setStaffInfo] = useState<StaffMember | null>(null);
  const [slots, setSlots] = useState<StaffAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        const { data: avail } = await supabase
          .from("staff_availability")
          .select("*")
          .eq("staff_id", staffData.id)
          .order("day_of_week");
        if (avail) setSlots(avail as StaffAvailability[]);
      }
      setLoading(false);
    };
    fetchData();
  }, [profile]);

  const addSlot = async (dayOfWeek: number) => {
    if (!staffInfo) return;
    const { data, error } = await supabase
      .from("staff_availability")
      .insert({
        staff_id: staffInfo.id,
        day_of_week: dayOfWeek,
        start_time: "09:00",
        end_time: "17:00",
        is_available: true,
      })
      .select()
      .single();

    if (error) { toast.error("Failed to add slot"); return; }
    if (data) setSlots([...slots, data as StaffAvailability]);
    toast.success("Slot added");
  };

  const updateSlot = (id: string, field: string, value: string | boolean) => {
    setSlots(slots.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const deleteSlot = async (id: string) => {
    const { error } = await supabase.from("staff_availability").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    setSlots(slots.filter(s => s.id !== id));
    toast.success("Slot removed");
  };

  const saveAll = async () => {
    setSaving(true);
    for (const slot of slots) {
      await supabase
        .from("staff_availability")
        .update({
          start_time: slot.start_time,
          end_time: slot.end_time,
          is_available: slot.is_available,
        })
        .eq("id", slot.id);
    }
    setSaving(false);
    toast.success("Availability saved!");
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          {[1,2,3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)}
        </div>
      </DashboardLayout>
    );
  }

  if (!staffInfo) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Your staff profile is not set up yet. Please contact admin.
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  // Group by day
  const slotsByDay = dayNames.map((name, i) => ({
    day: i,
    name,
    slots: slots.filter(s => s.day_of_week === i),
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">My Availability</h1>
            <p className="text-muted-foreground">Manage your weekly schedule</p>
          </div>
          <Button onClick={saveAll} disabled={saving} className="gradient-primary text-primary-foreground gap-2">
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save All"}
          </Button>
        </div>

        <div className="space-y-4">
          {slotsByDay.filter(d => d.day >= 1 && d.day <= 6).map(({ day, name, slots: daySlots }) => (
            <Card key={day}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    {name}
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => addSlot(day)} className="gap-1 text-xs">
                    <Plus className="w-3 h-3" /> Add Slot
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {daySlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No slots — click Add Slot to set availability</p>
                ) : (
                  <div className="space-y-3">
                    {daySlots.map(slot => (
                      <div key={slot.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={slot.is_available}
                            onCheckedChange={(v) => updateSlot(slot.id, "is_available", v)}
                          />
                          <Label className="text-xs text-muted-foreground">
                            {slot.is_available ? "Available" : "Unavailable"}
                          </Label>
                        </div>
                        <Input
                          type="time"
                          value={slot.start_time}
                          onChange={(e) => updateSlot(slot.id, "start_time", e.target.value)}
                          className="w-28 h-8 text-sm"
                        />
                        <span className="text-muted-foreground text-sm">to</span>
                        <Input
                          type="time"
                          value={slot.end_time}
                          onChange={(e) => updateSlot(slot.id, "end_time", e.target.value)}
                          className="w-28 h-8 text-sm"
                        />
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteSlot(slot.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StaffAvailabilityManage;
