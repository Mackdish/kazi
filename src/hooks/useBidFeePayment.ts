import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BidFeePayment {
  id: string;
  user_id: string;
  task_id: string;
  amount: number;
  phone_number: string;
  checkout_request_id: string | null;
  mpesa_receipt: string | null;
  status: "pending" | "completed" | "failed";
  created_at: string;
  updated_at: string;
}

export const useBidFeePayment = (taskId: string, userId: string | undefined) => {
  return useQuery({
    queryKey: ["bid-fee-payment", taskId, userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("bid_fee_payments")
        .select("*")
        .eq("task_id", taskId)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as BidFeePayment | null;
    },
    enabled: !!taskId && !!userId,
    refetchInterval: (query) => {
      // Poll every 3s while payment is pending
      const data = query.state.data as BidFeePayment | null | undefined;
      return data?.status === "pending" ? 3000 : false;
    },
  });
};

export const useInitiateBidFeePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      taskId,
      phoneNumber,
    }: {
      userId: string;
      taskId: string;
      phoneNumber: string;
    }) => {
      // 1. Create payment record
      const { data: payment, error: insertError } = await supabase
        .from("bid_fee_payments")
        .insert({
          user_id: userId,
          task_id: taskId,
          amount: 30,
          phone_number: phoneNumber,
          status: "pending",
        })
        .select()
        .single();

      if (insertError) {
        console.error("Failed to create payment record:", insertError);
        throw new Error(`Database error: ${insertError.message}`);
      }

      if (!payment?.id) {
        throw new Error("Payment record created but no ID returned");
      }

      console.log("Payment record created:", { payment_id: payment.id, user_id: userId });

      // 2. Trigger STK push via edge function
      try {
        const { data: stkResult, error: stkError } = await supabase.functions.invoke(
          "mpesa-stk-push",
          {
            body: {
              phone_number: phoneNumber,
              payment_id: payment.id,
              user_id: userId,
              task_id: taskId,
            },
          }
        );

        if (stkError) {
          console.error("Edge function error:", stkError);
          throw new Error(`STK Push failed: ${stkError.message}`);
        }

        if (stkResult?.error) {
          console.error("STK Push error response:", stkResult.error);
          throw new Error(stkResult.error || "STK push failed");
        }

        if (!stkResult?.success) {
          console.error("Unexpected STK response:", stkResult);
          throw new Error("STK push did not return success");
        }

        console.log("STK Push successful:", { 
          request_id: stkResult.request_id,
          message: stkResult.message 
        });

        return { payment, stkResult };
      } catch (stkError) {
        // Delete the payment record if STK push fails
        await supabase.from("bid_fee_payments").delete().eq("id", payment.id);
        throw stkError;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["bid-fee-payment", variables.taskId, variables.userId],
      });
    },
    onError: (error) => {
      console.error("Bid fee payment mutation error:", error);
    },
  });
};
