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
import { Progress } from "@/components/ui/progress";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger, 
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Enrollment, User, Course, StudentCommunication } from "@shared/schema";
import { insertCommunicationSchema, type InsertCommunication, updateEnrollmentSchema, type UpdateEnrollment } from "@shared/schema";
import {
  UsersIcon,
  GraduationCapIcon,
  MessageSquareIcon,
  TrendingUpIcon,
  MoreVerticalIcon,
  SendIcon,
  EyeIcon,
  EditIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MailIcon,
  UserCheckIcon,
  BookOpenIcon,
  CalendarIcon
} from "lucide-react";

type EnrollmentWithDetails = Enrollment & { student: User; course: Course };
type CommunicationWithDetails = StudentCommunication & { student: User; course?: Course };

export const LearnerManagement = (): JSX.Element => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentWithDetails | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isCommunicationDialogOpen, setIsCommunicationDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<{ id: number; name: string; courseId?: number } | null>(null);

  // Fetch enrollments
  const { data: enrollments = [], isLoading: isLoadingEnrollments } = useQuery<EnrollmentWithDetails[]>({
    queryKey: ["/api/enrollments"],
  });

  // Fetch communications
  const { data: communications = [], isLoading: isLoadingCommunications } = useQuery<CommunicationWithDetails[]>({
    queryKey: ["/api/communications"],
  });

  // Update enrollment form
  const updateForm = useForm<UpdateEnrollment>({
    resolver: zodResolver(updateEnrollmentSchema),
    defaultValues: {
      progress: "",
      status: "active",
      notes: "",
    },
  });

  // Communication form
  const communicationForm = useForm<InsertCommunication>({
    resolver: zodResolver(insertCommunicationSchema),
    defaultValues: {
      studentId: 0,
      subject: "",
      message: "",
      type: "private_message",
    },
  });

  const updateEnrollmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateEnrollment }) => {
      const response = await apiRequest("PATCH", `/api/enrollments/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      toast({
        title: "Enrollment Updated",
        description: "Student enrollment has been successfully updated.",
      });
      setIsUpdateDialogOpen(false);
      updateForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error Updating Enrollment",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const sendCommunicationMutation = useMutation({
    mutationFn: async (communicationData: InsertCommunication) => {
      const response = await apiRequest("POST", "/api/communications", communicationData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communications"] });
      toast({
        title: "Message Sent",
        description: "Your message has been sent to the student.",
      });
      setIsCommunicationDialogOpen(false);
      communicationForm.reset();
      setSelectedStudent(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error Sending Message",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUpdateEnrollment = (enrollment: EnrollmentWithDetails) => {
    setSelectedEnrollment(enrollment);
    updateForm.reset({
      progress: enrollment.progress || "0",
      status: enrollment.status || "active",
      notes: enrollment.notes || "",
    });
    setIsUpdateDialogOpen(true);
  };

  const handleSendMessage = (student: { id: number; name: string }, courseId?: number) => {
    setSelectedStudent({ id: student.id, name: student.name, courseId });
    communicationForm.reset({
      studentId: student.id,
      courseId: courseId,
      subject: "",
      message: "",
      type: "private_message",
    });
    setIsCommunicationDialogOpen(true);
  };

  const onSubmitUpdate = (data: UpdateEnrollment) => {
    if (selectedEnrollment) {
      updateEnrollmentMutation.mutate({ id: selectedEnrollment.id, data });
    }
  };

  const onSubmitCommunication = (data: InsertCommunication) => {
    sendCommunicationMutation.mutate(data);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
      case "active":
        return <UserCheckIcon className="h-4 w-4 text-blue-600" />;
      case "suspended":
        return <AlertCircleIcon className="h-4 w-4 text-yellow-600" />;
      case "dropped":
        return <XCircleIcon className="h-4 w-4 text-red-600" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "active":
        return "bg-blue-100 text-blue-800";
      case "suspended":
        return "bg-yellow-100 text-yellow-800";
      case "dropped":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCommunicationTypeColor = (type: string) => {
    switch (type) {
      case "announcement":
        return "bg-purple-100 text-purple-800";
      case "feedback":
        return "bg-green-100 text-green-800";
      case "reminder":
        return "bg-yellow-100 text-yellow-800";
      case "private_message":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Calculate statistics
  const totalStudents = enrollments.length;
  const activeStudents = enrollments.filter(e => e.status === "active").length;
  const completedStudents = enrollments.filter(e => e.status === "completed").length;
  const averageProgress = enrollments.length > 0 
    ? enrollments.reduce((sum, e) => sum + parseFloat(e.progress || "0"), 0) / enrollments.length 
    : 0;

  return (
    <div className="min-h-screen bg-[#f5f6f8] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="heading-learner-management">
              Learner Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your students, track progress, and communicate effectively
            </p>
          </div>
          <Dialog open={isCommunicationDialogOpen} onOpenChange={setIsCommunicationDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => handleSendMessage({ id: 0, name: "All Students" })}
                data-testid="button-send-announcement"
                className="flex items-center gap-2"
              >
                <SendIcon className="h-4 w-4" />
                Send Announcement
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-students">
                {totalStudents}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Learners</CardTitle>
              <UserCheckIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600" data-testid="text-active-students">
                {activeStudents}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <GraduationCapIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" data-testid="text-completed-students">
                {completedStudents}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
              <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-average-progress">
                {averageProgress.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="students" className="space-y-6">
          <TabsList>
            <TabsTrigger value="students" data-testid="tab-students">Students</TabsTrigger>
            <TabsTrigger value="communications" data-testid="tab-communications">Communications</TabsTrigger>
          </TabsList>

          {/* Students Tab */}
          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle>Student Enrollments</CardTitle>
                <CardDescription>
                  View and manage all student enrollments across your courses
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingEnrollments ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                        <Skeleton className="h-8 w-24" />
                      </div>
                    ))}
                  </div>
                ) : enrollments.length === 0 ? (
                  <div className="text-center py-12">
                    <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2" data-testid="text-no-students">
                      No students enrolled yet
                    </h3>
                    <p className="text-gray-600">
                      Students will appear here once they enroll in your courses.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {enrollments.map((enrollment) => (
                      <div
                        key={enrollment.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                        data-testid={`card-student-${enrollment.id}`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold" data-testid={`text-student-name-${enrollment.id}`}>
                                {enrollment.student.username}
                              </h3>
                              <p className="text-sm text-gray-600" data-testid={`text-student-email-${enrollment.id}`}>
                                {enrollment.student.email || "No email"}
                              </p>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium" data-testid={`text-course-title-${enrollment.id}`}>
                                {enrollment.course.title}
                              </p>
                              <p className="text-sm text-gray-600">
                                Enrolled: {enrollment.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleDateString() : "N/A"}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 mb-2">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(enrollment.status || "active")}
                              <Badge className={getStatusColor(enrollment.status || "active")} data-testid={`badge-status-${enrollment.id}`}>
                                {enrollment.status || "active"}
                              </Badge>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">Progress:</span>
                                <Progress 
                                  value={parseFloat(enrollment.progress || "0")} 
                                  className="flex-1 max-w-32"
                                  data-testid={`progress-${enrollment.id}`}
                                />
                                <span className="text-sm font-medium" data-testid={`text-progress-${enrollment.id}`}>
                                  {parseFloat(enrollment.progress || "0").toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>

                          {enrollment.notes && (
                            <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded" data-testid={`text-notes-${enrollment.id}`}>
                              <strong>Notes:</strong> {enrollment.notes}
                            </p>
                          )}

                          <div className="text-xs text-gray-500 mt-2">
                            Last activity: {enrollment.lastActivityAt ? new Date(enrollment.lastActivityAt).toLocaleDateString() : "Never"}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendMessage(
                              { id: enrollment.studentId, name: enrollment.student.username },
                              enrollment.courseId || undefined
                            )}
                            data-testid={`button-message-${enrollment.id}`}
                          >
                            <MessageSquareIcon className="h-3 w-3 mr-1" />
                            Message
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" data-testid={`button-menu-${enrollment.id}`}>
                                <MoreVerticalIcon className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => handleUpdateEnrollment(enrollment)}
                                data-testid={`button-edit-${enrollment.id}`}
                              >
                                <EditIcon className="h-4 w-4 mr-2" />
                                Update Progress
                              </DropdownMenuItem>
                              <DropdownMenuItem data-testid={`button-view-${enrollment.id}`}>
                                <EyeIcon className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Communications Tab */}
          <TabsContent value="communications">
            <Card>
              <CardHeader>
                <CardTitle>Student Communications</CardTitle>
                <CardDescription>
                  View and manage your communications with students
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingCommunications ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-full" />
                        </div>
                        <Skeleton className="h-6 w-20" />
                      </div>
                    ))}
                  </div>
                ) : communications.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquareIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2" data-testid="text-no-communications">
                      No communications yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Start communicating with your students to provide feedback and support.
                    </p>
                    <Button onClick={() => handleSendMessage({ id: 0, name: "All Students" })} data-testid="button-first-message">
                      Send First Message
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {communications.map((communication) => (
                      <div
                        key={communication.id}
                        className="p-4 border rounded-lg hover:bg-gray-50"
                        data-testid={`card-communication-${communication.id}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Badge className={getCommunicationTypeColor(communication.type || "private_message")} data-testid={`badge-type-${communication.id}`}>
                              {communication.type?.replace("_", " ") || "message"}
                            </Badge>
                            <span className="font-medium" data-testid={`text-recipient-${communication.id}`}>
                              To: {communication.student.username}
                            </span>
                            {communication.course && (
                              <span className="text-sm text-gray-600">
                                ({communication.course.title})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            {communication.readAt ? (
                              <CheckCircleIcon className="h-4 w-4 text-green-600" />
                            ) : (
                              <MailIcon className="h-4 w-4" />
                            )}
                            <span data-testid={`text-sent-date-${communication.id}`}>
                              {communication.sentAt ? new Date(communication.sentAt).toLocaleDateString() : "N/A"}
                            </span>
                          </div>
                        </div>
                        
                        <h4 className="font-semibold mb-2" data-testid={`text-subject-${communication.id}`}>
                          {communication.subject}
                        </h4>
                        <p className="text-gray-700 mb-3" data-testid={`text-message-${communication.id}`}>
                          {communication.message}
                        </p>
                        
                        {communication.readAt && (
                          <div className="text-xs text-green-600" data-testid={`text-read-date-${communication.id}`}>
                            Read: {new Date(communication.readAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Update Enrollment Dialog */}
        <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Student Progress</DialogTitle>
            </DialogHeader>
            {selectedEnrollment && (
              <Form {...updateForm}>
                <form onSubmit={updateForm.handleSubmit(onSubmitUpdate)} className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      Student: <span className="font-semibold">{selectedEnrollment.student.username}</span>
                    </p>
                    <p className="text-sm text-blue-800">
                      Course: <span className="font-semibold">{selectedEnrollment.course.title}</span>
                    </p>
                  </div>

                  <FormField
                    control={updateForm.control}
                    name="progress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Progress (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            placeholder="0"
                            data-testid="input-progress"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter the student's completion percentage (0-100)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={updateForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-status">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                            <SelectItem value="dropped">Dropped</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={updateForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instructor Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add notes about the student's progress..."
                            data-testid="textarea-notes"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Private notes about the student's performance
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsUpdateDialogOpen(false)}
                      data-testid="button-cancel-update"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={updateEnrollmentMutation.isPending}
                      data-testid="button-submit-update"
                    >
                      {updateEnrollmentMutation.isPending ? "Updating..." : "Update Progress"}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </DialogContent>
        </Dialog>

        {/* Communication Dialog */}
        <Dialog open={isCommunicationDialogOpen} onOpenChange={setIsCommunicationDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Send Message</DialogTitle>
            </DialogHeader>
            <Form {...communicationForm}>
              <form onSubmit={communicationForm.handleSubmit(onSubmitCommunication)} className="space-y-6">
                {selectedStudent && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      Sending to: <span className="font-semibold">{selectedStudent.name}</span>
                    </p>
                  </div>
                )}

                <FormField
                  control={communicationForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-message-type">
                            <SelectValue placeholder="Select message type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="private_message">Private Message</SelectItem>
                          <SelectItem value="feedback">Feedback</SelectItem>
                          <SelectItem value="reminder">Reminder</SelectItem>
                          <SelectItem value="announcement">Announcement</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={communicationForm.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter message subject"
                          data-testid="input-subject"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={communicationForm.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Write your message here..."
                          className="min-h-[120px]"
                          data-testid="textarea-message"
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
                    onClick={() => {
                      setIsCommunicationDialogOpen(false);
                      setSelectedStudent(null);
                    }}
                    data-testid="button-cancel-message"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={sendCommunicationMutation.isPending}
                    data-testid="button-send-message"
                  >
                    {sendCommunicationMutation.isPending ? "Sending..." : "Send Message"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};