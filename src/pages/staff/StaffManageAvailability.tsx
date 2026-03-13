import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, StaffMember, StaffAvailability } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Users, Plus, Trash2, Save, Clock } from "lucide-react";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const StaffManageAvailability = () => {
  const { profile, isHod } = useAuth();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [slots, setSlots] = useState<StaffAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchStaff = async () => {
      const { data } = await supabase
        .from("staff_members")
        .select("*")
        .order("name");
      if (data) setStaffMembers(data as StaffMember[]);
      setLoading(false);
    };
    fetchStaff();
  }, []);

  useEffect(() => {
    if (!selectedStaffId) { setSlots([]); return; }
    const fetchSlots = async () => {
      const { data } = await supabase
        .from("staff_availability")
        .select("*")
        .eq("staff_id", selectedStaffId)
        .order("day_of_week");
      if (data) setSlots(data as StaffAvailability[]);
    };
    fetchSlots();
  }, [selectedStaffId]);

  // Only HOD can access this page
  if (profile?.role === "staff" && !isHod) {
    return <Navigate to="/staff" replace />;
  }

  const addSlot = async (dayOfWeek: number) => {
    if (!selectedStaffId) return;
    const { data, error } = await supabase
      .from("staff_availability")
      .insert({
        staff_id: selectedStaffId,
        day_of_week: dayOfWeek,
        start_time: "09:00",
        end_time: "17:00",
        is_available: true,
      })
      .select()
      .single();

    if (!error && data) {
      setSlots((prev) => [...prev, data as StaffAvailability]);
      toast.success("Slot added");
    }
  };

  const updateSlot = (id: string, field: string, value: string | boolean) => {
    setSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const deleteSlot = async (id: string) => {
    await supabase.from("staff_availability").delete().eq("id", id);
    setSlots((prev) => prev.filter((s) => s.id !== id));
    toast.success("Slot removed");
  };

  const saveAll = async () => {
    setSaving(true);
    try {
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
      toast.success("Availability saved!");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Users className="w-6 h-6" />
            Manage Staff Availability
          </h1>
          <p className="text-muted-foreground">
            Update availability schedules for staff members
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select Staff Member</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
              <SelectTrigger className="max-w-md">
                <SelectValue placeholder="Choose a staff member" />
              </SelectTrigger>
              <SelectContent>
                {staffMembers.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.name} {staff.is_hod && "(HOD)"} — {staff.department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedStaffId && (
          <>
            <div className="flex justify-end">
              <Button onClick={saveAll} disabled={saving} className="gap-2">
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save All Changes"}
              </Button>
            </div>

            <div className="grid gap-4">
              {[1, 2, 3, 4, 5, 6].map((day) => {
                const daySlots = slots.filter((s) => s.day_of_week === day);
                return (
                  <Card key={day}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{dayNames[day]}</CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addSlot(day)}
                          className="gap-1"
                        >
                          <Plus className="w-3 h-3" /> Add Slot
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {daySlots.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No slots — click Add Slot</p>
                      ) : (
                        <div className="space-y-2">
                          {daySlots.map((slot) => (
                            <div key={slot.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <Input
                                type="time"
                                value={slot.start_time}
                                onChange={(e) => updateSlot(slot.id, "start_time", e.target.value)}
                                className="w-28"
                              />
                              <span className="text-muted-foreground">to</span>
                              <Input
                                type="time"
                                value={slot.end_time}
                                onChange={(e) => updateSlot(slot.id, "end_time", e.target.value)}
                                className="w-28"
                              />
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={slot.is_available}
                                  onCheckedChange={(checked) => updateSlot(slot.id, "is_available", checked)}
                                />
                                <span className="text-xs">{slot.is_available ? "Available" : "Busy"}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteSlot(slot.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StaffManageAvailability;
