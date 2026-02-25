import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/hooks/useWallet";
import { useProfile } from "@/hooks/useProfile";
import { useFreelancerBids, useFreelancerActiveTasks, useFreelancerCompletedTasks } from "@/hooks/useFreelancerBids";
import { WithdrawalDialog } from "@/components/dashboard/WithdrawalDialog";
import {
  Briefcase,
  Wallet,
  Star,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
  DollarSign,
  AlertCircle,
  Search,
  FileText,
} from "lucide-react";

const FreelancerDashboard = () => {
  const [withdrawalOpen, setWithdrawalOpen] = useState(false);
  const { user } = useAuth();
  const { data: wallet, isLoading: walletLoading } = useWallet(user?.id);
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const { data: bids, isLoading: bidsLoading } = useFreelancerBids(user?.id);
  const { data: activeTasks, isLoading: activeTasksLoading } = useFreelancerActiveTasks(user?.id);
  const { data: completedTasks } = useFreelancerCompletedTasks(user?.id);

  const pendingBids = bids?.filter(b => b.status === "pending") || [];

  const stats = [
    {
      title: "Available Balance",
      value: walletLoading ? null : `$${(wallet?.available_balance || 0).toLocaleString()}`,
      icon: Wallet,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Pending Balance",
      value: walletLoading ? null : `$${(wallet?.pending_balance || 0).toLocaleString()}`,
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Completed Jobs",
      value: completedTasks?.length || 0,
      icon: CheckCircle2,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Pending Bids",
      value: pendingBids.length,
      icon: FileText,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
  ];

  const isLoading = walletLoading || profileLoading || bidsLoading || activeTasksLoading;

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
                    {profile?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || "F"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold">
                    Welcome back, {profile?.full_name?.split(" ")[0] || "Freelancer"}!
                  </h1>
                  <p className="text-muted-foreground">Here's an overview of your freelance activity</p>
                </div>
              </>
            )}
          </div>
          <Link to="/marketplace">
            <Button className="gradient-hero border-0 gap-2">
              <Search className="h-4 w-4" />
              Find Tasks
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
          {/* Active Tasks */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Active Projects
                </CardTitle>
                <Badge variant="secondary">{activeTasks?.length || 0}</Badge>
              </CardHeader>
              <CardContent>
                {activeTasksLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex-1">
                          <Skeleton className="h-5 w-48 mb-2" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                      </div>
                    ))}
                  </div>
                ) : activeTasks && activeTasks.length > 0 ? (
                  <div className="space-y-4">
                    {activeTasks.map((task) => (
                      <Link key={task.id} to={`/tasks/${task.id}`}>
                        <div className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{task.title}</h4>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <span>{task.client_profile?.full_name || "Client"}</span>
                              <StatusBadge status="in_progress" />
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="font-bold text-accent">${task.accepted_amount}</div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto mt-1" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No active projects</p>
                    <Link to="/marketplace">
                      <Button>Browse Tasks</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Bids */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Your Bids
                </CardTitle>
                <Badge variant="secondary">{bids?.length || 0}</Badge>
              </CardHeader>
              <CardContent>
                {bidsLoading ? (
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
                ) : bids && bids.length > 0 ? (
                  <div className="space-y-4">
                    {bids.slice(0, 5).map((bid) => (
                      <Link key={bid.id} to={`/tasks/${bid.task_id}`}>
                        <div className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{bid.task?.title || "Task"}</h4>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <span>Your bid: ${bid.amount}</span>
                              <Badge 
                                variant={
                                  bid.status === "accepted" ? "default" : 
                                  bid.status === "rejected" ? "destructive" : 
                                  "secondary"
                                }
                                className="capitalize"
                              >
                                {bid.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-sm text-muted-foreground">Task Budget</div>
                            <div className="font-bold">${bid.task?.budget}</div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No bids submitted yet</p>
                    <Link to="/marketplace">
                      <Button>Find Tasks to Bid On</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Wallet Card */}
            <Card className="gradient-hero text-primary-foreground">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Your Wallet</h3>
                  <Wallet className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-primary-foreground/70 text-sm">Available</p>
                    {walletLoading ? (
                      <Skeleton className="h-9 w-32 bg-primary-foreground/20" />
                    ) : (
                      <p className="text-3xl font-bold">
                        ${(wallet?.available_balance || 0).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-primary-foreground/70 text-sm">Pending</p>
                    {walletLoading ? (
                      <Skeleton className="h-7 w-24 bg-primary-foreground/20" />
                    ) : (
                      <p className="text-xl font-semibold">
                        ${(wallet?.pending_balance || 0).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  className="w-full mt-6 bg-card text-foreground hover:bg-card/90"
                  onClick={() => setWithdrawalOpen(true)}
                  disabled={!wallet || wallet.available_balance <= 0}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Withdraw Funds
                </Button>
              </CardContent>
            </Card>

            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your Skills</CardTitle>
              </CardHeader>
              <CardContent>
                {profileLoading ? (
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-6 w-20" />
                    ))}
                  </div>
                ) : profile?.skills && profile.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No skills added yet</p>
                )}
              </CardContent>
            </Card>

            {/* Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Completed Jobs</span>
                  <span className="font-semibold">{completedTasks?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Projects</span>
                  <span className="font-semibold">{activeTasks?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pending Bids</span>
                  <span className="font-semibold">{pendingBids.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {user && (
        <WithdrawalDialog
          open={withdrawalOpen}
          onOpenChange={setWithdrawalOpen}
          userId={user.id}
          availableBalance={wallet?.available_balance || 0}
        />
      )}
    </div>
  );
};

export default FreelancerDashboard;
