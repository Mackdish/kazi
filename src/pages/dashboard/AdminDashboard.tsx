import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminTaskManagement from "@/components/admin/AdminTaskManagement";
import ClientFreelancerManagement from "@/components/admin/ClientFreelancerManagement";
// removed mock data imports — fetching live data from Supabase
import {
  Users,
  Briefcase,
  DollarSign,
  AlertTriangle,
  Search,
  Settings,
  Shield,
  TrendingUp,
  BarChart3,
  Ban,
  CheckCircle2,
  Clock,
  ArrowUpRight,
} from "lucide-react";

const AdminDashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: totalUsersCount, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ["admin", "total-users"],
    queryFn: async () => {
    const { count, error } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true });

    if (error) throw error;
    return count ?? 0;
    },
  });

  const { data: activeTasksCount, isLoading: tasksLoading, error: tasksError } = useQuery({
    queryKey: ["admin", "active-tasks"],
    queryFn: async () => {
    const { count, error } = await supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "in_progress"]);

    if (error) throw error;
    return count ?? 0;
    },
  });

  const { data: totalRevenue, isLoading: revenueLoading, error: revenueError } = useQuery({
    queryKey: ["admin", "total-revenue"],
    queryFn: async () => {
    const { data, error } = await supabase
      .from("transactions")
      .select("amount")
      .eq("escrow_status", "released");

    if (error) throw error;
    return (data || []).reduce((s, t) => s + (t.amount || 0), 0);
    },
  });

  const { data: pendingWithdrawals, isLoading: withdrawalsLoading, error: withdrawalsError } = useQuery({
    queryKey: ["admin", "pending-withdrawals"],
    queryFn: async () => {
      const { data: withdrawals, error } = await supabase
        .from("withdrawals")
        .select("id, user_id, amount, method, created_at, status")
        .eq("status", "requested")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      const userIds = [...new Set((withdrawals || []).map((w) => w.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name]));

      return (withdrawals || []).map((w) => ({
        ...w,
        user_name: profileMap.get(w.user_id) || w.user_id,
      }));
    },
  });

  const { data: recentUsers, isLoading: recentUsersLoading, error: recentUsersError } = useQuery({
    queryKey: ["admin", "recent-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
  });

  const { data: recentTasks, isLoading: recentTasksLoading, error: recentTasksError } = useQuery({
    queryKey: ["admin", "recent-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, budget, status, created_at, client_id")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
  });

  const stats = [
    {
      title: "Total Users",
      value: usersLoading ? "..." : String(totalUsersCount || 0),
      change: "",
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Active Tasks",
      value: tasksLoading ? "..." : String(activeTasksCount || 0),
      change: "",
      icon: Briefcase,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Total Revenue",
      value: revenueLoading ? "..." : `$${(totalRevenue || 0).toLocaleString()}`,
      change: "",
      icon: DollarSign,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Pending Withdrawals",
      value: withdrawalsLoading ? "..." : String(pendingWithdrawals?.length || 0),
      change: "",
      icon: AlertTriangle,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
  ];

  const anyError = usersError || tasksError || revenueError || withdrawalsError || recentUsersError || recentTasksError;

  if (anyError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="container">
          <div className="rounded-lg p-6 bg-destructive/5 border border-destructive">
            <h2 className="text-xl font-semibold text-destructive mb-2">Error loading admin data</h2>
            <pre className="text-sm text-destructive/90 whitespace-pre-wrap">{String(anyError)}</pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <div className="container py-8 flex-1">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users, tasks, and platform settings</p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users, tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className={`h-12 w-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <Badge variant={stat.change.startsWith("+") ? "default" : "secondary"} className="gap-1">
                    <ArrowUpRight className="h-3 w-3" />
                    {stat.change}
                  </Badge>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2">
              <Briefcase className="h-4 w-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="disputes" className="gap-2">
              <Shield className="h-4 w-4" />
              Disputes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <ClientFreelancerManagement />
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Pending Withdrawals</CardTitle>
                  <Badge variant="secondary">{withdrawalsLoading ? "..." : pendingWithdrawals?.length || 0}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(withdrawalsLoading ? new Array(3).fill(null) : pendingWithdrawals || []).map((w, idx) =>
                      w ? (
                        <div key={w.id} className="flex items-center justify-between p-4 rounded-lg border">
                          <div>
                            <p className="font-medium">{w.user_name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{w.method}</span>
                              <span>•</span>
                              <span>{new Date(w.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-accent">${w.amount}</span>
                            <Button size="sm" className="gradient-accent border-0">
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button size="sm" variant="outline">
                              Reject
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div key={idx} className="p-4 rounded-lg border h-16" />
                      )
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Platform Revenue</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Released</p>
                    <p className="text-2xl font-bold text-accent">{revenueLoading ? "..." : `$${(totalRevenue || 0).toLocaleString()}`}</p>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Platform Fee</span>
                      <span className="font-semibold">10%</span>
                    </div>
                    <Button variant="outline" className="w-full gap-2">
                      <Settings className="h-4 w-4" />
                      Adjust Fee
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tasks">
            <AdminTaskManagement />
          </TabsContent>

          <TabsContent value="disputes">
            <Card>
              <CardHeader>
                <CardTitle>Dispute Resolution</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Dispute management interface coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;