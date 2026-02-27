import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { ArrowLeft, DollarSign, Calendar, Info, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DepositPaymentModal } from "@/components/dashboard/DepositPaymentModal";
import { calculateTaskDeposit, formatCurrency, useTaskDeposit } from "@/hooks/useTaskDeposit";

const taskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(10, "Title must be at least 10 characters")
    .max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .trim()
    .min(50, "Description must be at least 50 characters")
    .max(2000, "Description must be less than 2000 characters"),
  category_id: z.string().uuid("Please select a category"),
  budget: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Budget must be a positive number")
    .refine((val) => Number(val) >= 5, "Minimum budget is $5")
    .refine((val) => Number(val) <= 100000, "Maximum budget is $100,000"),
  deadline: z
    .string()
    .refine((val) => {
      const date = new Date(val);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    }, "Deadline must be today or in the future"),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface Category {
  id: string;
  name: string;
  icon: string;
}

const PostTask = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState<TaskFormValues | null>(null);
  const { initiatePayment, isProcessing } = useTaskDeposit();

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      category_id: "",
      budget: "",
      deadline: "",
    },
  });

  const budget = form.watch("budget");
  const depositAmount = budget ? calculateTaskDeposit(Number(budget)) : 0;

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, icon")
        .order("name");

      if (error) {
        toast.error("Failed to load categories");
        console.error("Error fetching categories:", error);
      } else {
        setCategories(data || []);
      }
      setIsLoadingCategories(false);
    };

    fetchCategories();
  }, []);

  const onSubmit = async (values: TaskFormValues) => {
    if (!user) {
      toast.error("You must be logged in to post a task");
      return;
    }

    // Step 1: Create the task first
    const { data: taskData, error: taskError } = await supabase
      .from("tasks")
      .insert({
        client_id: user.id,
        title: values.title.trim(),
        description: values.description.trim(),
        category_id: values.category_id,
        budget: Number(values.budget),
        deadline: new Date(values.deadline).toISOString(),
        status: "open",
      })
      .select()
      .single();

    if (taskError) {
      console.error("Error creating task:", taskError);
      toast.error(taskError.message || "Failed to create task");
      return;
    }

    if (!taskData?.id) {
      toast.error("Failed to create task");
      return;
    }

    // Step 2: Store task info and show deposit modal
    setCreatedTaskId(taskData.id);
    setTaskForm(values);
    setShowDepositModal(true);
  };

  const handlePaymentSelected = async (method: "stripe" | "mpesa" | "paypal") => {
    if (!createdTaskId || !taskForm) return;

    try {
      const depositAmount = calculateTaskDeposit(Number(taskForm.budget));
      
      // Initiate payment (this creates the deposit record and transaction)
      const result = await initiatePayment(method);

      if (result?.ok) {
        // In a real implementation, we would redirect to the payment provider
        // For now, show a success message indicating the flow
        toast.success(
          `Payment initiated for ${formatCurrency(depositAmount)}. Redirecting to ${method.toUpperCase()}...`
        );

        // Simulate payment success (in production, this comes from payment provider callback)
        setTimeout(() => {
          setShowDepositModal(false);
          toast.success("Task posted successfully! Freelancers can now submit bids.");
          navigate("/dashboard/client");
        }, 2000);
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error?.message || "Failed to process payment");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <div className="container py-8 flex-1">
        <Link
          to="/dashboard/client"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Post a New Task</h1>
          <p className="text-muted-foreground mb-8">
            Describe your project and start receiving bids from talented freelancers
          </p>

          <Card>
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Task Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Build a modern e-commerce website"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Be specific and descriptive (10-100 characters)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your project in detail. Include requirements, deliverables, and any specific skills needed..."
                            rows={6}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Include all requirements and deliverables (50-2000 characters)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingCategories ? (
                              <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </div>
                            ) : (
                              categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="budget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Budget (USD)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                placeholder="500"
                                className="pl-10"
                                min="5"
                                max="100000"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="deadline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Deadline</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="date"
                                className="pl-10"
                                min={new Date().toISOString().split("T")[0]}
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Deposit Information */}
                  {budget && depositAmount > 0 && (
                    <Alert className="border-emerald-200 bg-emerald-50">
                      <AlertCircle className="h-4 w-4 text-emerald-600" />
                      <AlertDescription className="text-emerald-800">
                        <p className="font-semibold mb-1">50% Deposit Required</p>
                        <p>
                          A deposit of{" "}
                          <span className="font-bold text-lg">{formatCurrency(depositAmount)}</span>{" "}
                          will be collected when you post this task. It will be held in escrow and
                          released to the freelancer upon completion.
                        </p>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="bg-muted rounded-lg p-4 flex gap-3">
                    <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium mb-1">What happens next?</p>
                      <p className="text-muted-foreground">
                        After posting, freelancers will start submitting bids. You can review
                        proposals, chat with candidates, and select the best fit. Payment is
                        held in escrow until you approve the completed work.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(-1)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 gradient-hero border-0"
                      disabled={form.formState.isSubmitting}
                    >
                      {form.formState.isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        "Post Task & Pay Deposit"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Deposit Payment Modal */}
      <DepositPaymentModal
        open={showDepositModal}
        onOpenChange={setShowDepositModal}
        taskTitle={taskForm?.title || ""}
        budget={Number(taskForm?.budget) || 0}
        depositAmount={depositAmount}
        onPaymentSelected={handlePaymentSelected}
        isLoading={isProcessing}
      />

      <Footer />
    </div>
  );
};

export default PostTask;
