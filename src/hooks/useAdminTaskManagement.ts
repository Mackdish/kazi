import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";

type TaskStatus = Database["public"]["Enums"]["task_status"];

export interface AdminTaskWithDetails {
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
  accepted_bid_id: string | null;
  category?: { id: string; name: string } | null;
  client_profile?: { full_name: string | null; avatar_url: string | null } | null;
  accepted_bid?: {
    id: string;
    freelancer_id: string;
    amount: number;
    status: string;
    freelancer_profile?: { full_name: string | null; avatar_url: string | null };
  } | null;
}

// Fetch all tasks for admin with optional status filter
export const useAdminTasks = (status?: TaskStatus) => {
  const { role, user } = useAuth();

  return useQuery({
    queryKey: ["admin-tasks", status, user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      if (role !== "admin") throw new Error("Admin access required");

      let query = supabase
        .from("tasks")
        .select(
          `
          *,
          category:categories(id, name)
        `
        )
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data: tasks, error } = await query;

      if (error) throw error;

      // Fetch bids separately to avoid FK ambiguity
      const taskIds = tasks?.map((t: any) => t.id) || [];
      let allBids: any[] = [];
      
      if (taskIds.length > 0) {
        const { data: bidsData, error: bidsError } = await supabase
          .from("bids")
          .select("id, task_id, freelancer_id, amount, status")
          .in("task_id", taskIds);

        if (bidsError) {
          console.error("Error fetching bids:", bidsError);
        } else {
          allBids = bidsData || [];
        }
      }

      // Fetch all related profiles (clients and freelancers)
      const clientIds = [...new Set(tasks?.map((t: any) => t.client_id) || [])];
      const freelancerIds = [
        ...new Set(
          allBids.map((b: any) => b.freelancer_id) || []
        ),
      ];

      let clientProfilesData = [];
      let freelancerProfilesData = [];

      // Only fetch if there are IDs to fetch
      if (clientIds.length > 0) {
        const { data: clientProfiles, error: clientError } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", clientIds);

        if (clientError) {
          console.error("Error fetching client profiles:", clientError);
        } else {
          clientProfilesData = clientProfiles || [];
        }
      }

      if (freelancerIds.length > 0) {
        const { data: freelancerProfiles, error: freelancerError } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", freelancerIds);

        if (freelancerError) {
          console.error("Error fetching freelancer profiles:", freelancerError);
        } else {
          freelancerProfilesData = freelancerProfiles || [];
        }
      }

      const clientProfileMap = new Map(
        clientProfilesData?.map((p) => [p.user_id, p]) || []
      );
      const freelancerProfileMap = new Map(
        freelancerProfilesData?.map((p) => [p.user_id, p]) || []
      );

      // Create a map of bids by task_id for easy lookup
      const bidsByTask = new Map<string, any[]>();
      allBids.forEach((bid) => {
        if (!bidsByTask.has(bid.task_id)) {
          bidsByTask.set(bid.task_id, []);
        }
        bidsByTask.get(bid.task_id)!.push(bid);
      });

      return (tasks || []).map((task: any) => {
        const taskBids = bidsByTask.get(task.id) || [];
        const acceptedBid = taskBids.find((b) => b.id === task.accepted_bid_id);
        
        return {
          ...task,
          client_profile: clientProfileMap.get(task.client_id) || null,
          accepted_bid: acceptedBid
            ? {
                ...acceptedBid,
                freelancer_profile: freelancerProfileMap.get(acceptedBid.freelancer_id) || null,
              }
            : null,
        };
      }) as AdminTaskWithDetails[];
    },
    enabled: !!user && role === "admin",
  });
};

// Update task status (completed, pending, cancelled)
export const useUpdateTaskStatus = () => {
  const { role, user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      status,
    }: {
      taskId: string;
      status: TaskStatus;
    }) => {
      if (!user) throw new Error("User not authenticated");
      if (role !== "admin") throw new Error("Admin access required");

      const { data, error } = await supabase
        .from("tasks")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tasks"] });
    },
  });
};

// Assign a freelancer to a task (accept a bid)
export const useAssignTaskToFreelancer = () => {
  const { role, user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      bidId,
    }: {
      taskId: string;
      bidId: string;
    }) => {
      if (!user) throw new Error("User not authenticated");
      if (role !== "admin") throw new Error("Admin access required");

      // Call the admin function to accept bid
      const { data, error } = await supabase.rpc("accept_bid_admin", {
        _bid_id: bidId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tasks"] });
    },
  });
};

// Mark task as completed
export const useCompleteTask = () => {
  const { role, user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      if (!user) throw new Error("User not authenticated");
      if (role !== "admin") throw new Error("Admin access required");

      const { data, error } = await supabase
        .from("tasks")
        .update({
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tasks"] });
    },
  });
};

// Fetch freelancers for task assignment
export const useAdminFreelancers = () => {
  const { role, user } = useAuth();

  return useQuery({
    queryKey: ["admin-freelancers", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      if (role !== "admin") throw new Error("Admin access required");

      // Get all users with freelancer role
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "freelancer");

      if (rolesError) throw rolesError;
      if (!roles || roles.length === 0) return [];

      const userIds = roles.map((r) => r.user_id);

      // Get profiles for these freelancers
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, bio, avatar_url, skills, created_at")
        .in("user_id", userIds);

      if (error) throw error;

      return profiles || [];
    },
    enabled: !!user && role === "admin",
  });
};

// Fetch clients for management
export const useAdminClients = () => {
  const { role, user } = useAuth();

  return useQuery({
    queryKey: ["admin-clients", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      if (role !== "admin") throw new Error("Admin access required");

      // Get all users with client role
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "client");

      if (rolesError) throw rolesError;
      if (!roles || roles.length === 0) return [];

      const userIds = roles.map((r) => r.user_id);

      // Get profiles for these clients
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, bio, avatar_url, created_at")
        .in("user_id", userIds);

      if (error) throw error;

      return profiles || [];
    },
    enabled: !!user && role === "admin",
  });
};

// Disable/restrict a user
export const useSuspendUser = () => {
  const { role, user } = useAuth();

  return useMutation({
    mutationFn: async (userId: string) => {
      if (!user) throw new Error("User not authenticated");
      if (role !== "admin") throw new Error("Admin access required");

      const { data, error } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { suspended: true },
      });

      if (error) throw error;
      return data;
    },
  });
};
