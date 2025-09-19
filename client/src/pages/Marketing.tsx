import { useState } from "react";
import { useQuery, useMutation, queryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from "recharts";
import {
  PlusIcon, EditIcon, TrashIcon, TrendingUpIcon, UsersIcon, DollarSignIcon,
  MailIcon, ShareIcon, TargetIcon, CalendarIcon, CopyIcon, EyeIcon
} from "lucide-react";
import { 
  insertMarketingCampaignSchema, 
  insertPromotionalCodeSchema,
  insertEmailCampaignSchema,
  insertSocialMediaPostSchema,
  type MarketingCampaign, 
  type PromotionalCode,
  type EmailCampaign,
  type SocialMediaPost,
  type InsertMarketingCampaign,
  type InsertPromotionalCode,
  type InsertEmailCampaign,
  type InsertSocialMediaPost
} from "@shared/schema";
import { format, subDays } from "date-fns";

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

export default function Marketing() {
  const [selectedCampaign, setSelectedCampaign] = useState<MarketingCampaign | null>(null);
  const [createCampaignOpen, setCreateCampaignOpen] = useState(false);
  const [createCodeOpen, setCreateCodeOpen] = useState(false);
  const [createEmailOpen, setCreateEmailOpen] = useState(false);
  const [createSocialOpen, setCreateSocialOpen] = useState(false);
  const { toast } = useToast();

  // Data queries
  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery<MarketingCampaign[]>({
    queryKey: ["/api/marketing-campaigns"],
  });

  const { data: promotionalCodes = [], isLoading: codesLoading } = useQuery<PromotionalCode[]>({
    queryKey: ["/api/promotional-codes"],
  });

  const { data: emailCampaigns = [], isLoading: emailLoading } = useQuery<EmailCampaign[]>({
    queryKey: ["/api/email-campaigns"],
  });

  const { data: socialPosts = [], isLoading: socialLoading } = useQuery<SocialMediaPost[]>({
    queryKey: ["/api/social-media-posts"],
  });

  const isLoading = campaignsLoading || codesLoading || emailLoading || socialLoading;

  // Analytics calculations
  const activeCampaigns = campaigns.filter(campaign => campaign.status === 'active').length;
  const totalBudget = campaigns.reduce((sum, campaign) => sum + parseFloat(campaign.budget || "0"), 0);
  const totalSpend = campaigns.reduce((sum, campaign) => sum + parseFloat(campaign.actualSpend || "0"), 0);
  const activePromoCodes = promotionalCodes.filter(code => code.isActive).length;

  // Campaign creation form
  const campaignForm = useForm<InsertMarketingCampaign>({
    resolver: zodResolver(insertMarketingCampaignSchema),
    defaultValues: {
      type: "email",
      status: "draft",
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: (data: InsertMarketingCampaign) => apiRequest("/api/marketing-campaigns", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketing-campaigns"] });
      setCreateCampaignOpen(false);
      campaignForm.reset();
      toast({ title: "Campaign created successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to create campaign", variant: "destructive" });
    },
  });

  // Promotional code creation form
  const codeForm = useForm<InsertPromotionalCode>({
    resolver: zodResolver(insertPromotionalCodeSchema),
    defaultValues: {
      type: "percentage",
      isActive: true,
    },
  });

  const createCodeMutation = useMutation({
    mutationFn: (data: InsertPromotionalCode) => apiRequest("/api/promotional-codes", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promotional-codes"] });
      setCreateCodeOpen(false);
      codeForm.reset();
      toast({ title: "Promotional code created successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to create promotional code", variant: "destructive" });
    },
  });

  // Email campaign creation form
  const emailForm = useForm<InsertEmailCampaign>({
    resolver: zodResolver(insertEmailCampaignSchema),
    defaultValues: {},
  });

  const createEmailMutation = useMutation({
    mutationFn: (data: InsertEmailCampaign) => apiRequest("/api/email-campaigns", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-campaigns"] });
      setCreateEmailOpen(false);
      emailForm.reset();
      toast({ title: "Email campaign created successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to create email campaign", variant: "destructive" });
    },
  });

  // Social media post creation form
  const socialForm = useForm<InsertSocialMediaPost>({
    resolver: zodResolver(insertSocialMediaPostSchema),
    defaultValues: {
      platform: "facebook",
    },
  });

  const createSocialMutation = useMutation({
    mutationFn: (data: InsertSocialMediaPost) => apiRequest("/api/social-media-posts", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-media-posts"] });
      setCreateSocialOpen(false);
      socialForm.reset();
      toast({ title: "Social media post created successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to create social media post", variant: "destructive" });
    },
  });

  // Copy promotional code to clipboard
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Code copied to clipboard!" });
  };

  // Campaign performance data for charts
  const campaignPerformanceData = campaigns.map(campaign => ({
    name: campaign.name,
    budget: parseFloat(campaign.budget || "0"),
    spent: parseFloat(campaign.actualSpend || "0"),
    efficiency: campaign.budget ? ((parseFloat(campaign.actualSpend || "0") / parseFloat(campaign.budget)) * 100).toFixed(1) : 0
  }));

  const campaignTypeData = campaigns.reduce((acc, campaign) => {
    acc[campaign.type] = (acc[campaign.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeChartData = Object.entries(campaignTypeData).map(([type, count]) => ({
    name: type.replace('_', ' '),
    value: count
  }));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f6f8] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Loading marketing data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8] p-6" data-testid="page-marketing">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="heading-marketing">
              Marketing
            </h1>
            <p className="text-gray-600 mt-1">Manage campaigns, promotions, and track marketing performance</p>
          </div>
          <div className="flex gap-3">
            <Dialog open={createCampaignOpen} onOpenChange={setCreateCampaignOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-campaign">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  New Campaign
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Marketing Campaign</DialogTitle>
                </DialogHeader>
                <Form {...campaignForm}>
                  <form onSubmit={campaignForm.handleSubmit((data) => createCampaignMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={campaignForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Campaign Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter campaign name" {...field} data-testid="input-campaign-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={campaignForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Campaign Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-campaign-type">
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select campaign type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="email">Email Marketing</SelectItem>
                              <SelectItem value="social">Social Media</SelectItem>
                              <SelectItem value="paid_ads">Paid Advertising</SelectItem>
                              <SelectItem value="content">Content Marketing</SelectItem>
                              <SelectItem value="referral">Referral Program</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={campaignForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Campaign description" {...field} data-testid="textarea-campaign-description" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={campaignForm.control}
                      name="budget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Budget ($)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-campaign-budget" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setCreateCampaignOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createCampaignMutation.isPending} data-testid="button-submit-campaign">
                        {createCampaignMutation.isPending ? "Creating..." : "Create Campaign"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TargetIcon className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
                  <p className="text-2xl font-bold text-gray-900" data-testid="stat-active-campaigns">
                    {activeCampaigns}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSignIcon className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Budget</p>
                  <p className="text-2xl font-bold text-gray-900" data-testid="stat-total-budget">
                    ${totalBudget.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUpIcon className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Spend</p>
                  <p className="text-2xl font-bold text-gray-900" data-testid="stat-total-spend">
                    ${totalSpend.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <UsersIcon className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Promo Codes</p>
                  <p className="text-2xl font-bold text-gray-900" data-testid="stat-active-codes">
                    {activePromoCodes}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="campaigns" className="space-y-6" data-testid="tabs-marketing">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="campaigns" data-testid="tab-campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="promotions" data-testid="tab-promotions">Promotions</TabsTrigger>
            <TabsTrigger value="email" data-testid="tab-email">Email Marketing</TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Marketing Campaigns
                    <Badge variant="secondary">{campaigns.length} campaigns</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {campaigns.length === 0 ? (
                      <p className="text-gray-500 text-center py-8" data-testid="text-no-campaigns">
                        No campaigns created yet
                      </p>
                    ) : (
                      campaigns.map((campaign) => (
                        <div key={campaign.id} className="border rounded-lg p-4 hover:bg-gray-50" data-testid={`campaign-${campaign.id}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900" data-testid={`campaign-name-${campaign.id}`}>
                                {campaign.name}
                              </h3>
                              <p className="text-sm text-gray-600">{campaign.description}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                                  {campaign.status}
                                </Badge>
                                <Badge variant="outline">
                                  {campaign.type.replace('_', ' ')}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">${parseFloat(campaign.budget || "0").toLocaleString()}</p>
                              <p className="text-xs text-gray-500">Budget</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Campaign Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  {campaignPerformanceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={campaignPerformanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => `$${value}`} />
                        <Bar dataKey="budget" fill="#8884d8" name="Budget" />
                        <Bar dataKey="spent" fill="#82ca9d" name="Spent" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No performance data available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Promotions Tab */}
          <TabsContent value="promotions" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Promotional Codes</h3>
              <Dialog open={createCodeOpen} onOpenChange={setCreateCodeOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-promo-code">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create Promo Code
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Promotional Code</DialogTitle>
                  </DialogHeader>
                  <Form {...codeForm}>
                    <form onSubmit={codeForm.handleSubmit((data) => createCodeMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={codeForm.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Code</FormLabel>
                            <FormControl>
                              <Input placeholder="SAVE20" {...field} data-testid="input-promo-code" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={codeForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="20% Off Sale" {...field} data-testid="input-promo-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={codeForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Discount Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-promo-type">
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select discount type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="percentage">Percentage</SelectItem>
                                <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                                <SelectItem value="free_shipping">Free Shipping</SelectItem>
                                <SelectItem value="buy_one_get_one">Buy One Get One</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={codeForm.control}
                        name="value"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Value</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="20" {...field} data-testid="input-promo-value" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setCreateCodeOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createCodeMutation.isPending} data-testid="button-submit-promo">
                          {createCodeMutation.isPending ? "Creating..." : "Create Code"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {promotionalCodes.length === 0 ? (
                <div className="col-span-full">
                  <p className="text-gray-500 text-center py-8" data-testid="text-no-promo-codes">
                    No promotional codes created yet
                  </p>
                </div>
              ) : (
                promotionalCodes.map((code) => (
                  <Card key={code.id} data-testid={`promo-code-${code.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <Badge variant={code.isActive ? 'default' : 'secondary'}>
                          {code.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyCode(code.code)}
                          data-testid={`button-copy-${code.id}`}
                        >
                          <CopyIcon className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-bold text-lg" data-testid={`promo-code-text-${code.id}`}>
                          {code.code}
                        </h3>
                        <p className="text-sm text-gray-600">{code.name}</p>
                        <div className="flex items-center justify-between text-sm">
                          <span>Value:</span>
                          <span className="font-medium">
                            {code.type === 'percentage' ? `${code.value}%` : `$${code.value}`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Used:</span>
                          <span className="font-medium">
                            {code.usageCount}/{code.usageLimit || '∞'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Email Marketing Tab */}
          <TabsContent value="email" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Email Campaigns</h3>
              <Dialog open={createEmailOpen} onOpenChange={setCreateEmailOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-email">
                    <MailIcon className="h-4 w-4 mr-2" />
                    Create Email Campaign
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Email Campaign</DialogTitle>
                  </DialogHeader>
                  <Form {...emailForm}>
                    <form onSubmit={emailForm.handleSubmit((data) => createEmailMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={emailForm.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Subject</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter email subject" {...field} data-testid="input-email-subject" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={emailForm.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Content</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Enter email content (HTML supported)" 
                                className="min-h-[200px]" 
                                {...field} 
                                data-testid="textarea-email-content"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setCreateEmailOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createEmailMutation.isPending} data-testid="button-submit-email">
                          {createEmailMutation.isPending ? "Creating..." : "Create Campaign"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {emailCampaigns.length === 0 ? (
                <p className="text-gray-500 text-center py-8" data-testid="text-no-email-campaigns">
                  No email campaigns created yet
                </p>
              ) : (
                emailCampaigns.map((campaign) => (
                  <Card key={campaign.id} data-testid={`email-campaign-${campaign.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900" data-testid={`email-subject-${campaign.id}`}>
                            {campaign.subject}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Recipients: {campaign.totalRecipients} | Opened: {campaign.opened} | Clicked: {campaign.clicked}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant={campaign.status === 'sent' ? 'default' : 'secondary'}>
                              {campaign.status}
                            </Badge>
                            {campaign.sentAt && (
                              <span className="text-xs text-gray-500">
                                Sent {format(new Date(campaign.sentAt), 'MMM d, yyyy')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" data-testid={`button-view-email-${campaign.id}`}>
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Types Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  {typeChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={typeChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {typeChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No data available</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Budget vs Spend Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Budget Utilization</span>
                      <span className="text-sm font-medium">
                        {totalBudget > 0 ? ((totalSpend / totalBudget) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${totalBudget > 0 ? Math.min((totalSpend / totalBudget) * 100, 100) : 0}%` }}
                      ></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">${totalBudget.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Total Budget</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">${totalSpend.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Total Spend</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}