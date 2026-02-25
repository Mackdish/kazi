import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, TaskStatus } from "@/components/ui/status-badge";
import { Calendar, DollarSign, User, Clock } from "lucide-react";

export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  deadline: string;
  status: TaskStatus;
  clientName: string;
  bidsCount: number;
  createdAt: string;
}

interface TaskCardProps {
  task: Task;
}

export const TaskCard = ({ task }: TaskCardProps) => {
  const formatBudget = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const daysUntilDeadline = () => {
    const deadline = new Date(task.deadline);
    const today = new Date();
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const days = daysUntilDeadline();

  return (
    <Link to={`/tasks/${task.id}`}>
      <Card className="h-full transition-all duration-200 hover:shadow-elevated hover:-translate-y-1 group cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 flex-1">
              <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
                {task.title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                {task.clientName}
              </div>
            </div>
            <StatusBadge status={task.status} />
          </div>
        </CardHeader>

        <CardContent className="pb-3">
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {task.description}
          </p>
          <Badge variant="secondary" className="text-xs">
            {task.category}
          </Badge>
        </CardContent>

        <CardFooter className="pt-3 border-t flex items-center justify-between">
          <div className="flex items-center gap-1 text-lg font-bold text-accent">
            <DollarSign className="h-4 w-4" />
            {formatBudget(task.budget)}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(task.deadline)}
            </div>
            <div className={`flex items-center gap-1 ${days <= 3 ? "text-destructive" : ""}`}>
              <Clock className="h-3.5 w-3.5" />
              {days > 0 ? `${days}d left` : "Overdue"}
            </div>
          </div>
        </CardFooter>

        <div className="px-6 pb-4">
          <p className="text-xs text-muted-foreground">
            {task.bidsCount} {task.bidsCount === 1 ? "bid" : "bids"}
          </p>
        </div>
      </Card>
    </Link>
  );
};

export default TaskCard;