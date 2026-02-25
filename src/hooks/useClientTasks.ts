import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type TaskStatus = Database["public"]["Enums"]["task_status"];
type BidStatus = Database["public"]["Enums"]["bid_status"];

export interface ClientTask {
  id: string;
  title: string;
  description: string;
  budget: number;
  deadline: string | null;
  status: TaskStatus;
  client_id: string;
  category_id: string | null;
  created_at: string;
  updated_at: string;
  category: {
    id: string;
    name: string;
  } | null;
  bids_count: number;
}

export interface ReceivedBid {
  id: string;
  amount: number;
  proposal: string;
  status: BidStatus;
  created_at: string;
  task_id: string;
  freelancer_id: string;
  task: {
    id: string;
    title: string;
    budget: number;
    status: TaskStatus;
  } | null;
  freelancer_profile: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export const useClientTasks = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["client-tasks", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data: tasks, error } = await supabase
        .from("tasks")
        .select(`
          *,
          category:categories(id, name)
        `)
        .eq("client_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      // Fetch bid counts for each task
      const taskIds = tasks?.map(t => t.id) || [];
      const { data: bidCounts } = await supabase
        .from("bids")
        .select("task_id")
        .in("task_id", taskIds);

      const bidCountMap = new Map<string, number>();
      bidCounts?.forEach(bid => {
        bidCountMap.set(bid.task_id, (bidCountMap.get(bid.task_id) || 0) + 1);
      });

      return (tasks || []).map(task => ({
        ...task,
        bids_count: bidCountMap.get(task.id) || 0
      })) as ClientTask[];
    },
    enabled: !!userId,
  });
};

export const useReceivedBids = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["received-bids", userId],
    queryFn: async () => {
      if (!userId) return [];

      // First get all tasks owned by this client
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("id, title, budget, status")
        .eq("client_id", userId);

      if (tasksError) {
        throw tasksError;
      }

      if (!tasks || tasks.length === 0) return [];

      const taskIds = tasks.map(t => t.id);
      const taskMap = new Map(tasks.map(t => [t.id, t]));

      // Get all bids for these tasks
      const { data: bids, error: bidsError } = await supabase
        .from("bids")
        .select("*")
        .in("task_id", taskIds)
        .order("created_at", { ascending: false });

      if (bidsError) {
        throw bidsError;
      }

      // Fetch freelancer profiles
      const freelancerIds = [...new Set(bids?.map(b => b.freelancer_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", freelancerIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return (bids || []).map(bid => ({
        ...bid,
        task: taskMap.get(bid.task_id) || null,
        freelancer_profile: profileMap.get(bid.freelancer_id) || null
      })) as ReceivedBid[];
    },
    enabled: !!userId,
  });
};

export const useClientStats = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["client-stats", userId],
    queryFn: async () => {
      if (!userId) return null;

      // Get transactions where this user is the payer
      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("amount, escrow_status")
        .eq("payer_id", userId);

      if (error) {
        throw error;
      }

      const totalSpent = transactions
        ?.filter(t => t.escrow_status === "released")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const inEscrow = transactions
        ?.filter(t => t.escrow_status === "held")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      return {
        totalSpent,
        inEscrow
      };
    },
    enabled: !!userId,
  });
};
