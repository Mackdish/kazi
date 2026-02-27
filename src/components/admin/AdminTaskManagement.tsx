import { useState, useMemo } from "react";
import { useAdminTasks, useUpdateTaskStatus, useAssignTaskToFreelancer, useCompleteTask, useAdminFreelancers } from "@/hooks/useAdminTaskManagement";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Briefcase, Search, CheckCircle2, Clock, AlertCircle, Zap } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type TaskStatus = Database["public"]["Enums"]["task_status"];

const AdminTaskManagement = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  const { data: tasks, isLoading, error } = useAdminTasks(
    statusFilter === "all" ? undefined : (statusFilter as TaskStatus)
  );
  const { data: freelancers, isLoading: freelancersLoading } = useAdminFreelancers();
  const updateTaskStatus = useUpdateTaskStatus();
  const assignTask = useAssignTaskToFreelancer();
  const completeTask = useCompleteTask();

  const selectedTask = useMemo(
    () => tasks?.find((t) => t.id === selectedTaskId),
    [selectedTaskId, tasks]
  );

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter((task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.client_profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tasks, searchQuery]);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await updateTaskStatus.mutateAsync({ taskId, status: newStatus });
      toast({
        title: "Success",
        description: `Task status updated to ${newStatus.replace("_", " ")}`,
      });
    } catch (err) {
      console.error("Failed to update task status:", err);
      toast({
        title: "Error",
        description: "Failed to update task status. Make sure you have admin access.",
        variant: "destructive",
      });
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await completeTask.mutateAsync(taskId);
      toast({
        title: "Success",
        description: "Task marked as completed",
      });
    } catch (err) {
      console.error("Failed to complete task:", err);
      toast({
        title: "Error",
        description: "Failed to mark task as completed. Make sure you have admin access.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4" />;
      case "in_progress":
        return <Zap className="h-4 w-4" />;
      case "open":
        return <Clock className="h-4 w-4" />;
      case "cancelled":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-700 border-green-200";
      case "in_progress":
        return "bg-blue-500/10 text-blue-700 border-blue-200";
      case "open":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-200";
      case "cancelled":
        return "bg-red-500/10 text-red-700 border-red-200";
      default:
        return "";
    }
  };

  const getErrorMessage = (err: unknown): string => {
    if (!err) return "Unknown error occurred";
    
    // Handle Error objects
    if (err instanceof Error) {
      return err.message;
    }
    
    // Handle objects with message property
    if (typeof err === "object" && "message" in err) {
      return String((err as any).message);
    }
    
    // Handle Supabase error objects
    if (typeof err === "object" && "error_description" in err) {
      return String((err as any).error_description);
    }
    
    // Fallback to string conversion
    return String(err);
  };

  if (error) {
    const errorMessage = getErrorMessage(error);
    console.error("Task loading error:", error);
    
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6 space-y-2">
          <p className="text-destructive font-semibold">Error loading tasks</p>
          <p className="text-destructive text-sm">{errorMessage}</p>
          {errorMessage.includes("Admin") || errorMessage.includes("authenticated") ? (
            <p className="text-destructive/70 text-xs">
              You need admin access to view the task management dashboard.
            </p>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div>
          <h2 className="text-xl font-semibold">Task Management</h2>
          <p className="text-sm text-muted-foreground">Manage, assign, and track all tasks</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as TaskStatus | "all")}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="grid gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="h-6 w-2/3 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-full bg-muted animate-pulse rounded" />
                  <div className="flex gap-2">
                    <div className="h-6 w-16 bg-muted animate-pulse rounded" />
                    <div className="h-6 w-16 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No tasks found</p>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  {/* Task Info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-lg">{task.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {task.description}
                        </p>
                      </div>
                      <Badge className={`${getStatusColor(task.status)}`}>
                        {getStatusIcon(task.status)}
                        <span className="ml-1 capitalize">{task.status.replace("_", " ")}</span>
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-2 items-center mt-4">
                      <Badge variant="secondary">${task.budget}</Badge>
                      {task.category && (
                        <Badge variant="outline">{task.category.name}</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        Client: {task.client_profile?.full_name || "Unknown"}
                      </span>
                      {task.deadline && (
                        <span className="text-xs text-muted-foreground">
                          Due: {new Date(task.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Assigned Freelancer */}
                    {task.accepted_bid && (
                      <div className="mt-3 p-2 bg-accent/5 rounded border border-accent/20">
                        <p className="text-xs font-semibold text-muted-foreground">Assigned to:</p>
                        <p className="text-sm">
                          {task.accepted_bid.freelancer_profile?.full_name || "Unknown freelancer"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Amount: ${task.accepted_bid.amount}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTaskId(task.id);
                        setShowAssignDialog(true);
                      }}
                      disabled={task.accepted_bid ? true : false}
                    >
                      {task.accepted_bid ? "Assigned" : "Assign"}
                    </Button>

                    {task.status === "in_progress" && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleCompleteTask(task.id)}
                        disabled={completeTask.isPending}
                      >
                        {completeTask.isPending ? "..." : "Mark Complete"}
                      </Button>
                    )}

                    {task.status !== "cancelled" && task.status !== "completed" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStatusChange(task.id, "cancelled")}
                        disabled={updateTaskStatus.isPending}
                      >
                        Cancel
                      </Button>
                    )}

                    {task.status !== "in_progress" && task.status !== "completed" && (
                      <Select
                        value={task.status}
                        onValueChange={(value) =>
                          handleStatusChange(task.id, value as TaskStatus)
                        }
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Assignment Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Task to Freelancer</DialogTitle>
            <DialogDescription>
              Select a freelancer to assign this task to.
            </DialogDescription>
          </DialogHeader>

          {selectedTask && (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div className="space-y-2">
                <p className="text-sm font-semibold">Task: {selectedTask.title}</p>
                <p className="text-xs text-muted-foreground">{selectedTask.description}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Available Freelancers:</p>
                {freelancersLoading ? (
                  <p className="text-sm text-muted-foreground">Loading freelancers...</p>
                ) : freelancers && freelancers.length > 0 ? (
                  <div className="space-y-2">
                    {freelancers.map((freelancer) => (
                      <Button
                        key={freelancer.user_id}
                        variant="outline"
                        className="w-full justify-start h-auto"
                        onClick={() => {
                          // In a real scenario, you would select a bid here
                          // For now, this would require a proper UI for selecting bids
                          // This is a simplified flow - in production you'd need to handle bid selection
                          console.log("Selected freelancer:", freelancer.user_id);
                          setShowAssignDialog(false);
                        }}
                      >
                        <div className="text-left">
                          <p className="font-semibold">{freelancer.full_name || "Unknown"}</p>
                          {freelancer.bio && (
                            <p className="text-xs text-muted-foreground">{freelancer.bio}</p>
                          )}
                          {freelancer.skills && freelancer.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {freelancer.skills.slice(0, 3).map((skill) => (
                                <Badge key={skill} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No freelancers available</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTaskManagement;
