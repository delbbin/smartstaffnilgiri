import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase, Feedback } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, MessageSquare, User } from "lucide-react";

const AdminFeedback = () => {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeedback = async () => {
      const { data, error } = await supabase
        .from("feedback")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setFeedback(data as Feedback[]);
      }
      setLoading(false);
    };

    fetchFeedback();
  }, []);

  const averageRating = feedback.length > 0
    ? (feedback.filter((f) => f.rating).reduce((sum, f) => sum + (f.rating || 0), 0) / feedback.filter((f) => f.rating).length).toFixed(1)
    : "N/A";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">User Feedback</h1>
          <p className="text-muted-foreground">
            View feedback submitted by users
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{feedback.length}</p>
                <p className="text-sm text-muted-foreground">Total Feedback</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <Star className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{averageRating}</p>
                <p className="text-sm text-muted-foreground">Average Rating</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                <User className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{feedback.filter((f) => f.is_anonymous).length}</p>
                <p className="text-sm text-muted-foreground">Anonymous</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feedback List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : feedback.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No feedback received yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {feedback.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full capitalize">
                        {item.category}
                      </span>
                      {item.is_anonymous && (
                        <span className="px-2 py-1 bg-muted text-muted-foreground text-xs font-medium rounded-full">
                          Anonymous
                        </span>
                      )}
                    </div>
                    {item.rating && (
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= item.rating!
                                ? "fill-warning text-warning"
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-foreground">{item.message}</p>
                  <p className="text-xs text-muted-foreground mt-3">
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminFeedback;
