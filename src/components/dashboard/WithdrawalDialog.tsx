import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useSubmitWithdrawal } from "@/hooks/useWithdrawals";
import { DollarSign, Loader2, Smartphone, CreditCard } from "lucide-react";

const withdrawalSchema = z
  .object({
    amount: z.coerce
      .number()
      .min(10, "Minimum withdrawal is $10")
      .positive("Amount must be positive"),
    method: z.enum(["stripe", "mpesa"], {
      required_error: "Please select a withdrawal method",
    }),
    phone_number: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.method === "mpesa") {
        return !!data.phone_number && data.phone_number.length >= 10;
      }
      return true;
    },
    {
      message: "Phone number is required for M-Pesa withdrawals",
      path: ["phone_number"],
    }
  );

type WithdrawalFormValues = z.infer<typeof withdrawalSchema>;

interface WithdrawalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  availableBalance: number;
}

export function WithdrawalDialog({
  open,
  onOpenChange,
  userId,
  availableBalance,
}: WithdrawalDialogProps) {
  const { toast } = useToast();
  const submitWithdrawal = useSubmitWithdrawal();

  const form = useForm<WithdrawalFormValues>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: 0,
      method: undefined,
      phone_number: "",
    },
  });

  const selectedMethod = form.watch("method");

  const onSubmit = async (values: WithdrawalFormValues) => {
    if (values.amount > availableBalance) {
      form.setError("amount", { message: "Insufficient balance" });
      return;
    }

    try {
      await submitWithdrawal.mutateAsync({
        user_id: userId,
        amount: values.amount,
        method: values.method,
        phone_number: values.phone_number,
      });

      toast({
        title: "Withdrawal Requested",
        description: `Your withdrawal of $${values.amount} via ${values.method === "mpesa" ? "M-Pesa" : "Stripe"} has been submitted for processing.`,
      });

      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Withdrawal Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Withdraw Funds
          </DialogTitle>
          <DialogDescription>
            Available balance: <span className="font-semibold text-foreground">${availableBalance.toLocaleString()}</span>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Withdrawal Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="stripe">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Stripe Payout
                        </div>
                      </SelectItem>
                      <SelectItem value="mpesa">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4" />
                          M-Pesa
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      min={10}
                      max={availableBalance}
                      step="0.01"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedMethod === "mpesa" && (
              <FormField
                control={form.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>M-Pesa Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 254712345678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={submitWithdrawal.isPending || availableBalance <= 0}
              >
                {submitWithdrawal.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Request Withdrawal
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
