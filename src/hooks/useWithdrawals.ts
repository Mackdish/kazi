import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type PaymentMethod = Database["public"]["Enums"]["payment_method"];

interface WithdrawalRequest {
  amount: number;
  method: PaymentMethod;
  phone_number?: string;
  user_id: string;
}

export const useWithdrawals = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["withdrawals", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

export const useSubmitWithdrawal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: WithdrawalRequest) => {
      const { data, error } = await supabase
        .from("withdrawals")
        .insert({
          user_id: request.user_id,
          amount: request.amount,
          method: request.method,
          phone_number: request.phone_number || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["withdrawals", variables.user_id] });
      queryClient.invalidateQueries({ queryKey: ["wallet", variables.user_id] });
    },
  });
};
