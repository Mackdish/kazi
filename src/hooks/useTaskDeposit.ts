import { useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

// Calculate 50% deposit for a task budget
export const calculateTaskDeposit = (budget: number): number => {
  return Math.round((budget * 0.5) * 100) / 100;
};

// Format currency for display
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
  }).format(amount);
};

interface UseTaskDepositParams {
  taskId?: string;
  budget?: number;
}

export const useTaskDeposit = ({ taskId, budget }: UseTaskDepositParams = {}) => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch deposit status for a specific task
  const { data: depositStatus, isLoading: isLoadingDeposit } = useQuery({
    queryKey: ["task-deposit", taskId],
    queryFn: async () => {
      if (!taskId) return null;

      const { data, error } = await supabase
        .from("task_deposits")
        .select("*")
        .eq("task_id", taskId)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows found
        throw error;
      }

      return data;
    },
    enabled: !!taskId,
  });

  // Process deposit payment
  const processDepositMutation = useMutation({
    mutationFn: async (params: {
      taskId: string;
      depositAmount: number;
      paymentMethod: "stripe" | "mpesa" | "paypal";
    }) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase.rpc("process_task_deposit", {
        _task_id: params.taskId,
        _deposit_amount: params.depositAmount,
        _payment_method: params.paymentMethod,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Deposit initialized",
        description:
          "Proceeding to payment. You will be redirected to complete the payment.",
      });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.message || "Failed to initialize deposit payment";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Confirm deposit payment (called by payment provider callback)
  const confirmDepositMutation = useMutation({
    mutationFn: async (params: { taskId: string; externalReference: string }) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase.rpc("confirm_deposit_payment", {
        _task_id: params.taskId,
        _external_reference: params.externalReference,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Deposit confirmed",
        description: "Your deposit has been received and task is now posted.",
      });
    },
    onError: (error: any) => {
      const errorMessage =
        error?.message || "Failed to confirm deposit payment";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Create deposit record (for new tasks)
  const createDepositMutation = useMutation({
    mutationFn: async (params: {
      taskId: string;
      depositAmount: number;
      originalBudget: number;
    }) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("task_deposits")
        .insert({
          task_id: params.taskId,
          client_id: user.id,
          deposit_amount: params.depositAmount,
          original_budget: params.originalBudget,
          payment_status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch user's wallet balance
  const { data: wallet } = useQuery({
    queryKey: ["wallet", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching wallet:", error);
      }

      return data;
    },
    enabled: !!user?.id,
  });

  const depositAmount = budget ? calculateTaskDeposit(budget) : 0;

  // Poll for payment confirmation from callback (for M-Pesa/Tuma)
  const pollPaymentStatus = useCallback(
    async (checkoutRequestId: string, maxAttempts = 60, interval = 1000) => {
      let attempts = 0;
      
      while (attempts < maxAttempts) {
        try {
          const { data: payment } = await supabase
            .from("bid_fee_payments")
            .select("status, mpesa_receipt, callback_metadata")
            .eq("checkout_request_id", checkoutRequestId)
            .single();

          if (payment?.status === "completed") {
            console.log("Payment confirmed:", payment);
            return { success: true, payment };
          }

          if (payment?.status === "failed") {
            console.error("Payment failed");
            return { success: false, payment };
          }

          attempts++;
          if (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, interval));
          }
        } catch (error) {
          console.error("Error polling payment status:", error);
          attempts++;
          await new Promise((resolve) => setTimeout(resolve, interval));
        }
      }

      console.warn("Payment confirmation timeout after", maxAttempts, "attempts");
      return { success: false, timedOut: true };
    },
    [supabase]
  );

  const initiatePayment = useCallback(
    async (paymentMethod: "stripe" | "mpesa" | "paypal") => {
      if (!taskId || !budget) {
        toast({
          title: "Error",
          description: "Task ID and budget are required",
          variant: "destructive",
        });
        return;
      }

      try {
        // First, process the deposit to create transaction record
        const result = await processDepositMutation.mutateAsync({
          taskId,
          depositAmount,
          paymentMethod,
        });

        // For M-Pesa/Tuma, poll for payment confirmation
        if (paymentMethod === "mpesa" && result?.checkout_request_id) {
          console.log("Polling for M-Pesa payment confirmation...");
          const confirmationResult = await pollPaymentStatus(
            result.checkout_request_id,
            120, // 2 minutes max
            2000  // poll every 2 seconds
          );

          if (confirmationResult.success) {
            toast({
              title: "Success",
              description: "Payment confirmed successfully",
            });
            return { ...result, confirmed: true };
          } else if (confirmationResult.timedOut) {
            toast({
              title: "Warning",
              description: "Payment confirmation pending. Please check your status.",
              variant: "destructive",
            });
          }
        }

        return result;
      } catch (error) {
        console.error("Payment initiation error:", error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Payment initiation failed",
          variant: "destructive",
        });
      }
    },
    [taskId, budget, depositAmount, processDepositMutation, pollPaymentStatus, toast]
  );

  const confirmPayment = useCallback(
    async (externalReference: string) => {
      if (!taskId) {
        toast({
          title: "Error",
          description: "Task ID is required",
          variant: "destructive",
        });
        return;
      }

      try {
        await confirmDepositMutation.mutateAsync({
          taskId,
          externalReference,
        });
      } catch (error) {
        console.error("Payment confirmation error:", error);
      }
    },
    [taskId, confirmDepositMutation, toast]
  );

  return {
    depositAmount,
    depositStatus,
    isLoadingDeposit,
    wallet,
    initiatePayment,
    confirmPayment,
    processDepositMutation,
    confirmDepositMutation,
    createDepositMutation,
    isProcessing:
      processDepositMutation.isPending || confirmDepositMutation.isPending,
  };
};
