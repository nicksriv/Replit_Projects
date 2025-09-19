import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertSkillSchema, insertStudentSkillProgressSchema, type InsertSkill, type InsertStudentSkillProgress } from "@shared/schema";
import {
  PlusIcon, EditIcon, TrashIcon, MoreVerticalIcon,
  BookOpenIcon, TrendingUpIcon, UserCheckIcon,
  TargetIcon, AwardIcon, BarChart3Icon,
  CheckCircleIcon, ClockIcon, AlertTriangleIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Types based on our schema
interface Skill {
  id: number;
  name: string;
  description: string;
  category: string;
  level: string;
  prerequisites: string[] | null;
  instructorId: number;
  isActive: boolean;
  createdAt: string;
}

interface StudentSkillProgress {
  id: number;
  studentId: number;
  skillId: number;
  instructorId: number;
  currentLevel: string;
  progressPercentage: string;
  assessmentsPassed: number;
  totalAssessments: number;
  lastActivityAt: string;
  skillAchievedAt: string | null;
  notes: string | null;
  student: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
  skill: Skill;
}

// Form schemas - using shared schemas
type SkillFormData = InsertSkill;

const updateProgressSchema = insertStudentSkillProgressSchema.pick({
  currentLevel: true,
  progressPercentage: true,
  notes: true,
});

type UpdateProgressFormData = z.infer<typeof updateProgressSchema>;

export function SkillsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [selectedProgress, setSelectedProgress] = useState<StudentSkillProgress | null>(null);
  const [skillDialogOpen, setSkillDialogOpen] = useState(false);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);

  // Queries
  const { data: skills = [], isLoading: skillsLoading } = useQuery<Skill[]>({
    queryKey: ["/api/skills"],
  });

  const { data: studentProgress = [], isLoading: progressLoading } = useQuery<StudentSkillProgress[]>({
    queryKey: ["/api/student-skill-progress"],
  });

  // Mutations
  const createSkillMutation = useMutation({
    mutationFn: (data: SkillFormData) => 
      apiRequest("/api/skills", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      setSkillDialogOpen(false);
      toast({ title: "Success", description: "Skill created successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create skill", variant: "destructive" });
    }
  });

  const updateSkillMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SkillFormData> }) =>
      apiRequest(`/api/skills/${id}`, { method: "PATCH", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      setSkillDialogOpen(false);
      toast({ title: "Success", description: "Skill updated successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update skill", variant: "destructive" });
    }
  });

  const deleteSkillMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/skills/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      toast({ title: "Success", description: "Skill deleted successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete skill", variant: "destructive" });
    }
  });

  const updateProgressMutation = useMutation({
    mutationFn: ({ studentId, skillId, data }: { studentId: number; skillId: number; data: UpdateProgressFormData }) =>
      apiRequest(`/api/student-skill-progress/${studentId}/${skillId}`, { method: "PATCH", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student-skill-progress"] });
      setProgressDialogOpen(false);
      toast({ title: "Success", description: "Progress updated successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update progress", variant: "destructive" });
    }
  });

  // Form setup
  const skillForm = useForm<SkillFormData>({
    resolver: zodResolver(insertSkillSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "technical",
      level: "beginner",
      prerequisites: [],
      isActive: true,
    },
  });

  const progressForm = useForm<UpdateProgressFormData>({
    resolver: zodResolver(updateProgressSchema),
    defaultValues: {
      currentLevel: "beginner",
      progressPercentage: "0",
      notes: "",
    },
  });

  // Event handlers
  const handleCreateSkill = () => {
    setSelectedSkill(null);
    skillForm.reset();
    setSkillDialogOpen(true);
  };

  const handleEditSkill = (skill: Skill) => {
    setSelectedSkill(skill);
    skillForm.reset({
      name: skill.name,
      description: skill.description,
      category: skill.category as any,
      level: skill.level as any,
      prerequisites: skill.prerequisites || [],
      isActive: skill.isActive,
    });
    setSkillDialogOpen(true);
  };

  const handleDeleteSkill = (skill: Skill) => {
    if (window.confirm(`Are you sure you want to delete "${skill.name}"?`)) {
      deleteSkillMutation.mutate(skill.id);
    }
  };

  const handleUpdateProgress = (progress: StudentSkillProgress) => {
    setSelectedProgress(progress);
    progressForm.reset({
      currentLevel: progress.currentLevel as any,
      progressPercentage: progress.progressPercentage,
      notes: progress.notes || "",
    });
    setProgressDialogOpen(true);
  };

  const onSubmitSkill = (data: SkillFormData) => {
    if (selectedSkill) {
      updateSkillMutation.mutate({ id: selectedSkill.id, data });
    } else {
      createSkillMutation.mutate(data);
    }
  };

  const onSubmitProgress = (data: UpdateProgressFormData) => {
    if (selectedProgress) {
      updateProgressMutation.mutate({
        studentId: selectedProgress.studentId,
        skillId: selectedProgress.skillId,
        data,
      });
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "technical": return "bg-blue-100 text-blue-800";
      case "soft": return "bg-green-100 text-green-800";
      case "domain-specific": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "beginner": return "bg-gray-100 text-gray-800";
      case "intermediate": return "bg-yellow-100 text-yellow-800";
      case "advanced": return "bg-orange-100 text-orange-800";
      case "expert": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getProgressIcon = (percentage: number) => {
    if (percentage >= 100) return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
    if (percentage >= 50) return <TrendingUpIcon className="h-4 w-4 text-blue-600" />;
    if (percentage > 0) return <ClockIcon className="h-4 w-4 text-yellow-600" />;
    return <AlertTriangleIcon className="h-4 w-4 text-gray-600" />;
  };

  // Analytics calculations
  const activeSkills = skills.filter(skill => skill.isActive).length;
  const totalStudentsLearning = new Set(studentProgress.map(p => p.studentId)).size;
  const avgProgressRate = studentProgress.length > 0 
    ? studentProgress.reduce((sum, p) => sum + parseFloat(p.progressPercentage || "0"), 0) / studentProgress.length
    : 0;
  const skillsCompleted = studentProgress.filter(p => parseFloat(p.progressPercentage || "0") >= 100).length;

  return (
    <div className="min-h-screen bg-[#f5f6f8] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="heading-skills-management">
              Skills Management
            </h1>
            <p className="text-gray-600 mt-1">Track and assess student skills development</p>
          </div>
          <Button onClick={handleCreateSkill} data-testid="button-create-skill">
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Skill
          </Button>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpenIcon className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Skills</p>
                  <p className="text-2xl font-bold text-gray-900" data-testid="stat-active-skills">
                    {activeSkills}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <UserCheckIcon className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Students Learning</p>
                  <p className="text-2xl font-bold text-gray-900" data-testid="stat-students-learning">
                    {totalStudentsLearning}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3Icon className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Progress</p>
                  <p className="text-2xl font-bold text-gray-900" data-testid="stat-avg-progress">
                    {avgProgressRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AwardIcon className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Skills Completed</p>
                  <p className="text-2xl font-bold text-gray-900" data-testid="stat-skills-completed">
                    {skillsCompleted}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="skills" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="skills" data-testid="tab-skills">Skills</TabsTrigger>
            <TabsTrigger value="progress" data-testid="tab-progress">Student Progress</TabsTrigger>
          </TabsList>

          {/* Skills Tab */}
          <TabsContent value="skills">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TargetIcon className="h-5 w-5 mr-2" />
                  Skills Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {skillsLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-600 mt-4">Loading skills...</p>
                    </div>
                  </div>
                ) : skills.length === 0 ? (
                  <div className="text-center p-8">
                    <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No skills yet</h3>
                    <p className="text-gray-600 mb-4">Create your first skill to start tracking student development.</p>
                    <Button onClick={handleCreateSkill} data-testid="button-create-first-skill">
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Create First Skill
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {skills.map((skill) => (
                      <div key={skill.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg" data-testid={`skill-name-${skill.id}`}>
                                {skill.name}
                              </h3>
                              <Badge className={getCategoryColor(skill.category)} data-testid={`skill-category-${skill.id}`}>
                                {skill.category}
                              </Badge>
                              <Badge className={getLevelColor(skill.level)} data-testid={`skill-level-${skill.id}`}>
                                {skill.level}
                              </Badge>
                              {!skill.isActive && (
                                <Badge variant="secondary" data-testid={`skill-status-${skill.id}`}>
                                  Inactive
                                </Badge>
                              )}
                            </div>
                            <p className="text-gray-600 mb-3" data-testid={`skill-description-${skill.id}`}>
                              {skill.description}
                            </p>
                            {skill.prerequisites && skill.prerequisites.length > 0 && (
                              <div className="mb-2">
                                <span className="text-sm font-medium text-gray-600">Prerequisites:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {skill.prerequisites.map((prereq, index) => (
                                    <Badge key={index} variant="outline" className="text-xs" data-testid={`skill-prereq-${skill.id}-${index}`}>
                                      {prereq}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="text-xs text-gray-500">
                              Created: {new Date(skill.createdAt).toLocaleDateString()}
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" data-testid={`skill-menu-${skill.id}`}>
                                <MoreVerticalIcon className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditSkill(skill)} data-testid={`button-edit-skill-${skill.id}`}>
                                <EditIcon className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteSkill(skill)}
                                className="text-red-600" 
                                data-testid={`button-delete-skill-${skill.id}`}
                              >
                                <TrashIcon className="h-4 w-4 mr-2" />
                                Delete
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

          {/* Student Progress Tab */}
          <TabsContent value="progress">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUpIcon className="h-5 w-5 mr-2" />
                  Student Progress Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                {progressLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-600 mt-4">Loading progress data...</p>
                    </div>
                  </div>
                ) : studentProgress.length === 0 ? (
                  <div className="text-center p-8">
                    <TrendingUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No progress data yet</h3>
                    <p className="text-gray-600">Student skill progress will appear here as they engage with your skills.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {studentProgress.map((progress) => (
                      <div key={progress.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="flex items-center gap-2">
                                {getProgressIcon(parseFloat(progress.progressPercentage))}
                                <h3 className="font-semibold" data-testid={`progress-student-${progress.id}`}>
                                  {progress.student.username}
                                </h3>
                              </div>
                              <span className="text-gray-600">•</span>
                              <span className="font-medium" data-testid={`progress-skill-${progress.id}`}>
                                {progress.skill.name}
                              </span>
                              <Badge className={getLevelColor(progress.currentLevel)} data-testid={`progress-level-${progress.id}`}>
                                {progress.currentLevel}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm text-gray-600">Progress:</span>
                                  <span className="text-sm font-medium" data-testid={`progress-percentage-${progress.id}`}>
                                    {parseFloat(progress.progressPercentage).toFixed(1)}%
                                  </span>
                                </div>
                                <Progress 
                                  value={parseFloat(progress.progressPercentage)} 
                                  className="h-2"
                                  data-testid={`progress-bar-${progress.id}`}
                                />
                              </div>
                              <div className="text-sm">
                                <span className="text-gray-600">Assessments:</span>
                                <span className="font-medium ml-2" data-testid={`progress-assessments-${progress.id}`}>
                                  {progress.assessmentsPassed}/{progress.totalAssessments}
                                </span>
                              </div>
                              <div className="text-sm">
                                <span className="text-gray-600">Last Activity:</span>
                                <span className="font-medium ml-2" data-testid={`progress-activity-${progress.id}`}>
                                  {new Date(progress.lastActivityAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>

                            {progress.notes && (
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-sm text-gray-700" data-testid={`progress-notes-${progress.id}`}>
                                  <strong>Notes:</strong> {progress.notes}
                                </p>
                              </div>
                            )}

                            {progress.skillAchievedAt && (
                              <div className="mt-2">
                                <Badge className="bg-green-100 text-green-800" data-testid={`progress-achieved-${progress.id}`}>
                                  ✓ Skill Achieved on {new Date(progress.skillAchievedAt).toLocaleDateString()}
                                </Badge>
                              </div>
                            )}
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateProgress(progress)}
                            data-testid={`button-update-progress-${progress.id}`}
                          >
                            <EditIcon className="h-4 w-4 mr-2" />
                            Update
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Skill Form Dialog */}
        <Dialog open={skillDialogOpen} onOpenChange={setSkillDialogOpen}>
          <DialogContent className="max-w-2xl" data-testid="dialog-skill-form">
            <DialogHeader>
              <DialogTitle data-testid="dialog-skill-title">
                {selectedSkill ? "Edit Skill" : "Create New Skill"}
              </DialogTitle>
            </DialogHeader>

            <Form {...skillForm}>
              <form onSubmit={skillForm.handleSubmit(onSubmitSkill)} className="space-y-4">
                <FormField
                  control={skillForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Skill Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., React Development" {...field} data-testid="input-skill-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={skillForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe what this skill encompasses..."
                          rows={3}
                          {...field} 
                          data-testid="textarea-skill-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={skillForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-skill-category">
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="technical">Technical</SelectItem>
                            <SelectItem value="soft">Soft Skills</SelectItem>
                            <SelectItem value="domain-specific">Domain Specific</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={skillForm.control}
                    name="level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Difficulty Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-skill-level">
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                            <SelectItem value="expert">Expert</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setSkillDialogOpen(false)}
                    data-testid="button-cancel-skill"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createSkillMutation.isPending || updateSkillMutation.isPending}
                    data-testid="button-save-skill"
                  >
                    {(createSkillMutation.isPending || updateSkillMutation.isPending) ? "Saving..." : "Save Skill"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Progress Update Dialog */}
        <Dialog open={progressDialogOpen} onOpenChange={setProgressDialogOpen}>
          <DialogContent data-testid="dialog-progress-form">
            <DialogHeader>
              <DialogTitle data-testid="dialog-progress-title">Update Progress</DialogTitle>
              {selectedProgress && (
                <p className="text-sm text-gray-600">
                  {selectedProgress.student.username} • {selectedProgress.skill.name}
                </p>
              )}
            </DialogHeader>

            <Form {...progressForm}>
              <form onSubmit={progressForm.handleSubmit(onSubmitProgress)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={progressForm.control}
                    name="currentLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-progress-level">
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                            <SelectItem value="expert">Expert</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={progressForm.control}
                    name="progressPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Progress (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            max="100" 
                            step="0.1"
                            placeholder="0-100" 
                            {...field} 
                            data-testid="input-progress-percentage"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={progressForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add notes about student's progress..."
                          rows={3}
                          {...field} 
                          data-testid="textarea-progress-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setProgressDialogOpen(false)}
                    data-testid="button-cancel-progress"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateProgressMutation.isPending}
                    data-testid="button-save-progress"
                  >
                    {updateProgressMutation.isPending ? "Updating..." : "Update Progress"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}