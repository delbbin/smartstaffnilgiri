import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Building2, Users, Layers, Plus, Trash2, Settings, Save,
} from "lucide-react";
import { toast } from "sonner";

interface Department {
  id: string;
  name: string;
  description?: string;
  organization_id: string;
  created_at: string;
}

interface OrgMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

const AdminOrganization = () => {
  const { profile, user } = useAuth();
  const { organization, loading: orgLoading } = useOrganization();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Org edit form
  const [orgName, setOrgName] = useState("");
  const [orgDescription, setOrgDescription] = useState("");
  const [orgIndustry, setOrgIndustry] = useState("");
  const [saving, setSaving] = useState(false);

  // Department dialog
  const [deptOpen, setDeptOpen] = useState(false);
  const [deptName, setDeptName] = useState("");
  const [deptDesc, setDeptDesc] = useState("");

  useEffect(() => {
    if (organization) {
      setOrgName(organization.name);
      setOrgDescription(organization.description || "");
      setOrgIndustry(organization.industry);
      fetchDepartments();
      fetchMembers();
    } else {
      setLoading(false);
    }
  }, [organization]);

  const fetchDepartments = async () => {
    if (!organization) return;
    const { data } = await supabase
      .from("departments")
      .select("*")
      .eq("organization_id", organization.id)
      .order("created_at");
    if (data) setDepartments(data as Department[]);
    setLoading(false);
  };

  const fetchMembers = async () => {
    if (!organization) return;
    const { data } = await supabase
      .from("organization_members")
      .select("*")
      .eq("organization_id", organization.id);
    if (data) setMembers(data as OrgMember[]);
  };

  const handleSaveOrg = async () => {
    if (!organization) return;
    setSaving(true);
    const { error } = await supabase
      .from("organizations")
      .update({
        name: orgName,
        description: orgDescription,
        industry: orgIndustry,
      })
      .eq("id", organization.id);

    if (error) {
      toast.error("Failed to update organization");
    } else {
      toast.success("Organization updated!");
    }
    setSaving(false);
  };

  const handleAddDepartment = async () => {
    if (!organization || !deptName.trim()) return;
    const { error } = await supabase.from("departments").insert({
      organization_id: organization.id,
      name: deptName.trim(),
      description: deptDesc.trim() || null,
    });
    if (error) {
      toast.error("Failed to create department");
    } else {
      toast.success("Department created!");
      setDeptOpen(false);
      setDeptName("");
      setDeptDesc("");
      fetchDepartments();
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    const { error } = await supabase.from("departments").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete department");
    } else {
      toast.success("Department deleted");
      fetchDepartments();
    }
  };

  if (!organization && !orgLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <Building2 className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Organization</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Your account is not linked to an organization. Create one from the signup page or ask your admin to add you.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Organization Settings
          </h1>
          <p className="text-muted-foreground">Manage your organization details and departments</p>
        </div>

        {/* Org Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Organization Details</CardTitle>
            <CardDescription>Update your organization's name, description, and industry</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Organization Name</Label>
                <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Industry</Label>
                <Input value={orgIndustry} onChange={(e) => setOrgIndustry(e.target.value)} placeholder="e.g. education, healthcare" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={orgDescription} onChange={(e) => setOrgDescription(e.target.value)} placeholder="Brief description of your organization" rows={3} />
            </div>
            {organization && (
              <div className="text-sm text-muted-foreground">
                Slug: <code className="bg-muted px-2 py-0.5 rounded">{organization.slug}</code>
              </div>
            )}
            <Button onClick={handleSaveOrg} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Layers className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{departments.length}</p>
                <p className="text-sm text-muted-foreground">Departments</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{members.length}</p>
                <p className="text-sm text-muted-foreground">Members</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Departments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Departments</CardTitle>
              <Button size="sm" className="gap-2" onClick={() => setDeptOpen(true)}>
                <Plus className="w-4 h-4" />
                Add Department
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}
              </div>
            ) : departments.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No departments yet. Add one to get started.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map((dept) => (
                    <TableRow key={dept.id}>
                      <TableCell className="font-medium">{dept.name}</TableCell>
                      <TableCell className="text-muted-foreground">{dept.description || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{new Date(dept.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteDepartment(dept.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Department Dialog */}
      <Dialog open={deptOpen} onOpenChange={setDeptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Department</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Department Name</Label>
              <Input value={deptName} onChange={(e) => setDeptName(e.target.value)} placeholder="e.g. Computer Science" />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input value={deptDesc} onChange={(e) => setDeptDesc(e.target.value)} placeholder="Brief description" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeptOpen(false)}>Cancel</Button>
            <Button onClick={handleAddDepartment}>Create Department</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminOrganization;
