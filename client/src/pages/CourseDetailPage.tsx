import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeftIcon, 
  PlayIcon, 
  PauseIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  BookOpenIcon,
  ClockIcon,
  TargetIcon,
  LightbulbIcon,
  MenuIcon,
  XIcon,
  MaximizeIcon,
  MinimizeIcon
} from "lucide-react";

interface Slide {
  id: string;
  title: string;
  content: string[];
  type: string;
  duration: number;
  notes?: string;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  slides: Slide[];
  duration: number;
  objectives: string[];
  keyTakeaways: string[];
}

interface Course {
  id: number;
  title: string;
  description: string;
  category: string;
  level: string;
  price: string;
  duration: number;
  thumbnail?: string;
  isPublished: boolean;
  aiGenerated?: boolean;
  generatedContent?: {
    lessons: Lesson[];
    totalDuration: number;
    outline: string;
    learningObjectives: string[];
    prerequisites: string[];
    targetAudience: string;
  };
}

export const CourseDetailPage = (): JSX.Element => {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const { data: course, isLoading, error } = useQuery<Course>({
    queryKey: [`/api/courses/${id}`],
    enabled: !!id,
  });

  // Calculate derived state (safe to call even if course is undefined)
  const lessons = course?.generatedContent?.lessons || [];
  const currentLesson = lessons[currentLessonIndex];
  const currentSlide = currentLesson?.slides?.[currentSlideIndex];
  
  const totalSlides = lessons.reduce((acc, lesson) => acc + (lesson.slides?.length || 0), 0);
  const currentSlideNumber = lessons.slice(0, currentLessonIndex).reduce((acc, lesson) => acc + (lesson.slides?.length || 0), 0) + currentSlideIndex + 1;
  const progress = totalSlides > 0 ? (currentSlideNumber / totalSlides) * 100 : 0;

  const nextSlide = () => {
    if (currentSlideIndex < (currentLesson?.slides?.length || 0) - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    } else if (currentLessonIndex < lessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
      setCurrentSlideIndex(0);
    }
  };

  const prevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    } else if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1);
      const prevLesson = lessons[currentLessonIndex - 1];
      setCurrentSlideIndex((prevLesson?.slides?.length || 1) - 1);
    }
  };

  const canGoNext = currentLessonIndex < lessons.length - 1 || currentSlideIndex < (currentLesson?.slides?.length || 0) - 1;
  const canGoPrev = currentLessonIndex > 0 || currentSlideIndex > 0;

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
    if (!isFullScreen) {
      setIsPlaying(true); // Auto-play when entering full screen
    }
  };

  const handlePlayPause = () => {
    if (!isFullScreen) {
      // First click enters full screen and starts playing
      toggleFullScreen();
    } else {
      // In full screen, toggle play/pause
      setIsPlaying(!isPlaying);
    }
  };

  // Auto-advance slides when playing (moved to top to satisfy hooks rule)
  useEffect(() => {
    if (!isPlaying || !currentSlide) return;

    const duration = (currentSlide.duration || 3) * 60 * 1000; // Convert minutes to milliseconds
    const timer = setTimeout(() => {
      if (canGoNext) {
        nextSlide();
      } else {
        setIsPlaying(false); // Stop playing at the end
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [isPlaying, currentSlide, canGoNext]);

  // Handle Escape key to exit full screen (moved to top to satisfy hooks rule)
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
        setIsPlaying(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isFullScreen]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f6f8] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course content...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-[#f5f6f8] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Course Not Found</h2>
          <p className="text-gray-600 mb-4">The course you're looking for doesn't exist.</p>
          <Button onClick={() => setLocation("/courses")}>
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  // If no AI-generated content, show course overview  
  if (!course.aiGenerated || !course.generatedContent || !course.generatedContent.lessons || course.generatedContent.lessons.length === 0) {
    return (
      <div className="min-h-screen bg-[#f5f6f8] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              onClick={() => setLocation("/courses")}
              data-testid="button-back"
              className="h-10 w-10 p-0"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900" data-testid="heading-course-title">
                {course.title}
              </h1>
              <p className="text-gray-600 mt-1">{course.description}</p>
            </div>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <BookOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Course Content Coming Soon</h3>
                <p className="text-gray-600 mb-4">
                  This course doesn't have AI-generated content yet. Content creation tools are in development.
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center justify-center gap-2">
                    <Badge variant="outline">{course.category}</Badge>
                    <Badge variant="outline">{course.level}</Badge>
                    <Badge variant="outline">{course.duration}h</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }


  return (
    <div className={`min-h-screen ${isFullScreen ? 'fixed inset-0 z-50 bg-black' : 'bg-[#f5f6f8]'}`}>
      {/* Header */}
      {!isFullScreen && (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => setLocation("/courses")}
                data-testid="button-back"
                className="h-10 w-10 p-0"
              >
                <ArrowLeftIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                data-testid="button-toggle-sidebar"
                className="h-10 w-10 p-0"
              >
                {sidebarCollapsed ? <MenuIcon className="h-4 w-4" /> : <XIcon className="h-4 w-4" />}
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900" data-testid="heading-course-title">
                  {course.title}
                </h1>
                <p className="text-sm text-gray-500">
                  Lesson {currentLessonIndex + 1}: {currentLesson?.title}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                {currentSlideNumber} of {totalSlides} slides
              </div>
              <div className="w-32">
                <Progress value={progress} className="h-2" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`flex ${isFullScreen ? 'h-screen' : 'h-[calc(100vh-80px)]'}`}>
        {/* Sidebar - Course Navigation */}
        {!isFullScreen && (
          <div className={`${sidebarCollapsed ? 'w-0' : 'w-80'} bg-white ${sidebarCollapsed ? '' : 'border-r border-gray-200'} overflow-hidden transition-all duration-300`}>
            <div className="w-80 h-full overflow-y-auto">
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Course Content</h3>
                
                {/* Course Overview */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-semibold text-blue-600">{lessons.length}</div>
                      <div className="text-gray-600">Lessons</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-blue-600">{totalSlides}</div>
                      <div className="text-gray-600">Slides</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-blue-600">{course.generatedContent.totalDuration}m</div>
                      <div className="text-gray-600">Duration</div>
                    </div>
                  </div>
                </div>

                {/* Lessons List */}
                <div className="space-y-2">
                  {lessons.map((lesson, lessonIdx) => (
                    <div key={lesson.id} className="border rounded-lg">
                      <div 
                        className={`p-3 cursor-pointer hover:bg-gray-50 ${
                          lessonIdx === currentLessonIndex ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                        onClick={() => {
                          setCurrentLessonIndex(lessonIdx);
                          setCurrentSlideIndex(0);
                        }}
                      >
                        <div className="font-medium text-sm">{lesson.title}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {lesson.slides?.length || 0} slides • {lesson.duration}min
                        </div>
                      </div>
                      
                      {lessonIdx === currentLessonIndex && (
                        <div className="border-t bg-gray-50">
                          {lesson.slides.map((slide, slideIdx) => (
                            <div
                              key={slide.id}
                              className={`px-4 py-2 text-xs cursor-pointer hover:bg-gray-100 border-l-2 ${
                                slideIdx === currentSlideIndex 
                                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                                  : 'border-transparent'
                              }`}
                              onClick={() => setCurrentSlideIndex(slideIdx)}
                            >
                              {slideIdx + 1}. {slide.title}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content - Slide Viewer */}
        <div className="flex-1 flex flex-col">
          {currentSlide ? (
            <div className="flex-1 flex flex-col">
              {/* Full Screen Header in full screen mode */}
              {isFullScreen && (
                <div className="bg-black/80 text-white p-4 flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">{course.title}</h1>
                    <p className="text-gray-300">
                      Lesson {currentLessonIndex + 1}: {currentLesson?.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-300">
                      {currentSlideNumber} of {totalSlides} slides
                    </div>
                    <Button
                      variant="ghost"
                      onClick={toggleFullScreen}
                      className="text-white hover:bg-white/20"
                      data-testid="button-exit-fullscreen"
                    >
                      <MinimizeIcon className="h-6 w-6" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Slide Content */}
              <div className={`flex-1 flex items-center justify-center ${isFullScreen ? 'p-12' : 'p-8'}`}>
                <div className={`w-full ${isFullScreen ? 'max-w-6xl' : 'max-w-4xl'}`}>
                  <Card className={`shadow-lg ${isFullScreen ? 'min-h-[600px] bg-white/95' : 'min-h-[500px]'}`}>
                    <CardHeader className="pb-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Badge variant="outline" className="text-xs">
                          {currentSlide.type}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          {currentSlide.duration} min
                        </Badge>
                      </div>
                      <CardTitle className={`${isFullScreen ? 'text-4xl' : 'text-2xl'}`}>
                        {currentSlide.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {Array.isArray(currentSlide.content) ? (
                          currentSlide.content.map((point, idx) => (
                            <div key={idx} className="flex items-start gap-4">
                              <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                              <p className={`leading-relaxed ${isFullScreen ? 'text-xl' : 'text-lg'}`}>
                                {point}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="flex items-start gap-4">
                            <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                            <p className={`leading-relaxed ${isFullScreen ? 'text-xl' : 'text-lg'}`}>
                              {currentSlide.content || 'No content available for this slide.'}
                            </p>
                          </div>
                        )}
                      </div>

                      {currentSlide.notes && (
                        <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center gap-2 text-yellow-800 mb-3">
                            <LightbulbIcon className="h-5 w-5" />
                            <span className="font-medium">Teaching Notes</span>
                          </div>
                          <p className={`text-yellow-700 ${isFullScreen ? 'text-lg' : 'text-sm'}`}>
                            {currentSlide.notes}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Navigation Controls */}
              <div className={`border-t px-8 py-4 ${isFullScreen ? 'bg-black/80 text-white' : 'bg-white'}`}>
                <div className={`mx-auto flex items-center justify-between ${isFullScreen ? 'max-w-6xl' : 'max-w-4xl'}`}>
                  <Button
                    variant={isFullScreen ? "secondary" : "outline"}
                    onClick={prevSlide}
                    disabled={!canGoPrev}
                    data-testid="button-prev-slide"
                    className="flex items-center gap-2"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-4">
                    <Button
                      variant={isFullScreen ? "secondary" : "outline"}
                      size="sm"
                      onClick={toggleFullScreen}
                      data-testid="button-fullscreen"
                      className="flex items-center gap-2"
                    >
                      {isFullScreen ? <MinimizeIcon className="h-4 w-4" /> : <MaximizeIcon className="h-4 w-4" />}
                      {isFullScreen ? "Exit Full Screen" : "Full Screen"}
                    </Button>
                    
                    <Button
                      variant={isFullScreen ? "secondary" : "outline"}
                      size="sm"
                      onClick={handlePlayPause}
                      data-testid="button-play-pause"
                    >
                      {isPlaying ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                    </Button>
                    
                    {!isFullScreen && (
                      <div className="text-sm text-gray-500">
                        Slide {currentSlideIndex + 1} of {currentLesson?.slides?.length || 0}
                      </div>
                    )}
                  </div>

                  <Button
                    variant={isFullScreen ? "secondary" : "outline"}
                    onClick={nextSlide}
                    disabled={!canGoNext}
                    data-testid="button-next-slide"
                    className="flex items-center gap-2"
                  >
                    Next
                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <BookOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Content Available</h3>
                <p className="text-gray-600">This lesson doesn't have any slides yet.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};