import { cn } from "@/lib/utils";

// Support both database task_status and UI-only statuses
export type TaskStatus = "open" | "in_progress" | "completed" | "cancelled" | "escrow" | "paid";

interface StatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  open: {
    label: "Open",
    className: "status-open",
  },
  in_progress: {
    label: "In Progress",
    className: "status-in-progress",
  },
  completed: {
    label: "Completed",
    className: "status-completed",
  },
  cancelled: {
    label: "Cancelled",
    className: "status-cancelled",
  },
  escrow: {
    label: "Escrow Held",
    className: "status-escrow",
  },
  paid: {
    label: "Paid",
    className: "status-completed",
  },
};

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = statusConfig[status];
  
  return (
    <span className={cn("status-badge", config.className, className)}>
      {config.label}
    </span>
  );
};

export default StatusBadge;