import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  SettingsIcon, UserIcon, BellIcon, ShieldIcon, CreditCardIcon,
  SaveIcon, RefreshCwIcon, MonitorIcon, SunIcon, MoonIcon,
  GlobeIcon, ClockIcon, DollarSignIcon, MailIcon, PhoneIcon,
  LockIcon, EyeIcon, EyeOffIcon, AlertTriangleIcon, InfoIcon
} from "lucide-react";
import {
  updateUserPreferencesSchema,
  updateNotificationSettingsSchema,
  updateInstructorSettingsSchema,
  updatePrivacySettingsSchema,
  type UserPreferences,
  type NotificationSettings,
  type InstructorSettings,
  type PrivacySettings,
  type UpdateUserPreferences,
  type UpdateNotificationSettings,
  type UpdateInstructorSettings,
  type UpdatePrivacySettings
} from "@shared/schema";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("preferences");
  const { toast } = useToast();

  // Data queries
  const { data: userPreferences, isLoading: preferencesLoading } = useQuery<UserPreferences>({
    queryKey: ["/api/user-preferences"],
  });

  const { data: notificationSettings, isLoading: notificationsLoading } = useQuery<NotificationSettings>({
    queryKey: ["/api/notification-settings"],
  });

  const { data: instructorSettings, isLoading: instructorLoading } = useQuery<InstructorSettings>({
    queryKey: ["/api/instructor-settings"],
  });

  const { data: privacySettings, isLoading: privacyLoading } = useQuery<PrivacySettings>({
    queryKey: ["/api/privacy-settings"],
  });

  const isLoading = preferencesLoading || notificationsLoading || instructorLoading || privacyLoading;

  // User Preferences Form
  const preferencesForm = useForm<UpdateUserPreferences>({
    resolver: zodResolver(updateUserPreferencesSchema),
    defaultValues: userPreferences || {},
  });

  // Update form when data loads
  useEffect(() => {
    if (userPreferences) {
      preferencesForm.reset(userPreferences);
    }
  }, [userPreferences, preferencesForm]);

  const updatePreferencesMutation = useMutation({
    mutationFn: (data: UpdateUserPreferences) => apiRequest("/api/user-preferences", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-preferences"] });
      toast({ title: "Preferences updated successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to update preferences", variant: "destructive" });
    },
  });

  // Notification Settings Form
  const notificationsForm = useForm<UpdateNotificationSettings>({
    resolver: zodResolver(updateNotificationSettingsSchema),
    defaultValues: notificationSettings || {},
  });

  useEffect(() => {
    if (notificationSettings) {
      notificationsForm.reset(notificationSettings);
    }
  }, [notificationSettings, notificationsForm]);

  const updateNotificationsMutation = useMutation({
    mutationFn: (data: UpdateNotificationSettings) => apiRequest("/api/notification-settings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-settings"] });
      toast({ title: "Notification settings updated successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to update notification settings", variant: "destructive" });
    },
  });

  // Instructor Settings Form
  const instructorForm = useForm<UpdateInstructorSettings>({
    resolver: zodResolver(updateInstructorSettingsSchema),
    defaultValues: instructorSettings || {},
  });

  useEffect(() => {
    if (instructorSettings) {
      instructorForm.reset(instructorSettings);
    }
  }, [instructorSettings, instructorForm]);

  const updateInstructorMutation = useMutation({
    mutationFn: (data: UpdateInstructorSettings) => apiRequest("/api/instructor-settings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instructor-settings"] });
      toast({ title: "Instructor settings updated successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to update instructor settings", variant: "destructive" });
    },
  });

  // Privacy Settings Form
  const privacyForm = useForm<UpdatePrivacySettings>({
    resolver: zodResolver(updatePrivacySettingsSchema),
    defaultValues: privacySettings || {},
  });

  useEffect(() => {
    if (privacySettings) {
      privacyForm.reset(privacySettings);
    }
  }, [privacySettings, privacyForm]);

  const updatePrivacyMutation = useMutation({
    mutationFn: (data: UpdatePrivacySettings) => apiRequest("/api/privacy-settings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/privacy-settings"] });
      toast({ title: "Privacy settings updated successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to update privacy settings", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f6f8] p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <RefreshCwIcon className="h-6 w-6 animate-spin mr-2" />
            Loading settings...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8] p-6" data-testid="page-settings">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <SettingsIcon className="h-8 w-8 text-gray-800 mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="heading-settings">
              Settings
            </h1>
            <p className="text-gray-600 mt-1">Manage your account preferences and system configuration</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6" data-testid="tabs-settings">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="preferences" className="flex items-center gap-2" data-testid="tab-preferences">
              <UserIcon className="h-4 w-4" />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2" data-testid="tab-notifications">
              <BellIcon className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="instructor" className="flex items-center gap-2" data-testid="tab-instructor">
              <CreditCardIcon className="h-4 w-4" />
              Instructor
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2" data-testid="tab-privacy">
              <ShieldIcon className="h-4 w-4" />
              Privacy
            </TabsTrigger>
          </TabsList>

          {/* User Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  User Preferences
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...preferencesForm}>
                  <form 
                    onSubmit={preferencesForm.handleSubmit((data) => updatePreferencesMutation.mutate(data))}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Theme */}
                      <FormField
                        control={preferencesForm.control}
                        name="theme"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <MonitorIcon className="h-4 w-4" />
                              Theme
                            </FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value} 
                              data-testid="select-theme"
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select theme" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="light">
                                  <div className="flex items-center gap-2">
                                    <SunIcon className="h-4 w-4" />
                                    Light
                                  </div>
                                </SelectItem>
                                <SelectItem value="dark">
                                  <div className="flex items-center gap-2">
                                    <MoonIcon className="h-4 w-4" />
                                    Dark
                                  </div>
                                </SelectItem>
                                <SelectItem value="system">
                                  <div className="flex items-center gap-2">
                                    <MonitorIcon className="h-4 w-4" />
                                    System
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Language */}
                      <FormField
                        control={preferencesForm.control}
                        name="language"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <GlobeIcon className="h-4 w-4" />
                              Language
                            </FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value} 
                              data-testid="select-language"
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select language" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="es">Español</SelectItem>
                                <SelectItem value="fr">Français</SelectItem>
                                <SelectItem value="de">Deutsch</SelectItem>
                                <SelectItem value="zh">中文</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Timezone */}
                      <FormField
                        control={preferencesForm.control}
                        name="timezone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <ClockIcon className="h-4 w-4" />
                              Timezone
                            </FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value} 
                              data-testid="select-timezone"
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select timezone" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="UTC">UTC</SelectItem>
                                <SelectItem value="America/New_York">Eastern Time</SelectItem>
                                <SelectItem value="America/Chicago">Central Time</SelectItem>
                                <SelectItem value="America/Denver">Mountain Time</SelectItem>
                                <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                                <SelectItem value="Europe/London">London</SelectItem>
                                <SelectItem value="Europe/Paris">Paris</SelectItem>
                                <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Currency */}
                      <FormField
                        control={preferencesForm.control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <DollarSignIcon className="h-4 w-4" />
                              Currency
                            </FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value} 
                              data-testid="select-currency"
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="USD">USD - US Dollar</SelectItem>
                                <SelectItem value="EUR">EUR - Euro</SelectItem>
                                <SelectItem value="GBP">GBP - British Pound</SelectItem>
                                <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                                <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                                <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Interface Options</h3>
                      
                      <div className="space-y-4">
                        <FormField
                          control={preferencesForm.control}
                          name="autoSave"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Auto Save</FormLabel>
                                <FormDescription>
                                  Automatically save your work while editing
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-auto-save"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={preferencesForm.control}
                          name="compactView"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Compact View</FormLabel>
                                <FormDescription>
                                  Use a more compact interface layout
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-compact-view"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={preferencesForm.control}
                          name="showTutorials"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Show Tutorials</FormLabel>
                                <FormDescription>
                                  Display helpful tutorials and tips
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-show-tutorials"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={updatePreferencesMutation.isPending}
                        data-testid="button-save-preferences"
                      >
                        <SaveIcon className="h-4 w-4 mr-2" />
                        {updatePreferencesMutation.isPending ? "Saving..." : "Save Preferences"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BellIcon className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...notificationsForm}>
                  <form 
                    onSubmit={notificationsForm.handleSubmit((data) => updateNotificationsMutation.mutate(data))}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Communication Methods</h3>
                      
                      <FormField
                        control={notificationsForm.control}
                        name="emailNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base flex items-center gap-2">
                                <MailIcon className="h-4 w-4" />
                                Email Notifications
                              </FormLabel>
                              <FormDescription>
                                Receive notifications via email
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-email-notifications"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={notificationsForm.control}
                        name="pushNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Push Notifications</FormLabel>
                              <FormDescription>
                                Receive browser push notifications
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-push-notifications"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={notificationsForm.control}
                        name="smsNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base flex items-center gap-2">
                                <PhoneIcon className="h-4 w-4" />
                                SMS Notifications
                              </FormLabel>
                              <FormDescription>
                                Receive notifications via text message
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-sms-notifications"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Content Notifications</h3>
                      
                      <FormField
                        control={notificationsForm.control}
                        name="courseUpdates"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Course Updates</FormLabel>
                              <FormDescription>
                                Get notified about course changes and new content
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-course-updates"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={notificationsForm.control}
                        name="newEnrollments"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">New Enrollments</FormLabel>
                              <FormDescription>
                                Get notified when students enroll in your courses
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-new-enrollments"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={notificationsForm.control}
                        name="paymentAlerts"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Payment Alerts</FormLabel>
                              <FormDescription>
                                Get notified about payment and revenue updates
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-payment-alerts"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={updateNotificationsMutation.isPending}
                        data-testid="button-save-notifications"
                      >
                        <SaveIcon className="h-4 w-4 mr-2" />
                        {updateNotificationsMutation.isPending ? "Saving..." : "Save Notifications"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Instructor Settings Tab */}
          <TabsContent value="instructor" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCardIcon className="h-5 w-5" />
                  Instructor Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...instructorForm}>
                  <form 
                    onSubmit={instructorForm.handleSubmit((data) => updateInstructorMutation.mutate(data))}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Course Defaults</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={instructorForm.control}
                          name="defaultCoursePrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Default Course Price ($)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  placeholder="99.99" 
                                  {...field} 
                                  data-testid="input-default-price"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={instructorForm.control}
                          name="defaultCourseDuration"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Default Duration (hours)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="8" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  data-testid="input-default-duration"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={instructorForm.control}
                        name="defaultCourseLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Default Course Level</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value} 
                              data-testid="select-default-level"
                            >
                              <FormControl>
                                <SelectTrigger className="w-full md:w-1/2">
                                  <SelectValue placeholder="Select default level" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="beginner">Beginner</SelectItem>
                                <SelectItem value="intermediate">Intermediate</SelectItem>
                                <SelectItem value="advanced">Advanced</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Business Information</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={instructorForm.control}
                          name="businessName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Business Name</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Your Business Name" 
                                  {...field} 
                                  data-testid="input-business-name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={instructorForm.control}
                          name="websiteUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Website URL</FormLabel>
                              <FormControl>
                                <Input 
                                  type="url" 
                                  placeholder="https://yourwebsite.com" 
                                  {...field} 
                                  data-testid="input-website-url"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={instructorForm.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bio</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Tell us about yourself and your expertise..." 
                                className="min-h-[100px]" 
                                {...field} 
                                data-testid="textarea-bio"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={updateInstructorMutation.isPending}
                        data-testid="button-save-instructor"
                      >
                        <SaveIcon className="h-4 w-4 mr-2" />
                        {updateInstructorMutation.isPending ? "Saving..." : "Save Settings"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Settings Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldIcon className="h-5 w-5" />
                  Privacy Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...privacyForm}>
                  <form 
                    onSubmit={privacyForm.handleSubmit((data) => updatePrivacyMutation.mutate(data))}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Profile Visibility</h3>
                      
                      <FormField
                        control={privacyForm.control}
                        name="profileVisibility"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Profile Visibility</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value} 
                              data-testid="select-profile-visibility"
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select visibility" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="public">
                                  <div className="flex items-center gap-2">
                                    <EyeIcon className="h-4 w-4" />
                                    Public - Visible to everyone
                                  </div>
                                </SelectItem>
                                <SelectItem value="instructors_only">
                                  <div className="flex items-center gap-2">
                                    <UserIcon className="h-4 w-4" />
                                    Instructors Only
                                  </div>
                                </SelectItem>
                                <SelectItem value="private">
                                  <div className="flex items-center gap-2">
                                    <EyeOffIcon className="h-4 w-4" />
                                    Private - Hidden from others
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-4">
                        <FormField
                          control={privacyForm.control}
                          name="showEmail"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Show Email Address</FormLabel>
                                <FormDescription>
                                  Display your email address on your profile
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-show-email"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={privacyForm.control}
                          name="allowContactFromStudents"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Allow Student Contact</FormLabel>
                                <FormDescription>
                                  Allow students to contact you directly
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-allow-student-contact"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={privacyForm.control}
                          name="allowReviews"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Allow Reviews</FormLabel>
                                <FormDescription>
                                  Let students leave reviews on your courses
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-allow-reviews"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Data & Analytics</h3>
                      
                      <FormField
                        control={privacyForm.control}
                        name="allowAnalytics"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Allow Analytics</FormLabel>
                              <FormDescription>
                                Help us improve by sharing anonymous usage data
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-allow-analytics"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={privacyForm.control}
                        name="dataRetentionPeriod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data Retention Period (days)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="30" 
                                max="3650" 
                                placeholder="365" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 365)}
                                data-testid="input-data-retention"
                              />
                            </FormControl>
                            <FormDescription>
                              How long to keep your data (30 days to 10 years)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-yellow-800">Privacy Notice</h4>
                          <p className="text-sm text-yellow-700 mt-1">
                            Changes to privacy settings may take up to 24 hours to take full effect. 
                            Some data may be retained for legal compliance purposes.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={updatePrivacyMutation.isPending}
                        data-testid="button-save-privacy"
                      >
                        <SaveIcon className="h-4 w-4 mr-2" />
                        {updatePrivacyMutation.isPending ? "Saving..." : "Save Privacy Settings"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}