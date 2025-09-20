import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { insertCourseSchema, type InsertCourse } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeftIcon, BookOpenIcon, DollarSignIcon, ClockIcon, SparklesIcon, Loader2 } from "lucide-react";
import { z } from "zod";

const categories = [
  "Technology",
  "Business",
  "Design",
  "Marketing",
  "Health & Wellness",
  "Personal Development",
  "Education",
  "Arts & Entertainment",
];

interface AIGenerationForm {
  title: string;
  description: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  price: string;
  targetDuration: number;
  specificRequirements?: string;
  thumbnail?: string;
  isPublished?: boolean;
}

const aiGenerationSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(500, "Description must be less than 500 characters"),
  category: z.string().min(1, "Category is required"),
  level: z.enum(["beginner", "intermediate", "advanced"], { required_error: "Level is required" }),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, "Price must be a valid positive number"),
  targetDuration: z.number().min(1, "Duration must be at least 1 hour").max(20, "Duration must be less than 20 hours"),
  specificRequirements: z.string().optional(),
  thumbnail: z.string().url().optional().or(z.literal("")),
  isPublished: z.boolean().optional(),
});

export const CreateCoursePage = (): JSX.Element => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("traditional");
  const [generatedContent, setGeneratedContent] = useState<any>(null);

  const form = useForm<InsertCourse>({
    resolver: zodResolver(insertCourseSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      level: "beginner",
      price: "0",
      duration: 1,
      thumbnail: "",
      isPublished: false,
    },
  });

  const aiForm = useForm<AIGenerationForm>({
    resolver: zodResolver(aiGenerationSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      level: "beginner",
      price: "0",
      targetDuration: 4,
      specificRequirements: "",
      thumbnail: "",
      isPublished: false,
    },
  });

  const createCourseMutation = useMutation({
    mutationFn: async (courseData: InsertCourse) => {
      const response = await apiRequest("POST", "/api/courses", courseData);
      return response.json();
    },
    onSuccess: (course) => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "Course Created Successfully!",
        description: `"${course.title}" has been created and ${course.isPublished ? "published" : "saved as draft"}.`,
      });
      setLocation("/courses");
    },
    onError: (error: any) => {
      toast({
        title: "Error Creating Course",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const generateContentMutation = useMutation({
    mutationFn: async (data: AIGenerationForm) => {
      const response = await apiRequest("POST", "/api/courses/generate", data);
      return response.json();
    },
    onSuccess: (content) => {
      setGeneratedContent(content);
      toast({
        title: "Course Content Generated!",
        description: `Generated ${content.lessons.length} lessons with ${content.totalDuration} minutes of content.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Generating Content",
        description: error.message || "Failed to generate course content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createAICourseMutation = useMutation({
    mutationFn: async (data: AIGenerationForm) => {
      const response = await apiRequest("POST", "/api/courses/create-with-ai", data);
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "AI Course Created Successfully!",
        description: `"${result.course.title}" has been created with ${result.generatedContent.lessons.length} AI-generated lessons.`,
      });
      setLocation("/courses");
    },
    onError: (error: any) => {
      toast({
        title: "Error Creating AI Course",
        description: error.message || "Failed to create AI-powered course. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertCourse) => {
    createCourseMutation.mutate(data);
  };

  const onGenerateContent = (data: AIGenerationForm) => {
    generateContentMutation.mutate(data);
  };

  const onCreateAICourse = (data: AIGenerationForm) => {
    createAICourseMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-[#f5f6f8] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            data-testid="button-back-to-dashboard"
            className="h-10 w-10 p-0"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="heading-create-course">
              Create New Course
            </h1>
            <p className="text-gray-600 mt-1">
              Build and publish your course using traditional authoring or AI-powered content generation
            </p>
          </div>
        </div>

        {/* Course Creation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="traditional" className="flex items-center gap-2">
              <BookOpenIcon className="h-4 w-4" />
              Traditional Course
            </TabsTrigger>
            <TabsTrigger value="ai-powered" className="flex items-center gap-2">
              <SparklesIcon className="h-4 w-4" />
              AI-Powered Course
              <Badge variant="secondary" className="ml-1 text-xs">New</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="traditional" className="space-y-6">

            <Card className="shadow-lg">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BookOpenIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Traditional Course Creation</CardTitle>
                    <CardDescription>
                      Manually create your course content and structure
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Basic Information Section */}
                <div className="space-y-6">
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold mb-2">Basic Information</h3>
                    <p className="text-sm text-gray-600">Core details about your course</p>
                  </div>

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Title *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Complete Web Development Bootcamp"
                            data-testid="input-course-title"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Create a compelling title that clearly describes what students will learn
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
                        <FormLabel>Course Description *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe what students will learn, prerequisites, and what makes your course unique..."
                            className="min-h-[120px]"
                            data-testid="textarea-course-description"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Provide a detailed overview that helps students understand the value and outcomes
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-course-category">
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>Choose the most relevant category</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Difficulty Level *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-course-level">
                                <SelectValue placeholder="Select difficulty level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>Target audience skill level</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Course Details Section */}
                <div className="space-y-6">
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold mb-2">Course Details</h3>
                    <p className="text-sm text-gray-600">Pricing, duration, and visual elements</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (USD) *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSignIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                className="pl-10"
                                data-testid="input-course-price"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>Set to 0 for free courses</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (Hours) *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                type="number"
                                min="1"
                                max="200"
                                placeholder="1"
                                className="pl-10"
                                data-testid="input-course-duration"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>Estimated completion time</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="thumbnail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Thumbnail Image URL</FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder="https://example.com/course-thumbnail.jpg"
                            data-testid="input-course-thumbnail"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Optional: Provide a URL to an image that represents your course (recommended: 1280x720)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Publishing Options */}
                <div className="space-y-6">
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold mb-2">Publishing Options</h3>
                    <p className="text-sm text-gray-600">Control course visibility and availability</p>
                  </div>

                  <FormField
                    control={form.control}
                    name="isPublished"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Publish Immediately</FormLabel>
                          <FormDescription>
                            Make this course available to students right away. You can change this later.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-course-published"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-between pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/courses")}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        form.setValue("isPublished", false);
                        form.handleSubmit(onSubmit)();
                      }}
                      disabled={createCourseMutation.isPending}
                      data-testid="button-save-draft"
                    >
                      Save as Draft
                    </Button>
                    <Button
                      type="submit"
                      disabled={createCourseMutation.isPending}
                      data-testid="button-create-course"
                      className="min-w-[120px]"
                    >
                      {createCourseMutation.isPending ? "Creating..." : "Create Course"}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-powered" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <SparklesIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">AI-Powered Course Creation</CardTitle>
                    <CardDescription>
                      Generate professional slide-based course content using AI with 6+ lessons and comprehensive content
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <Form {...aiForm}>
                  <form onSubmit={aiForm.handleSubmit(onCreateAICourse)} className="space-y-8">
                    {/* Basic Information Section */}
                    <div className="space-y-6">
                      <div className="border-b pb-4">
                        <h3 className="text-lg font-semibold mb-2">Course Overview</h3>
                        <p className="text-sm text-gray-600">Provide the topic and AI will generate comprehensive content</p>
                      </div>

                      <FormField
                        control={aiForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Course Title *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Advanced JavaScript Programming"
                                data-testid="input-ai-course-title"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Be specific about the topic - this will guide AI content generation
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={aiForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Course Description *</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe what students will learn and the target audience..."
                                className="min-h-[120px]"
                                data-testid="textarea-ai-course-description"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Detailed description helps AI create more relevant and targeted content
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={aiForm.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-ai-course-category">
                                    <SelectValue placeholder="Select a category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {categories.map((category) => (
                                    <SelectItem key={category} value={category}>
                                      {category}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={aiForm.control}
                          name="level"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Level *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-ai-course-level">
                                    <SelectValue placeholder="Select difficulty level" />
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
                    </div>

                    {/* AI Configuration */}
                    <div className="space-y-6">
                      <div className="border-b pb-4">
                        <h3 className="text-lg font-semibold mb-2">AI Generation Settings</h3>
                        <p className="text-sm text-gray-600">Configure how AI will generate your course content</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={aiForm.control}
                          name="targetDuration"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Target Duration (Hours) *</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                  <Input
                                    type="number"
                                    min="1"
                                    max="20"
                                    placeholder="4"
                                    className="pl-10"
                                    data-testid="input-ai-target-duration"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 4)}
                                  />
                                </div>
                              </FormControl>
                              <FormDescription>Total course duration (will generate 6 lessons)</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={aiForm.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price (USD) *</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <DollarSignIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="29.99"
                                    className="pl-10"
                                    data-testid="input-ai-course-price"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormDescription>Set to 0 for free courses</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={aiForm.control}
                        name="specificRequirements"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Specific Requirements (Optional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="e.g., Include practical projects, focus on real-world examples, cover specific technologies..."
                                className="min-h-[100px]"
                                data-testid="textarea-ai-requirements"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Special instructions for AI to customize the content generation
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {generatedContent && (
                      <div className="space-y-6">
                        <div className="border-b pb-4">
                          <h3 className="text-lg font-semibold mb-2">Generated Content Preview</h3>
                          <p className="text-sm text-gray-600">Review the AI-generated course structure</p>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <SparklesIcon className="h-5 w-5 text-green-600" />
                            <span className="font-semibold text-green-800">Content Generated Successfully!</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Lessons:</span> {generatedContent.lessons.length}
                            </div>
                            <div>
                              <span className="font-medium">Duration:</span> {Math.round(generatedContent.totalDuration / 60)}h {generatedContent.totalDuration % 60}m
                            </div>
                            <div>
                              <span className="font-medium">Slides:</span> {generatedContent.lessons.reduce((acc: number, lesson: any) => acc + lesson.slides.length, 0)}
                            </div>
                            <div>
                              <span className="font-medium">Objectives:</span> {generatedContent.learningObjectives.length}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="font-medium">Lesson Overview:</h4>
                          {generatedContent.lessons.map((lesson: any, index: number) => (
                            <div key={lesson.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Badge variant="outline">Lesson {index + 1}</Badge>
                                <span className="font-medium">{lesson.title}</span>
                              </div>
                              <div className="text-sm text-gray-600">
                                {lesson.slides.length} slides • {lesson.duration}min
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Form Actions */}
                    <div className="flex items-center justify-between pt-6 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setLocation("/courses")}
                        data-testid="button-ai-cancel"
                      >
                        Cancel
                      </Button>

                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={aiForm.handleSubmit(onGenerateContent)}
                          disabled={generateContentMutation.isPending || createAICourseMutation.isPending}
                          data-testid="button-generate-content"
                        >
                          {generateContentMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <SparklesIcon className="mr-2 h-4 w-4" />
                              Preview Content
                            </>
                          )}
                        </Button>
                        <Button
                          type="submit"
                          disabled={createAICourseMutation.isPending || generateContentMutation.isPending}
                          data-testid="button-create-ai-course"
                          className="min-w-[140px]"
                        >
                          {createAICourseMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <SparklesIcon className="mr-2 h-4 w-4" />
                              Create AI Course
                            </>
                          )}
                        </Button>
                      </div>
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
};