import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type BidStatus = Database["public"]["Enums"]["bid_status"];
type TaskStatus = Database["public"]["Enums"]["task_status"];

export interface BidWithTask {
  id: string;
  amount: number;
  proposal: string;
  status: BidStatus;
  created_at: string;
  updated_at: string;
  task_id: string;
  freelancer_id: string;
  task: {
    id: string;
    title: string;
    budget: number;
    status: TaskStatus;
    deadline: string | null;
    client_id: string;
    client_profile: {
      full_name: string | null;
      avatar_url: string | null;
    } | null;
  } | null;
}

export const useFreelancerBids = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["freelancer-bids", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data: bids, error } = await supabase
        .from("bids")
        .select(`
          *,
          task:tasks(id, title, budget, status, deadline, client_id)
        `)
        .eq("freelancer_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      // Fetch client profiles for the tasks
      const clientIds = [...new Set(bids?.map(b => b.task?.client_id).filter(Boolean) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", clientIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return (bids || []).map(bid => ({
        ...bid,
        task: bid.task ? {
          ...bid.task,
          client_profile: profileMap.get(bid.task.client_id) || null
        } : null
      })) as BidWithTask[];
    },
    enabled: !!userId,
  });
};

export const useFreelancerActiveTasks = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["freelancer-active-tasks", userId],
    queryFn: async () => {
      if (!userId) return [];

      // Get accepted bids for this freelancer
      const { data: acceptedBids, error: bidsError } = await supabase
        .from("bids")
        .select(`
          *,
          task:tasks(
            id, title, budget, status, deadline, client_id,
            category:categories(id, name)
          )
        `)
        .eq("freelancer_id", userId)
        .eq("status", "accepted");

      if (bidsError) {
        throw bidsError;
      }

      // Filter to only include tasks that are in_progress
      const activeTasks = (acceptedBids || [])
        .filter(bid => bid.task && bid.task.status === "in_progress")
        .map(bid => ({
          ...bid.task,
          accepted_amount: bid.amount
        }));

      // Fetch client profiles
      const clientIds = [...new Set(activeTasks.map(t => t?.client_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", clientIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return activeTasks.map(task => ({
        ...task,
        client_profile: profileMap.get(task?.client_id || "") || null
      }));
    },
    enabled: !!userId,
  });
};

export const useFreelancerCompletedTasks = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["freelancer-completed-tasks", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data: acceptedBids, error } = await supabase
        .from("bids")
        .select(`
          *,
          task:tasks(id, title, budget, status, deadline, client_id)
        `)
        .eq("freelancer_id", userId)
        .eq("status", "accepted");

      if (error) {
        throw error;
      }

      // Filter to only completed tasks
      return (acceptedBids || [])
        .filter(bid => bid.task && bid.task.status === "completed")
        .map(bid => ({
          ...bid.task,
          completed_amount: bid.amount
        }));
    },
    enabled: !!userId,
  });
};
