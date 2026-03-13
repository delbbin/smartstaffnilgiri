import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Shield, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface SecurityOutpass {
  id: string;
  reason: string;
  destination: string;
  departure_time: string;
  return_time: string;
  status: string;
  gate_status: string;
  created_at: string;
  student?: {
    full_name: string;
    roll_number?: string;
    department?: string;
  };
}

const SecurityHistory: React.FC = () => {
  const { profile } = useAuth();
  const [history, setHistory] = useState<SecurityOutpass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!profile) return;

      const { data, error } = await supabase
        .from("outpass_requests")
        .select(`
          *,
          student:profiles!outpass_requests_student_id_fkey(full_name, roll_number, department)
        `)
        .eq("requested_by_security", true)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setHistory(data as any);
      }
      setLoading(false);
    };

    fetchHistory();
  }, [profile]);

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            Security History
          </h1>
          <p className="text-muted-foreground mt-1">
            All emergency outpasses created by security personnel
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Emergency Outpass History ({history.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
              </div>
            ) : history.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No emergency outpasses created yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Roll Number</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.student?.full_name || "—"}</TableCell>
                        <TableCell>{item.student?.roll_number || "—"}</TableCell>
                        <TableCell>{item.student?.department || "—"}</TableCell>
                        <TableCell>{item.destination}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{item.reason}</TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(item.created_at), "MMM dd, yyyy HH:mm")}
                        </TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SecurityHistory;
