import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Wallet {
  id: string;
  user_id: string;
  available_balance: number;
  pending_balance: number;
  created_at: string;
  updated_at: string;
}

export const useWallet = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["wallet", userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data as Wallet | null;
    },
    enabled: !!userId,
  });
};
