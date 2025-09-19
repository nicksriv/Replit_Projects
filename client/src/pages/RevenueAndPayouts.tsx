import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { RevenueRecord, Payout } from "@shared/schema";
import { insertPayoutSchema, type InsertPayout } from "@shared/schema";
import {
  DollarSignIcon,
  TrendingUpIcon,
  CreditCardIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertCircleIcon,
  PlusIcon,
  EyeIcon,
  CalendarIcon
} from "lucide-react";

export const RevenueAndPayouts = (): JSX.Element => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isPayoutDialogOpen, setIsPayoutDialogOpen] = useState(false);

  // Fetch revenue data
  const { data: revenueRecords = [], isLoading: isLoadingRevenue } = useQuery<RevenueRecord[]>({
    queryKey: ["/api/revenue"],
  });

  const { data: totalRevenueData } = useQuery<{ total: number }>({
    queryKey: ["/api/revenue/total"],
  });

  const { data: balanceData } = useQuery<{ balance: number }>({
    queryKey: ["/api/revenue/balance"],
  });

  // Fetch payout data
  const { data: payouts = [], isLoading: isLoadingPayouts } = useQuery<Payout[]>({
    queryKey: ["/api/payouts"],
  });

  // Payout form
  const form = useForm<InsertPayout>({
    resolver: zodResolver(insertPayoutSchema),
    defaultValues: {
      amount: "",
      paymentMethod: "paypal",
      accountDetails: "",
      notes: "",
    },
  });

  const createPayoutMutation = useMutation({
    mutationFn: async (payoutData: InsertPayout) => {
      const response = await apiRequest("POST", "/api/payouts", payoutData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payouts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/revenue/balance"] });
      toast({
        title: "Payout Request Submitted",
        description: "Your payout request has been submitted for processing.",
      });
      setIsPayoutDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error Submitting Payout",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmitPayout = (data: InsertPayout) => {
    createPayoutMutation.mutate(data);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
      case "processing":
        return <ClockIcon className="h-4 w-4 text-blue-600" />;
      case "pending":
        return <AlertCircleIcon className="h-4 w-4 text-yellow-600" />;
      case "failed":
        return <XCircleIcon className="h-4 w-4 text-red-600" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const totalRevenue = totalRevenueData?.total || 0;
  const availableBalance = balanceData?.balance || 0;
  const totalPayouts = payouts
    .filter(p => p.status === "completed")
    .reduce((sum, payout) => sum + parseFloat(payout.amount || "0"), 0);

  return (
    <div className="min-h-screen bg-[#f5f6f8] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="heading-revenue-payouts">
              Revenue & Payouts
            </h1>
            <p className="text-gray-600 mt-1">
              Track your earnings and manage payout requests
            </p>
          </div>
          <Dialog open={isPayoutDialogOpen} onOpenChange={setIsPayoutDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-request-payout" className="flex items-center gap-2">
                <PlusIcon className="h-4 w-4" />
                Request Payout
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Payout</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitPayout)} className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      Available Balance: <span className="font-semibold">${availableBalance.toFixed(2)}</span>
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Minimum payout amount is $50.00
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payout Amount (USD) *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSignIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              type="number"
                              step="0.01"
                              min="50"
                              max={availableBalance}
                              placeholder="50.00"
                              className="pl-10"
                              data-testid="input-payout-amount"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Enter the amount you wish to withdraw
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-payment-method">
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="paypal">PayPal</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="stripe">Stripe</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>Choose your preferred payment method</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="accountDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Details *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter your payment account details (e.g., PayPal email, bank account info)"
                            data-testid="textarea-account-details"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Provide the necessary details for payment processing
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any additional notes or instructions"
                            data-testid="textarea-payout-notes"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsPayoutDialogOpen(false)}
                      data-testid="button-cancel-payout"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createPayoutMutation.isPending || availableBalance < 50}
                      data-testid="button-submit-payout"
                    >
                      {createPayoutMutation.isPending ? "Submitting..." : "Submit Request"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Financial Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-revenue">
                ${totalRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Lifetime earnings from courses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
              <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" data-testid="text-available-balance">
                ${availableBalance.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Ready for withdrawal
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
              <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-payouts">
                ${totalPayouts.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Successfully withdrawn
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="revenue" className="space-y-6">
          <TabsList>
            <TabsTrigger value="revenue" data-testid="tab-revenue">Revenue History</TabsTrigger>
            <TabsTrigger value="payouts" data-testid="tab-payouts">Payout History</TabsTrigger>
          </TabsList>

          {/* Revenue History Tab */}
          <TabsContent value="revenue">
            <Card>
              <CardHeader>
                <CardTitle>Revenue History</CardTitle>
                <CardDescription>
                  Track your earnings from course sales and other sources
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingRevenue ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                      </div>
                    ))}
                  </div>
                ) : revenueRecords.length === 0 ? (
                  <div className="text-center py-12">
                    <TrendingUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2" data-testid="text-no-revenue">
                      No revenue yet
                    </h3>
                    <p className="text-gray-600">
                      Start selling courses to see your revenue history here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {revenueRecords.map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                        data-testid={`card-revenue-${record.id}`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline" data-testid={`badge-source-${record.id}`}>
                              {record.source?.replace("_", " ")}
                            </Badge>
                            <span className="text-sm text-gray-500" data-testid={`text-date-${record.id}`}>
                              {record.createdAt ? new Date(record.createdAt).toLocaleDateString() : "N/A"}
                            </span>
                          </div>
                          <p className="font-medium" data-testid={`text-description-${record.id}`}>
                            {record.description || "Course sale"}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-green-600" data-testid={`text-amount-${record.id}`}>
                            +${parseFloat(record.amount || "0").toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payout History Tab */}
          <TabsContent value="payouts">
            <Card>
              <CardHeader>
                <CardTitle>Payout History</CardTitle>
                <CardDescription>
                  View and track your withdrawal requests and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingPayouts ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                        <Skeleton className="h-6 w-20" />
                      </div>
                    ))}
                  </div>
                ) : payouts.length === 0 ? (
                  <div className="text-center py-12">
                    <CreditCardIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2" data-testid="text-no-payouts">
                      No payouts yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Request your first payout when you have earnings available.
                    </p>
                    {availableBalance >= 50 && (
                      <Button onClick={() => setIsPayoutDialogOpen(true)} data-testid="button-first-payout">
                        Request Your First Payout
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {payouts.map((payout) => (
                      <div
                        key={payout.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                        data-testid={`card-payout-${payout.id}`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center gap-1">
                              {getStatusIcon(payout.status || "pending")}
                              <Badge className={getStatusColor(payout.status || "pending")} data-testid={`badge-status-${payout.id}`}>
                                {payout.status || "pending"}
                              </Badge>
                            </div>
                            <Badge variant="outline" data-testid={`badge-method-${payout.id}`}>
                              {payout.paymentMethod?.replace("_", " ")}
                            </Badge>
                            <span className="text-sm text-gray-500" data-testid={`text-requested-date-${payout.id}`}>
                              Requested: {payout.requestedAt ? new Date(payout.requestedAt).toLocaleDateString() : "N/A"}
                            </span>
                          </div>
                          {payout.notes && (
                            <p className="text-sm text-gray-600" data-testid={`text-notes-${payout.id}`}>
                              {payout.notes}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold" data-testid={`text-payout-amount-${payout.id}`}>
                            ${parseFloat(payout.amount || "0").toFixed(2)}
                          </div>
                          {payout.completedAt && (
                            <div className="text-xs text-green-600" data-testid={`text-completed-date-${payout.id}`}>
                              Completed: {new Date(payout.completedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};