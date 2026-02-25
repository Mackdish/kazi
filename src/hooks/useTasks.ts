import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type TaskStatus = Database["public"]["Enums"]["task_status"];

export interface TaskWithCategory {
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
  client_profile: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export const useTasks = (status?: TaskStatus) => {
  return useQuery({
    queryKey: ["tasks", status],
    queryFn: async () => {
      let query = supabase
        .from("tasks")
        .select(`
          *,
          category:categories(id, name)
        `)
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data: tasks, error } = await query;

      if (error) {
        throw error;
      }

      // Fetch client profiles separately since there's no direct FK
      const clientIds = [...new Set(tasks?.map(t => t.client_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", clientIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return (tasks || []).map(task => ({
        ...task,
        client_profile: profileMap.get(task.client_id) || null
      })) as TaskWithCategory[];
    },
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (error) {
        throw error;
      }

      return data;
    },
  });
};
