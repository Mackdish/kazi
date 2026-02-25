import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TaskWithCategory } from "./useTasks";

export const useTask = (taskId: string | undefined) => {
  return useQuery({
    queryKey: ["task", taskId],
    queryFn: async () => {
      if (!taskId) return null;

      const { data: task, error } = await supabase
        .from("tasks")
        .select(`
          *,
          category:categories(id, name)
        `)
        .eq("id", taskId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!task) return null;

      // Fetch client profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("user_id", task.client_id)
        .maybeSingle();

      return {
        ...task,
        client_profile: profile || null
      } as TaskWithCategory;
    },
    enabled: !!taskId,
  });
};
