import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { 
  BookOpen, 
  HelpCircle, 
  MessageSquare, 
  Search, 
  ThumbsUp, 
  ThumbsDown, 
  Eye,
  Plus,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
} from "lucide-react";
import { 
  type DocumentationArticle,
  type FaqEntry,
  type SupportTicket,
  type TicketMessage,
  type InsertSupportTicket,
  type InsertTicketMessage,
  insertSupportTicketSchema,
  insertTicketMessageSchema
} from "@shared/schema";

const priorityColors = {
  low: "bg-green-100 text-green-800",
  normal: "bg-blue-100 text-blue-800", 
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800"
};

const statusColors = {
  open: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  waiting_response: "bg-purple-100 text-purple-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800"
};

const statusIcons = {
  open: AlertCircle,
  in_progress: Clock,
  waiting_response: MessageSquare,
  resolved: CheckCircle,
  closed: XCircle
};

export default function HelpSupport() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const { toast } = useToast();

  // Documentation queries
  const { data: documentation = [], isLoading: loadingDocs } = useQuery({
    queryKey: ["/api/documentation", selectedCategory],
    queryFn: selectedCategory === "all" 
      ? undefined 
      : () => apiRequest(`/api/documentation?category=${selectedCategory}`)
  });

  // FAQ queries
  const { data: faqs = [], isLoading: loadingFaqs } = useQuery({
    queryKey: ["/api/faq", selectedCategory],
    queryFn: selectedCategory === "all" 
      ? undefined 
      : () => apiRequest(`/api/faq?category=${selectedCategory}`)
  });

  // Support tickets query
  const { data: tickets = [], isLoading: loadingTickets } = useQuery({
    queryKey: ["/api/support-tickets"]
  });

  // Ticket messages query
  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ["/api/support-tickets", selectedTicket?.id, "messages"],
    enabled: !!selectedTicket,
    queryFn: selectedTicket ? () => apiRequest(`/api/support-tickets/${selectedTicket.id}/messages`) : undefined
  });

  // Create ticket form
  const ticketForm = useForm<InsertSupportTicket>({
    resolver: zodResolver(insertSupportTicketSchema),
    defaultValues: {
      subject: "",
      description: "",
      category: "technical",
      priority: "normal"
    }
  });

  // Message form
  const messageForm = useForm<InsertTicketMessage>({
    resolver: zodResolver(insertTicketMessageSchema),
    defaultValues: {
      message: ""
    }
  });

  const createTicketMutation = useMutation({
    mutationFn: (data: InsertSupportTicket) => apiRequest("/api/support-tickets", {
      method: "POST",
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support-tickets"] });
      toast({ title: "Support ticket created successfully!" });
      setShowCreateTicket(false);
      ticketForm.reset();
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ ticketId, data }: { ticketId: number; data: InsertTicketMessage }) => 
      apiRequest(`/api/support-tickets/${ticketId}/messages`, {
        method: "POST",
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support-tickets", selectedTicket?.id, "messages"] });
      messageForm.reset();
    }
  });

  const rateContentMutation = useMutation({
    mutationFn: ({ type, id, helpful }: { type: "documentation" | "faq"; id: number; helpful: boolean }) => 
      apiRequest(`/api/${type}/${id}/rate`, {
        method: "POST",
        body: JSON.stringify({ helpful })
      }),
    onSuccess: () => {
      toast({ title: "Thank you for your feedback!" });
    }
  });

  // Filter content based on search term
  const filteredDocs = documentation.filter((doc: DocumentationArticle) =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFaqs = faqs.filter((faq: FaqEntry) =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onCreateTicket = (data: InsertSupportTicket) => {
    createTicketMutation.mutate(data);
  };

  const onSendMessage = (data: InsertTicketMessage) => {
    if (!selectedTicket) return;
    sendMessageMutation.mutate({ 
      ticketId: selectedTicket.id, 
      data 
    });
  };

  const handleRate = (type: "documentation" | "faq", id: number, helpful: boolean) => {
    rateContentMutation.mutate({ type, id, helpful });
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6" data-testid="page-help-support">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Help & Support</h2>
        <Dialog open={showCreateTicket} onOpenChange={setShowCreateTicket}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-ticket">
              <Plus className="mr-2 h-4 w-4" />
              New Support Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Support Ticket</DialogTitle>
            </DialogHeader>
            <Form {...ticketForm}>
              <form onSubmit={ticketForm.handleSubmit(onCreateTicket)} className="space-y-4">
                <FormField
                  control={ticketForm.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief description of your issue" {...field} data-testid="input-ticket-subject" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={ticketForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-ticket-category">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="technical">Technical Issue</SelectItem>
                          <SelectItem value="billing">Billing & Payments</SelectItem>
                          <SelectItem value="course_issues">Course Issues</SelectItem>
                          <SelectItem value="account">Account Problems</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={ticketForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-ticket-priority">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={ticketForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Please provide detailed information about your issue..."
                          className="min-h-[100px]"
                          {...field}
                          data-testid="textarea-ticket-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateTicket(false)}
                    data-testid="button-cancel-ticket"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createTicketMutation.isPending}
                    data-testid="button-submit-ticket"
                  >
                    {createTicketMutation.isPending ? "Creating..." : "Create Ticket"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documentation and FAQs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
            data-testid="input-search"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]" data-testid="select-category-filter">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="getting_started">Getting Started</SelectItem>
            <SelectItem value="course_creation">Course Creation</SelectItem>
            <SelectItem value="payments">Payments</SelectItem>
            <SelectItem value="technical">Technical</SelectItem>
            <SelectItem value="general">General</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="documentation" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="documentation" data-testid="tab-documentation">
            <BookOpen className="mr-2 h-4 w-4" />
            Documentation
          </TabsTrigger>
          <TabsTrigger value="faq" data-testid="tab-faq">
            <HelpCircle className="mr-2 h-4 w-4" />
            FAQ
          </TabsTrigger>
          <TabsTrigger value="support" data-testid="tab-support">
            <MessageSquare className="mr-2 h-4 w-4" />
            Support Tickets
          </TabsTrigger>
        </TabsList>

        {/* Documentation Tab */}
        <TabsContent value="documentation" className="space-y-4">
          {loadingDocs ? (
            <div className="text-center py-8" data-testid="loading-documentation">
              Loading documentation...
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredDocs.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground" data-testid="text-no-documentation">
                      No documentation articles found. Try adjusting your search or category filter.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredDocs.map((article: DocumentationArticle) => (
                  <Card key={article.id} className="hover:shadow-md transition-shadow" data-testid={`card-article-${article.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{article.title}</CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="secondary">{article.category}</Badge>
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              <span data-testid={`text-article-views-${article.id}`}>{article.views}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4" data-testid={`text-article-content-${article.id}`}>
                        {article.content.substring(0, 200)}...
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRate("documentation", article.id, true)}
                            data-testid={`button-article-helpful-${article.id}`}
                          >
                            <ThumbsUp className="h-3 w-3 mr-1" />
                            {article.helpful}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRate("documentation", article.id, false)}
                            data-testid={`button-article-not-helpful-${article.id}`}
                          >
                            <ThumbsDown className="h-3 w-3 mr-1" />
                            {article.notHelpful}
                          </Button>
                        </div>
                        {article.tags && article.tags.length > 0 && (
                          <div className="flex gap-1">
                            {article.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>

        {/* FAQ Tab */}
        <TabsContent value="faq" className="space-y-4">
          {loadingFaqs ? (
            <div className="text-center py-8" data-testid="loading-faq">
              Loading FAQs...
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredFaqs.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground" data-testid="text-no-faq">
                      No FAQ entries found. Try adjusting your search or category filter.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredFaqs.map((faq: FaqEntry) => (
                  <Card key={faq.id} className="hover:shadow-md transition-shadow" data-testid={`card-faq-${faq.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg" data-testid={`text-faq-question-${faq.id}`}>
                          {faq.question}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="secondary">{faq.category}</Badge>
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span data-testid={`text-faq-views-${faq.id}`}>{faq.views}</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4" data-testid={`text-faq-answer-${faq.id}`}>
                        {faq.answer}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRate("faq", faq.id, true)}
                          data-testid={`button-faq-helpful-${faq.id}`}
                        >
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          {faq.helpful}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRate("faq", faq.id, false)}
                          data-testid={`button-faq-not-helpful-${faq.id}`}
                        >
                          <ThumbsDown className="h-3 w-3 mr-1" />
                          {faq.notHelpful}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>

        {/* Support Tickets Tab */}
        <TabsContent value="support" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tickets List */}
            <Card>
              <CardHeader>
                <CardTitle>Your Support Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingTickets ? (
                  <div className="text-center py-4" data-testid="loading-tickets">
                    Loading tickets...
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground" data-testid="text-no-tickets">
                      No support tickets found. Create your first ticket to get help.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tickets.map((ticket: SupportTicket) => {
                      const StatusIcon = statusIcons[ticket.status as keyof typeof statusIcons];
                      return (
                        <div
                          key={ticket.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                            selectedTicket?.id === ticket.id ? "border-primary bg-muted/20" : ""
                          }`}
                          onClick={() => setSelectedTicket(ticket)}
                          data-testid={`card-ticket-${ticket.id}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium" data-testid={`text-ticket-subject-${ticket.id}`}>
                              {ticket.subject}
                            </h4>
                            <div className="flex items-center gap-2">
                              <Badge className={priorityColors[ticket.priority as keyof typeof priorityColors]}>
                                {ticket.priority}
                              </Badge>
                              <Badge className={statusColors[ticket.status as keyof typeof statusColors]}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {ticket.status.replace("_", " ")}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {ticket.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ticket Details */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedTicket ? "Ticket Conversation" : "Select a Ticket"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedTicket ? (
                  <div className="text-center py-8">
                    <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground" data-testid="text-select-ticket">
                      Select a support ticket to view the conversation and add messages.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Ticket Info */}
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2" data-testid="text-selected-ticket-subject">
                        {selectedTicket.subject}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {selectedTicket.description}
                      </p>
                      <div className="flex gap-2">
                        <Badge className={priorityColors[selectedTicket.priority as keyof typeof priorityColors]}>
                          {selectedTicket.priority}
                        </Badge>
                        <Badge className={statusColors[selectedTicket.status as keyof typeof statusColors]}>
                          {selectedTicket.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>

                    <Separator />

                    {/* Messages */}
                    <div className="space-y-4 max-h-96 overflow-y-auto" data-testid="container-ticket-messages">
                      {loadingMessages ? (
                        <div className="text-center py-4">Loading messages...</div>
                      ) : messages.length === 0 ? (
                        <p className="text-muted-foreground text-center">No messages yet.</p>
                      ) : (
                        messages.map((message: TicketMessage) => (
                          <div
                            key={message.id}
                            className={`p-3 rounded-lg ${
                              message.isFromSupport
                                ? "bg-blue-50 border-l-4 border-blue-500"
                                : "bg-gray-50 border-l-4 border-gray-300"
                            }`}
                            data-testid={`message-${message.id}`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">
                                {message.isFromSupport ? "Support Team" : "You"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(message.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm">{message.message}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Send Message */}
                    {selectedTicket.status !== "closed" && (
                      <Form {...messageForm}>
                        <form onSubmit={messageForm.handleSubmit(onSendMessage)} className="space-y-2">
                          <FormField
                            control={messageForm.control}
                            name="message"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Textarea
                                    placeholder="Type your message here..."
                                    className="min-h-[80px]"
                                    {...field}
                                    data-testid="textarea-new-message"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button 
                            type="submit" 
                            disabled={sendMessageMutation.isPending}
                            data-testid="button-send-message"
                          >
                            {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
                          </Button>
                        </form>
                      </Form>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}