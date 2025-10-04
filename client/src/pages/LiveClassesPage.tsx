import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  CalendarIcon, 
  Clock, 
  Video, 
  Upload, 
  Trash2, 
  Edit,
  Users,
  PlayCircle,
  CheckCircle,
  XCircle,
  Eye
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface LiveClass {
  id: number;
  title: string;
  description: string;
  instructorId: number;
  courseId: number | null;
  scheduledAt: string;
  duration: number;
  meetingUrl: string | null;
  status: "scheduled" | "live" | "completed" | "cancelled";
  maxParticipants: number | null;
  recordingUrl: string | null;
  createdAt: string;
}

interface RecordedVideo {
  id: number;
  title: string;
  description: string;
  instructorId: number;
  courseId: number | null;
  videoUrl: string;
  thumbnail: string | null;
  duration: number;
  fileSize: number | null;
  uploadedAt: string;
  views: number;
  isPublished: boolean;
}

export const LiveClassesPage = (): JSX.Element => {
  const { toast } = useToast();
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
  const [isUploadVideoOpen, setIsUploadVideoOpen] = useState(false);

  const { data: liveClasses = [], isLoading: isLoadingClasses } = useQuery<LiveClass[]>({
    queryKey: ["/api/live-classes"],
  });

  const { data: recordedVideos = [], isLoading: isLoadingVideos } = useQuery<RecordedVideo[]>({
    queryKey: ["/api/recorded-videos"],
  });

  const deleteClassMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/live-classes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/live-classes"] });
      toast({ title: "Success", description: "Live class deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete live class", variant: "destructive" });
    },
  });

  const deleteVideoMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/recorded-videos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recorded-videos"] });
      toast({ title: "Success", description: "Video deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete video", variant: "destructive" });
    },
  });

  const getStatusBadge = (status: LiveClass["status"]) => {
    const variants = {
      scheduled: { variant: "secondary" as const, icon: CalendarIcon },
      live: { variant: "default" as const, icon: PlayCircle },
      completed: { variant: "outline" as const, icon: CheckCircle },
      cancelled: { variant: "destructive" as const, icon: XCircle },
    };
    const config = variants[status];
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Classes</h1>
          <p className="text-gray-600">Manage your live sessions and recorded video library</p>
        </div>

        <Tabs defaultValue="live-classes" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="live-classes" data-testid="tab-live-classes">
              <Video className="h-4 w-4 mr-2" />
              Live Classes
            </TabsTrigger>
            <TabsTrigger value="recorded-videos" data-testid="tab-recorded-videos">
              <Upload className="h-4 w-4 mr-2" />
              Recorded Videos
            </TabsTrigger>
          </TabsList>

          {/* Live Classes Tab */}
          <TabsContent value="live-classes" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Scheduled & Past Classes</h2>
              <CreateClassDialog 
                open={isCreateClassOpen}
                onOpenChange={setIsCreateClassOpen}
              />
            </div>

            {isLoadingClasses ? (
              <div className="text-center py-12">Loading...</div>
            ) : liveClasses.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Video className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">No live classes scheduled yet</p>
                  <Button onClick={() => setIsCreateClassOpen(true)} data-testid="button-create-first-class">
                    Schedule Your First Class
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {liveClasses.map((liveClass) => (
                  <Card key={liveClass.id} data-testid={`card-live-class-${liveClass.id}`}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{liveClass.title}</h3>
                            {getStatusBadge(liveClass.status)}
                          </div>
                          <p className="text-gray-600 mb-4">{liveClass.description}</p>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="h-4 w-4" />
                              {format(new Date(liveClass.scheduledAt), "PPP")}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {liveClass.duration} minutes
                            </div>
                            {liveClass.maxParticipants && (
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                Max {liveClass.maxParticipants} participants
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {liveClass.meetingUrl && liveClass.status === "scheduled" && (
                            <Button
                              variant="default"
                              size="sm"
                              asChild
                              data-testid={`button-join-${liveClass.id}`}
                            >
                              <a href={liveClass.meetingUrl} target="_blank" rel="noopener noreferrer">
                                Join Class
                              </a>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            data-testid={`button-delete-class-${liveClass.id}`}
                            onClick={() => deleteClassMutation.mutate(liveClass.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Recorded Videos Tab */}
          <TabsContent value="recorded-videos" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Video Library</h2>
              <UploadVideoDialog 
                open={isUploadVideoOpen}
                onOpenChange={setIsUploadVideoOpen}
              />
            </div>

            {isLoadingVideos ? (
              <div className="text-center py-12">Loading...</div>
            ) : recordedVideos.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">No recorded videos yet</p>
                  <Button onClick={() => setIsUploadVideoOpen(true)} data-testid="button-upload-first-video">
                    Upload Your First Video
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recordedVideos.map((video) => (
                  <Card key={video.id} data-testid={`card-video-${video.id}`}>
                    <CardHeader className="p-0">
                      {video.thumbnail ? (
                        <img 
                          src={video.thumbnail} 
                          alt={video.title}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-200 flex items-center justify-center rounded-t-lg">
                          <Video className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2">{video.title}</h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{video.description}</p>
                      
                      <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {video.views} views
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1"
                          asChild
                          data-testid={`button-watch-${video.id}`}
                        >
                          <a href={video.videoUrl} target="_blank" rel="noopener noreferrer">
                            Watch
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-delete-video-${video.id}`}
                          onClick={() => deleteVideoMutation.mutate(video.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Create Class Dialog Component
function CreateClassDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    scheduledAt: "",
    duration: 60,
    meetingUrl: "",
    maxParticipants: 50,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => apiRequest("POST", "/api/live-classes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/live-classes"] });
      toast({ title: "Success", description: "Live class scheduled successfully" });
      onOpenChange(false);
      setFormData({
        title: "",
        description: "",
        scheduledAt: "",
        duration: 60,
        meetingUrl: "",
        maxParticipants: 50,
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to schedule live class", 
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button data-testid="button-schedule-class">
          <CalendarIcon className="h-4 w-4 mr-2" />
          Schedule Live Class
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule New Live Class</DialogTitle>
          <DialogDescription>
            Create a new live class session for your students
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Class Title</Label>
            <Input
              id="title"
              data-testid="input-class-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Introduction to React Hooks"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              data-testid="input-class-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Learn about useState, useEffect, and custom hooks"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="scheduledAt">Scheduled Date & Time</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                data-testid="input-class-datetime"
                value={formData.scheduledAt}
                onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                data-testid="input-class-duration"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                min={15}
                max={480}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="meetingUrl">Meeting URL (optional)</Label>
            <Input
              id="meetingUrl"
              data-testid="input-meeting-url"
              value={formData.meetingUrl}
              onChange={(e) => setFormData({ ...formData, meetingUrl: e.target.value })}
              placeholder="https://zoom.us/j/..."
              type="url"
            />
          </div>

          <div>
            <Label htmlFor="maxParticipants">Max Participants (optional)</Label>
            <Input
              id="maxParticipants"
              type="number"
              data-testid="input-max-participants"
              value={formData.maxParticipants}
              onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) })}
              min={1}
              max={1000}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" data-testid="button-submit-class" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Scheduling..." : "Schedule Class"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Upload Video Dialog Component
function UploadVideoDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    videoUrl: "",
    thumbnail: "",
    duration: 0,
    isPublished: false,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => apiRequest("POST", "/api/recorded-videos", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recorded-videos"] });
      toast({ title: "Success", description: "Video uploaded successfully" });
      onOpenChange(false);
      setFormData({
        title: "",
        description: "",
        videoUrl: "",
        thumbnail: "",
        duration: 0,
        isPublished: false,
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to upload video", 
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button data-testid="button-upload-video">
          <Upload className="h-4 w-4 mr-2" />
          Upload Video
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Recorded Video</DialogTitle>
          <DialogDescription>
            Add a new video to your library
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="video-title">Video Title</Label>
            <Input
              id="video-title"
              data-testid="input-video-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Complete React Course - Lecture 1"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="video-description">Description</Label>
            <Textarea
              id="video-description"
              data-testid="input-video-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Introduction to React fundamentals"
              required
            />
          </div>

          <div>
            <Label htmlFor="videoUrl">Video URL</Label>
            <Input
              id="videoUrl"
              data-testid="input-video-url"
              value={formData.videoUrl}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              placeholder="https://youtube.com/watch?v=..."
              type="url"
              required
            />
          </div>

          <div>
            <Label htmlFor="thumbnail">Thumbnail URL (optional)</Label>
            <Input
              id="thumbnail"
              data-testid="input-video-thumbnail"
              value={formData.thumbnail}
              onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
              placeholder="https://example.com/thumbnail.jpg"
              type="url"
            />
          </div>

          <div>
            <Label htmlFor="video-duration">Duration (seconds)</Label>
            <Input
              id="video-duration"
              type="number"
              data-testid="input-video-duration"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              min={1}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPublished"
              data-testid="checkbox-is-published"
              checked={formData.isPublished}
              onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="isPublished" className="cursor-pointer">
              Publish immediately
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" data-testid="button-submit-video" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Uploading..." : "Upload Video"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
