import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Calendar, DollarSign, User } from "lucide-react";
import { format } from "date-fns";
import { TaskWithCategory } from "@/hooks/useTasks";

interface MarketplaceTaskCardProps {
  task: TaskWithCategory;
}

const MarketplaceTaskCard = ({ task }: MarketplaceTaskCardProps) => {
  const formattedDeadline = task.deadline
    ? format(new Date(task.deadline), "MMM d, yyyy")
    : "No deadline";

  return (
    <Link to={`/tasks/${task.id}`}>
      <Card className="h-full hover:shadow-lg transition-shadow duration-300 border-border/50 hover:border-primary/30">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4 mb-3">
            <h3 className="font-semibold text-lg line-clamp-2 text-foreground">
              {task.title}
            </h3>
            <Badge variant="secondary" className="shrink-0">
              {task.category?.name || "Uncategorized"}
            </Badge>
          </div>
          
          <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
            {task.description}
          </p>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-4 w-4" />
              <span className="font-medium text-foreground">
                ${task.budget.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>{formattedDeadline}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="px-6 py-4 border-t border-border/50 bg-muted/30">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{task.client_profile?.full_name || "Anonymous"}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default MarketplaceTaskCard;
