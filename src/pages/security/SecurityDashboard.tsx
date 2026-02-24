import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Shield, CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";

interface OutpassWithStudent {
  id: string;
  student_id: string;
  reason: string;
  destination: string;
  departure_time: string;
  return_time: string;
  status: "pending" | "approved" | "rejected";
  hod_remarks?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
  student?: {
    full_name: string;
    roll_number?: string;
    department?: string;
    email: string;
  };
  approver?: {
    name: string;
  };
}

const SecurityDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<OutpassWithStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOutpass, setSelectedOutpass] = useState<OutpassWithStudent | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("outpass_requests")
        .select(`
          *,
          student:profiles!outpass_requests_student_id_fkey(full_name, roll_number, department, email),
          approver:staff_members!outpass_requests_approved_by_fkey(name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests((data as any) || []);
    } catch (err) {
      console.error("Error fetching outpass requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile) fetchRequests();
  }, [profile]);

  const filtered = requests.filter((r) => {
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      r.student?.full_name?.toLowerCase().includes(q) ||
      r.student?.roll_number?.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-600 text-white"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;
  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            Security Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            View and verify outpass requests for campus gate management
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{approvedCount}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rejectedCount}</p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, ID, or outpass ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Outpass Requests ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No outpass requests found.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>ID Number</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Authority</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.student?.full_name || "—"}</TableCell>
                        <TableCell>{r.student?.roll_number || "—"}</TableCell>
                        <TableCell>{r.student?.department || "—"}</TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(r.created_at), "MMM dd, yyyy HH:mm")}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{r.reason}</TableCell>
                        <TableCell>{getStatusBadge(r.status)}</TableCell>
                        <TableCell>{r.approver?.name || "—"}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedOutpass(r)}
                          >
                            <Eye className="w-4 h-4 mr-1" /> View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedOutpass} onOpenChange={() => setSelectedOutpass(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Outpass Details</DialogTitle>
          </DialogHeader>
          {selectedOutpass && (
            <div className="space-y-4">
              {selectedOutpass.status === "approved" && (
                <div className="flex flex-col items-center gap-2 p-4 border rounded-lg bg-muted/50">
                  <QRCodeSVG value={selectedOutpass.id} size={160} />
                  <p className="text-xs text-muted-foreground font-mono">{selectedOutpass.id}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Student Name</p>
                  <p className="font-medium">{selectedOutpass.student?.full_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">ID Number</p>
                  <p className="font-medium">{selectedOutpass.student?.roll_number || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Department</p>
                  <p className="font-medium">{selectedOutpass.student?.department || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  {getStatusBadge(selectedOutpass.status)}
                </div>
                <div>
                  <p className="text-muted-foreground">Destination</p>
                  <p className="font-medium">{selectedOutpass.destination}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Reason</p>
                  <p className="font-medium">{selectedOutpass.reason}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Departure</p>
                  <p className="font-medium">
                    {format(new Date(selectedOutpass.departure_time), "MMM dd, yyyy HH:mm")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Return</p>
                  <p className="font-medium">
                    {format(new Date(selectedOutpass.return_time), "MMM dd, yyyy HH:mm")}
                  </p>
                </div>
                {selectedOutpass.status === "approved" && (
                  <>
                    <div>
                      <p className="text-muted-foreground">Approved By</p>
                      <p className="font-medium">{selectedOutpass.approver?.name || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Approval Time</p>
                      <p className="font-medium">
                        {format(new Date(selectedOutpass.updated_at), "MMM dd, yyyy HH:mm")}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Valid Until</p>
                      <p className="font-medium">
                        {format(new Date(selectedOutpass.return_time), "MMM dd, yyyy HH:mm")}
                      </p>
                    </div>
                  </>
                )}
                {selectedOutpass.hod_remarks && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Remarks</p>
                    <p className="font-medium">{selectedOutpass.hod_remarks}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default SecurityDashboard;
