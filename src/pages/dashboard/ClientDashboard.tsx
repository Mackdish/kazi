import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useClientTasks, useReceivedBids, useClientStats } from "@/hooks/useClientTasks";
import { formatDistanceToNow } from "date-fns";
import {
  Plus,
  Briefcase,
  Clock,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  AlertCircle,
  Users,
  FileText,
} from "lucide-react";

const ClientDashboard = () => {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const { data: tasks, isLoading: tasksLoading } = useClientTasks(user?.id);
  const { data: receivedBids, isLoading: bidsLoading } = useReceivedBids(user?.id);
  const { data: clientStats, isLoading: statsLoading } = useClientStats(user?.id);

  const openTasks = tasks?.filter((t) => t.status === "open") || [];
  const activeTasks = tasks?.filter((t) => t.status === "in_progress") || [];
  const completedTasks = tasks?.filter((t) => t.status === "completed") || [];
  const pendingBids = receivedBids?.filter((b) => b.status === "pending") || [];

  const stats = [
    {
      title: "Posted Tasks",
      value: tasksLoading ? null : tasks?.length || 0,
      icon: Briefcase,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Open Tasks",
      value: tasksLoading ? null : openTasks.length,
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "In Progress",
      value: tasksLoading ? null : activeTasks.length,
      icon: Users,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Total Spent",
      value: statsLoading ? null : `$${(clientStats?.totalSpent || 0).toLocaleString()}`,
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <div className="container py-8 flex-1">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            {profileLoading ? (
              <>
                <Skeleton className="h-16 w-16 rounded-full" />
                <div>
                  <Skeleton className="h-8 w-48 mb-2" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </>
            ) : (
              <>
                <Avatar className="h-16 w-16">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback>
                    {profile?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || "C"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold">
                    Welcome back, {profile?.full_name?.split(" ")[0] || "Client"}!
                  </h1>
                  <p className="text-muted-foreground">Manage your tasks and find talent</p>
                </div>
              </>
            )}
          </div>
          <Link to="/post-task">
            <Button className="gradient-hero border-0 gap-2">
              <Plus className="h-4 w-4" />
              Post a Task
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    {stat.value === null ? (
                      <Skeleton className="h-8 w-20" />
                    ) : (
                      <p className="text-2xl font-bold">{stat.value}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* My Tasks */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  My Tasks
                </CardTitle>
                <Badge variant="secondary">{tasks?.length || 0}</Badge>
              </CardHeader>
              <CardContent>
                {tasksLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex-1">
                          <Skeleton className="h-5 w-48 mb-2" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                      </div>
                    ))}
                  </div>
                ) : tasks && tasks.length > 0 ? (
                  <div className="space-y-4">
                    {tasks.slice(0, 5).map((task) => (
                      <Link key={task.id} to={`/tasks/${task.id}`}>
                        <div className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{task.title}</h4>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <span>{task.bids_count} bids</span>
                              <StatusBadge status={task.status} />
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="font-bold text-accent">${task.budget}</div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto mt-1" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No tasks yet</p>
                    <Link to="/post-task">
                      <Button>Post Your First Task</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Bids Received */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Bids Received
                </CardTitle>
                <Badge variant="secondary">{pendingBids.length} pending</Badge>
              </CardHeader>
              <CardContent>
                {bidsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div>
                            <Skeleton className="h-5 w-32 mb-1" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </div>
                        <Skeleton className="h-6 w-16" />
                      </div>
                    ))}
                  </div>
                ) : receivedBids && receivedBids.length > 0 ? (
                  <div className="space-y-4">
                    {receivedBids.slice(0, 5).map((bid) => (
                      <Link key={bid.id} to={`/tasks/${bid.task_id}`}>
                        <div className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={bid.freelancer_profile?.avatar_url || undefined} />
                              <AvatarFallback>
                                {bid.freelancer_profile?.full_name?.[0] || "F"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {bid.freelancer_profile?.full_name || "Freelancer"}
                              </p>
                              <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                                on "{bid.task?.title}"
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-accent">${bid.amount}</div>
                            <Badge 
                              variant={
                                bid.status === "accepted" ? "default" : 
                                bid.status === "rejected" ? "destructive" : 
                                "secondary"
                              }
                              className="capitalize text-xs"
                            >
                              {bid.status}
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No bids received yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/post-task" className="block">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Plus className="h-4 w-4" />
                    Post New Task
                  </Button>
                </Link>
                <Link to="/marketplace" className="block">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Users className="h-4 w-4" />
                    Browse Marketplace
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pending Actions */}
            <Card className="border-warning/30 bg-warning/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-warning" />
                  Pending Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Open tasks</span>
                  <Badge variant="secondary">{openTasks.length}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Active projects</span>
                  <Badge variant="secondary">{activeTasks.length}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Bids to review</span>
                  <Badge variant="secondary">{pendingBids.length}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Stats Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Completed Tasks</span>
                  <span className="font-semibold">{completedTasks.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Spent</span>
                  <span className="font-semibold">
                    ${(clientStats?.totalSpent || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">In Escrow</span>
                  <span className="font-semibold text-warning">
                    ${(clientStats?.inEscrow || 0).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            {receivedBids && receivedBids.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm">
                    {receivedBids.slice(0, 3).map((bid) => (
                      <div key={bid.id} className="flex gap-3">
                        <div className={`h-2 w-2 rounded-full mt-2 ${
                          bid.status === "pending" ? "bg-warning" :
                          bid.status === "accepted" ? "bg-accent" : "bg-muted"
                        }`}></div>
                        <div>
                          <p>
                            {bid.status === "pending" ? "New bid" : `Bid ${bid.status}`} on "{bid.task?.title}"
                          </p>
                          <p className="text-muted-foreground">
                            {formatDistanceToNow(new Date(bid.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
