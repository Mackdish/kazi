import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { StatusBadge, TaskStatus } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  DollarSign,
  User,
  Briefcase,
  ArrowLeft,
  Shield,
  CheckCircle,
  Loader2,
  Smartphone,
  Phone,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTask } from "@/hooks/useTask";
import { useBidsForTask, useMyBidForTask, useSubmitBid, useAcceptBid } from "@/hooks/useBids";
import { useBidFeePayment, useInitiateBidFeePayment } from "@/hooks/useBidFeePayment";
import { format } from "date-fns";

// Small admin-only assign button component
const AssignButton = ({ bid }: { bid: { id: string; task_id: string; amount: number } }) => {
  const acceptBid = useAcceptBid();

  const handleAccept = async () => {
    const ok = window.confirm("Assign this task to this freelancer? This action will mark the bid as accepted and start the task.");
    if (!ok) return;
    try {
      await acceptBid.mutateAsync({ bidId: bid.id, taskId: bid.task_id });
      toast.success("Bid accepted and task assigned.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to assign bid");
    }
  };

  return (
    <Button size="sm" onClick={handleAccept} disabled={acceptBid.isLoading} className="bg-accent text-accent-foreground">
      {acceptBid.isLoading ? "Assigning..." : "Assign"}
    </Button>
  );
};

const bidSchema = z.object({
  amount: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Amount must be a positive number")
    .refine((val) => Number(val) >= 5, "Minimum bid is $5"),
  proposal: z
    .string()
    .trim()
    .min(50, "Proposal must be at least 50 characters")
    .max(2000, "Proposal must be less than 2000 characters"),
});

type BidFormValues = z.infer<typeof bidSchema>;

const TaskDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const [mpesaPhone, setMpesaPhone] = useState("");
  
  const { data: task, isLoading: taskLoading, error: taskError } = useTask(id);
  const { data: bids = [], isLoading: bidsLoading } = useBidsForTask(id || "");
  const { data: myBid } = useMyBidForTask(id || "", user?.id);
  const { data: bidFeePayment, isLoading: feeLoading } = useBidFeePayment(id || "", user?.id);
  const submitBidMutation = useSubmitBid();
  const initiateBidFee = useInitiateBidFeePayment();

  const form = useForm<BidFormValues>({
    resolver: zodResolver(bidSchema),
    defaultValues: {
      amount: "",
      proposal: "",
    },
  });

  const isFreelancer = role === "freelancer";
  const isTaskOwner = user?.id === task?.client_id;
  const hasPaidFee = bidFeePayment?.status === "completed";
  const feePending = bidFeePayment?.status === "pending";
  const canBid = isFreelancer && task?.status === "open" && !myBid && !isTaskOwner;

  const handlePayBidFee = async () => {
    if (!user || !id) return;
    if (!mpesaPhone || mpesaPhone.length < 10) {
      toast.error("Please enter a valid M-Pesa phone number");
      return;
    }
    try {
      await initiateBidFee.mutateAsync({
        userId: user.id,
        taskId: id,
        phoneNumber: mpesaPhone,
      });
      toast.success("STK push sent! Check your phone to complete payment.");
    } catch (error: any) {
      toast.error(error.message || "Failed to initiate payment");
    }
  };

  if (taskLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="container py-8 flex-1">
          <Skeleton className="h-6 w-40 mb-6" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (taskError || !task) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Task Not Found</h1>
            <p className="text-muted-foreground mb-4">
              This task may have been removed or you don't have permission to view it.
            </p>
            <Link to="/marketplace">
              <Button>Back to Marketplace</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const formatBudget = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No deadline";
    return format(new Date(dateString), "EEEE, MMMM d, yyyy");
  };

  const daysUntilDeadline = () => {
    if (!task.deadline) return null;
    const deadline = new Date(task.deadline);
    const today = new Date();
    const diffTime = deadline.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleSubmitBid = async (values: BidFormValues) => {
    if (!user) {
      toast.error("You must be logged in to submit a bid");
      return;
    }

    if (!id) return;

    try {
      await submitBidMutation.mutateAsync({
        taskId: id,
        freelancerId: user.id,
        amount: Number(values.amount),
        proposal: values.proposal.trim(),
      });
      toast.success("Your bid has been submitted!");
      form.reset();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit bid");
    }
  };

  const days = daysUntilDeadline();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <div className="container py-8">
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Marketplace
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-2">
                    <StatusBadge status={task.status as TaskStatus} />
                    <h1 className="text-2xl md:text-3xl font-bold">{task.title}</h1>
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {task.client_profile?.full_name || "Anonymous"}
                      </div>
                      <Badge variant="secondary">
                        {task.category?.name || "Uncategorized"}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-accent">
                      {formatBudget(task.budget)}
                    </div>
                    <p className="text-sm text-muted-foreground">Budget</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-6 mb-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Deadline: {formatDate(task.deadline)}</span>
                  </div>
                  {days !== null && (
                    <div
                      className={`flex items-center gap-2 ${
                        days <= 3 ? "text-destructive" : ""
                      }`}
                    >
                      <Clock className="h-4 w-4" />
                      <span>{days > 0 ? `${days} days left` : "Overdue"}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>{bids.length} bids</span>
                  </div>
                </div>

                <Separator className="my-6" />

                <div>
                  <h3 className="font-semibold mb-3">Description</h3>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {task.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Bids Section - visible to task owner or admins */}
            {role === "admin" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Bids ({bids.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {bidsLoading ? (
                    <div className="space-y-4">
                      {[...Array(2)].map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                      ))}
                    </div>
                  ) : bids.length > 0 ? (
                    bids.map((bid) => (
                      <div
                        key={bid.id}
                        className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={bid.freelancer_profile?.avatar_url || ""} />
                            <AvatarFallback>
                              {bid.freelancer_profile?.full_name?.[0] || "F"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h4 className="font-semibold">
                                  {bid.freelancer_profile?.full_name || "Anonymous Freelancer"}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  Submitted {format(new Date(bid.created_at), "MMM d, yyyy")}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-xl font-bold text-accent">
                                  {formatBudget(bid.amount)}
                                </div>
                                <Badge
                                  variant={
                                    bid.status === "accepted"
                                      ? "default"
                                      : bid.status === "rejected"
                                      ? "destructive"
                                      : "secondary"
                                  }
                                >
                                  {bid.status}
                                </Badge>
                              </div>
                            </div>
                            <p className="mt-3 text-sm text-muted-foreground whitespace-pre-line">
                              {bid.proposal}
                            </p>
                            {role === "admin" && (
                              <div className="mt-4 flex gap-2">
                                <AssignButton bid={bid} />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No bids yet. Your task is visible in the marketplace.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Your Bid - visible to freelancer who already bid */}
            {myBid && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    Your Bid
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Your bid amount</p>
                      <p className="text-2xl font-bold text-accent">
                        {formatBudget(myBid.amount)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        myBid.status === "accepted"
                          ? "default"
                          : myBid.status === "rejected"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {myBid.status}
                    </Badge>
                  </div>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-sm font-medium mb-2">Your proposal</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {myBid.proposal}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Place Bid Card */}
            {canBid && (
              <Card>
                <CardHeader>
                  <CardTitle>Place Your Bid</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Step 1: Pay bid fee */}
                  {!hasPaidFee && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-muted border border-border">
                        <div className="flex items-center gap-2 mb-2">
                          <Smartphone className="h-5 w-5 text-primary" />
                          <h4 className="font-semibold">Bid Fee Required</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          A fee of <span className="font-bold text-foreground">KES 55</span> is required via M-Pesa before you can place a bid.
                        </p>

                        {feePending ? (
                          <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 text-primary">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm font-medium">
                              Waiting for M-Pesa confirmation...
                            </span>
                          </div>
                        ) : (
                          <>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">M-Pesa Phone Number</label>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="e.g. 0712345678"
                                  value={mpesaPhone}
                                  onChange={(e) => setMpesaPhone(e.target.value)}
                                  className="pl-10"
                                />
                              </div>
                            </div>
                            <Button
                              className="w-full mt-3 gradient-hero border-0"
                              onClick={handlePayBidFee}
                              disabled={initiateBidFee.isPending}
                            >
                              {initiateBidFee.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Sending STK Push...
                                </>
                              ) : (
                                "Pay KES 55 via M-Pesa"
                              )}
                            </Button>
                          </>
                        )}

                        {bidFeePayment?.status === "failed" && (
                          <p className="text-sm text-destructive mt-2">
                            Payment failed. Please try again.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Submit bid (only after payment) */}
                  {hasPaidFee && (
                    <>
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/10 text-accent mb-4">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Bid fee paid ✓</span>
                      </div>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmitBid)} className="space-y-4">
                          <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Your Bid Amount</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                      type="number"
                                      placeholder="Enter amount"
                                      className="pl-10"
                                      min="5"
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
                            name="proposal"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Your Proposal</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Explain why you're the best fit for this task..."
                                    rows={5}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="submit"
                            className="w-full gradient-hero border-0"
                            disabled={submitBidMutation.isPending}
                          >
                            {submitBidMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              "Submit Bid"
                            )}
                          </Button>
                        </form>
                      </Form>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Not logged in prompt */}
            {!user && task.status === "open" && (
              <Card>
                <CardHeader>
                  <CardTitle>Want to Bid?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Sign in as a freelancer to submit your bid on this task.
                  </p>
                  <Link to="/login">
                    <Button className="w-full">Sign In to Bid</Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Task Owner Actions */}
            {isTaskOwner && task.status === "open" && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Task</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    You've received {bids.length} bid{bids.length !== 1 ? "s" : ""} so far.
                    Review proposals below and select the best freelancer.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Escrow Info */}
            <Card className="border-accent/20 bg-accent/5">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                    <Shield className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Secure Escrow</h4>
                    <p className="text-sm text-muted-foreground">
                      Payment is held securely until you approve the completed work.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-4">Payment Methods</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                    <div className="h-8 w-12 gradient-hero rounded flex items-center justify-center">
                      <span className="text-xs font-bold text-primary-foreground">VISA</span>
                    </div>
                    <span className="text-sm">Credit/Debit Card</span>
                    <CheckCircle className="h-4 w-4 text-accent ml-auto" />
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                    <div className="h-8 w-12 gradient-accent rounded flex items-center justify-center">
                      <span className="text-xs font-bold text-accent-foreground">M-P</span>
                    </div>
                    <span className="text-sm">M-Pesa</span>
                    <CheckCircle className="h-4 w-4 text-accent ml-auto" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TaskDetails;
