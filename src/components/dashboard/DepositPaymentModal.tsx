import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { formatCurrency } from "@/hooks/useTaskDeposit";

interface DepositPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle: string;
  budget: number;
  depositAmount: number;
  onPaymentSelected: (method: "stripe" | "mpesa" | "paypal") => Promise<void>;
  isLoading?: boolean;
}

export const DepositPaymentModal = ({
  open,
  onOpenChange,
  taskTitle,
  budget,
  depositAmount,
  onPaymentSelected,
  isLoading = false,
}: DepositPaymentModalProps) => {
  const [selectedMethod, setSelectedMethod] = useState<"stripe" | "mpesa" | "paypal" | "">("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setSelectedMethod("");
      setIsProcessing(false);
    }
  }, [open]);

  const handlePaymentSubmit = async () => {
    if (!selectedMethod) return;

    setIsProcessing(true);
    try {
      await onPaymentSelected(selectedMethod as "stripe" | "mpesa" | "paypal");
    } finally {
      setIsProcessing(false);
      // Don't close modal here - let payment provider handle it
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Pay Task Deposit</DialogTitle>
          <DialogDescription>
            You need to pay 50% deposit before your task can be posted
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Task Summary */}
          <div className="space-y-2 rounded-lg bg-slate-50 p-4">
            <h3 className="font-semibold text-sm">{taskTitle}</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Task Budget:</span>
                <span className="font-medium">{formatCurrency(budget)}</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>50% Deposit Required:</span>
                <span className="font-semibold text-lg">
                  {formatCurrency(depositAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Info Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              The deposit will be held in escrow. It will be released to the
              freelancer once the task is completed, or refunded if no one
              accepts the task.
            </AlertDescription>
          </Alert>

          {/* Payment Method Selection */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Payment Method</Label>
            <RadioGroup 
              value={selectedMethod} 
              onValueChange={(value) => setSelectedMethod(value as "stripe" | "mpesa" | "paypal" | "")}
            >
              <div className="flex items-center space-x-2 rounded-lg border p-3 cursor-pointer hover:bg-slate-50"
                onClick={() => setSelectedMethod("stripe")} >
                <RadioGroupItem value="stripe" id="stripe" />
                <Label htmlFor="stripe" className="flex-1 cursor-pointer">
                  <div className="font-medium">Credit Card</div>
                  <div className="text-sm text-gray-600">
                    Visa, Mastercard, American Express
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 rounded-lg border p-3 cursor-pointer hover:bg-slate-50"
                onClick={() => setSelectedMethod("mpesa")} >
                <RadioGroupItem value="mpesa" id="mpesa" />
                <Label htmlFor="mpesa" className="flex-1 cursor-pointer">
                  <div className="font-medium">M-Pesa</div>
                  <div className="text-sm text-gray-600">
                    Mobile money transfer (Kenya)
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 rounded-lg border p-3 cursor-pointer hover:bg-slate-50"
                onClick={() => setSelectedMethod("paypal")} >
                <RadioGroupItem value="paypal" id="paypal" />
                <Label htmlFor="paypal" className="flex-1 cursor-pointer">
                  <div className="font-medium">PayPal</div>
                  <div className="text-sm text-gray-600">
                    PayPal wallet or bank account
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing || isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePaymentSubmit}
              disabled={!selectedMethod || isProcessing || isLoading}
              className="flex-1"
            >
              {isProcessing || isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay ${formatCurrency(depositAmount)}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
