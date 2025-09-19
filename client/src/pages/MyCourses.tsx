import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger, 
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Course } from "@shared/schema";
import { 
  PlusIcon, 
  BookOpenIcon, 
  EditIcon, 
  TrashIcon, 
  MoreVerticalIcon,
  SearchIcon,
  EyeIcon,
  DollarSignIcon,
  ClockIcon,
  UsersIcon
} from "lucide-react";
import { useState } from "react";

export const MyCourses = (): JSX.Element => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { data: courses = [], isLoading, error } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (courseId: number) => {
      await apiRequest("DELETE", `/api/courses/${courseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "Course Deleted",
        description: "The course has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Deleting Course",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async ({ courseId, isPublished }: { courseId: number; isPublished: boolean }) => {
      const response = await apiRequest("PUT", `/api/courses/${courseId}`, { isPublished });
      return response.json();
    },
    onSuccess: (course) => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: course.isPublished ? "Course Published" : "Course Unpublished",
        description: course.isPublished 
          ? "Your course is now live and available to students."
          : "Your course is now hidden from students.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Updating Course",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Filter courses based on search and filters
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "published" && course.isPublished) ||
                         (statusFilter === "draft" && !course.isPublished);
    const matchesCategory = categoryFilter === "all" || course.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categories = Array.from(new Set(courses.map(course => course.category)));

  const handleDeleteCourse = (courseId: number, courseTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${courseTitle}"? This action cannot be undone.`)) {
      deleteMutation.mutate(courseId);
    }
  };

  const handleTogglePublish = (courseId: number, currentStatus: boolean) => {
    publishMutation.mutate({ courseId, isPublished: !currentStatus });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#f5f6f8] p-6">
        <div className="max-w-6xl mx-auto">
          <Alert variant="destructive" className="max-w-md mx-auto">
            <AlertDescription>
              Failed to load courses. Please try again later.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="heading-my-courses">
              My Courses
            </h1>
            <p className="text-gray-600 mt-1">
              Manage and track your course content
            </p>
          </div>
          <Button 
            onClick={() => setLocation("/courses/new")}
            data-testid="button-create-new-course"
            className="flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            Create New Course
          </Button>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-courses"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48" data-testid="select-status-filter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48" data-testid="select-category-filter">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Courses Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpenIcon className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2" data-testid="text-no-courses">
                {courses.length === 0 ? "No courses yet" : "No courses match your filters"}
              </h3>
              <p className="text-gray-600 text-center mb-4">
                {courses.length === 0 
                  ? "Start creating your first course to share your knowledge with the world."
                  : "Try adjusting your search terms or filters to find more courses."
                }
              </p>
              {courses.length === 0 && (
                <Button onClick={() => setLocation("/courses/new")} data-testid="button-create-first-course">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Your First Course
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-shadow" data-testid={`card-course-${course.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2 mb-2" data-testid={`text-course-title-${course.id}`}>
                        {course.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          variant={course.isPublished === true ? "default" : "secondary"}
                          data-testid={`badge-status-${course.id}`}
                        >
                          {course.isPublished === true ? "Published" : "Draft"}
                        </Badge>
                        <Badge variant="outline" data-testid={`badge-category-${course.id}`}>
                          {course.category}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" data-testid={`button-course-menu-${course.id}`}>
                          <MoreVerticalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => setLocation(`/courses/${course.id}`)}
                          data-testid={`button-view-course-${course.id}`}
                        >
                          <EyeIcon className="h-4 w-4 mr-2" />
                          View Course
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setLocation(`/courses/${course.id}/edit`)}
                          data-testid={`button-edit-course-${course.id}`}
                        >
                          <EditIcon className="h-4 w-4 mr-2" />
                          Edit Course
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleTogglePublish(course.id, course.isPublished === true)}
                          disabled={publishMutation.isPending}
                          data-testid={`button-toggle-publish-${course.id}`}
                        >
                          {course.isPublished === true ? "Unpublish" : "Publish"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteCourse(course.id, course.title)}
                          disabled={deleteMutation.isPending}
                          className="text-red-600"
                          data-testid={`button-delete-course-${course.id}`}
                        >
                          <TrashIcon className="h-4 w-4 mr-2" />
                          Delete Course
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <CardDescription className="line-clamp-3 mb-4" data-testid={`text-course-description-${course.id}`}>
                    {course.description}
                  </CardDescription>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <DollarSignIcon className="h-3 w-3" />
                      <span data-testid={`text-course-price-${course.id}`}>
                        {parseFloat(course.price) === 0 ? "Free" : `$${course.price}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ClockIcon className="h-3 w-3" />
                      <span data-testid={`text-course-duration-${course.id}`}>
                        {course.duration}h
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <UsersIcon className="h-3 w-3" />
                      <span className="capitalize" data-testid={`text-course-level-${course.id}`}>
                        {course.level}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500" data-testid={`text-course-date-${course.id}`}>
                      {course.createdAt ? new Date(course.createdAt).toLocaleDateString() : "No date"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Results Summary */}
        {!isLoading && courses.length > 0 && (
          <div className="mt-8 text-center text-sm text-gray-600" data-testid="text-results-summary">
            Showing {filteredCourses.length} of {courses.length} courses
          </div>
        )}
      </div>
    </div>
  );
};