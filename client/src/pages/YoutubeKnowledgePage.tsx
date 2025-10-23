import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Youtube, 
  MessageCircle, 
  Send, 
  Sparkles, 
  Languages,
  Search,
  History,
  Clock,
  ExternalLink,
  Brain,
  BookOpen,
  Zap,
  TrendingUp,
  FileText,
  Edit,
  Eye,
  PlusCircle
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { YoutubeAnalysis, YoutubeQuestion, YoutubeTranslation, YoutubeBlog } from "@shared/schema";

// Enhanced types for chatbot functionality
interface ConversationTurn {
  id: string;
  question: string;
  answer: string;
  citations: Citation[];
  timestamp: string;
  confidence: number;
  analysisId: number;
}

interface Citation {
  chunkId: string;
  text: string;
  startTime?: number;
  endTime?: number;
  relevanceScore: number;
}

// Utility function to generate context insights from transcript
function generateContextFromTranscript(transcript: string, videoTitle: string) {
  const words = transcript.toLowerCase().split(/\s+/);
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  // Extract key topics using simple keyword detection
  const topicKeywords = {
    'technology': ['technology', 'tech', 'digital', 'software', 'hardware', 'innovation'],
    'business': ['business', 'company', 'market', 'revenue', 'strategy', 'growth'],
    'education': ['learn', 'education', 'teach', 'student', 'course', 'training'],
    'ai': ['ai', 'artificial intelligence', 'machine learning', 'neural', 'algorithm'],
    'development': ['development', 'coding', 'programming', 'developer', 'build'],
    'data': ['data', 'analytics', 'database', 'information', 'analysis'],
    'cloud': ['cloud', 'aws', 'azure', 'server', 'infrastructure'],
    'security': ['security', 'privacy', 'encryption', 'protection', 'secure']
  };
  
  const detectedTopics = Object.entries(topicKeywords)
    .filter(([topic, keywords]) => 
      keywords.some(keyword => transcript.toLowerCase().includes(keyword))
    )
    .map(([topic]) => topic)
    .slice(0, 5);
  
  // Generate summary points from first few sentences
  const summaryPoints = sentences.slice(0, 4).map(sentence => 
    sentence.trim().replace(/^[^a-zA-Z]*/, '').substring(0, 100) + (sentence.length > 100 ? '...' : '')
  );
  
  // Extract discussion points by finding sentences with question words or key phrases
  const discussionIndicators = ['what', 'how', 'why', 'when', 'where', 'important', 'key', 'main', 'first', 'second'];
  const discussionPoints = sentences
    .filter(sentence => 
      discussionIndicators.some(indicator => 
        sentence.toLowerCase().includes(indicator)
      )
    )
    .slice(0, 4)
    .map(sentence => sentence.trim().replace(/^[^a-zA-Z]*/, '').substring(0, 120) + '...');
  
  return {
    topics: detectedTopics.length > 0 ? detectedTopics : ['general', 'discussion'],
    summary: summaryPoints.length > 0 ? summaryPoints.join(' ') : `This video titled "${videoTitle}" covers various topics and concepts.`,
    discussionPoints: discussionPoints.length > 0 ? discussionPoints : [
      'Overview of main concepts discussed in the video',
      'Key insights and takeaways from the presentation',
      'Important points highlighted by the speaker',
      'Practical applications and real-world examples'
    ]
  };
}

interface SearchResult {
  chunk: any;
  relevanceScore: number;
  citation: Citation;
}

const SUPPORTED_LANGUAGES = [
  { code: 'hi-IN', name: 'Hindi' },
  { code: 'ta-IN', name: 'Tamil' },
  { code: 'te-IN', name: 'Telugu' },
  { code: 'bn-IN', name: 'Bengali' },
  { code: 'gu-IN', name: 'Gujarati' },
  { code: 'kn-IN', name: 'Kannada' },
  { code: 'ml-IN', name: 'Malayalam' },
  { code: 'mr-IN', name: 'Marathi' },
  { code: 'pa-IN', name: 'Punjabi' },
  { code: 'or-IN', name: 'Odia' },
  { code: 'as-IN', name: 'Assamese' },
  { code: 'ur-IN', name: 'Urdu' },
];

// Blog Generation Component
interface BlogsSectionProps {
  selectedAnalysisId: number | null;
  selectedAnalysis: YoutubeAnalysis | undefined;
  blogs: YoutubeBlog[];
  selectedBlog: YoutubeBlog | null;
  setSelectedBlog: (blog: YoutubeBlog | null) => void;
  isGenerating: boolean;
  blogStyle: string;
  setBlogStyle: (style: string) => void;
  targetAudience: string;
  setTargetAudience: (audience: string) => void;
  generateBlog: () => Promise<void>;
  formatDate: (dateString: Date | null | string) => string;
  getStatusColor: (status: string | null) => string;
}

function BlogsSection({ 
  selectedAnalysisId, 
  selectedAnalysis, 
  blogs, 
  selectedBlog, 
  setSelectedBlog, 
  isGenerating, 
  blogStyle, 
  setBlogStyle, 
  targetAudience, 
  setTargetAudience, 
  generateBlog,
  formatDate,
  getStatusColor
}: BlogsSectionProps) {

  if (!selectedAnalysisId) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Select a video from your knowledge base to manage blogs</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Blog Generation Controls */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <PlusCircle className="h-5 w-5" />
          Generate New Blog
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Blog Style
            </label>
            <Select value={blogStyle} onValueChange={setBlogStyle}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="informative">Informative</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="tutorial">Tutorial</SelectItem>
                <SelectItem value="listicle">Listicle</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Target Audience
            </label>
            <Select value={targetAudience} onValueChange={setTargetAudience}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Audience</SelectItem>
                <SelectItem value="beginner">Beginners</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="expert">Experts</SelectItem>
                <SelectItem value="students">Students</SelectItem>
                <SelectItem value="professionals">Professionals</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button 
              onClick={generateBlog}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Blog
                </>
              )}
            </Button>
          </div>
        </div>
        {selectedAnalysis && (
          <p className="text-sm text-gray-600">
            Creating blog from: <span className="font-medium">{selectedAnalysis.videoTitle}</span>
          </p>
        )}
      </div>

      {/* Blog List and Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Blog List */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generated Blogs ({blogs.length})
          </h3>
          <ScrollArea className="h-[400px] border rounded-lg">
            {blogs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center p-4">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No blogs generated yet</p>
                  <p className="text-sm">Generate your first blog from this video</p>
                </div>
              </div>
            ) : (
              <div className="p-3 space-y-3">
                {blogs.map((blog) => (
                  <Card 
                    key={blog.id} 
                    className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                      selectedBlog?.id === blog.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedBlog(blog)}
                  >
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-sm line-clamp-2">{blog.title}</h4>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getStatusColor(blog.status)}`}
                        >
                          {blog.status || 'draft'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2 mb-2">{blog.excerpt}</p>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {blog.readingTime}min read
                        </span>
                        <span>{formatDate(blog.createdAt)}</span>
                      </div>
                      {blog.tags && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {blog.tags.split(', ').slice(0, 3).map((tag: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs px-1 py-0">
                              {tag.trim()}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Blog Preview */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Blog Preview
          </h3>
          <ScrollArea className="h-[400px] border rounded-lg">
            {selectedBlog ? (
              <div className="p-4">
                <div className="mb-4">
                  <h1 className="text-xl font-bold mb-2">{selectedBlog.title}</h1>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {selectedBlog.readingTime}min read
                    </span>
                    <span>{formatDate(selectedBlog.createdAt)}</span>
                    <Badge className={getStatusColor(selectedBlog.status)}>
                      {selectedBlog.status || 'draft'}
                    </Badge>
                  </div>
                  {selectedBlog.tags && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {selectedBlog.tags.split(', ').map((tag: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {tag.trim()}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-gray-600 italic mb-4">{selectedBlog.excerpt}</p>
                </div>
                <Separator className="mb-4" />
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedBlog.content }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Select a blog to preview</p>
                </div>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

export default function EnhancedYoutubeKnowledgePage() {
  // Enhanced state management
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<number | null>(null);
  const [chatQuestion, setChatQuestion] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<string | undefined>(undefined);
  const [viewingTranslation, setViewingTranslation] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'search' | 'history' | 'blogs'>('chat');
  const [conversationHistory, setConversationHistory] = useState<ConversationTurn[]>([]);
  // Enhanced mode is always enabled
  const useEnhancedMode = true;
  
  // Blog state - moved to main component to persist across tab switches
  const [blogs, setBlogs] = useState<YoutubeBlog[]>([]);
  const [selectedBlog, setSelectedBlog] = useState<YoutubeBlog | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [blogStyle, setBlogStyle] = useState<string>('informative');
  const [targetAudience, setTargetAudience] = useState<string>('general');
  
  // Progress tracking state
  const [progressData, setProgressData] = useState<{
    progress: number;
    stage: string;
    message: string;
    isProcessing: boolean;
  }>({ progress: 0, stage: '', message: '', isProcessing: false });
  
  const { toast } = useToast();

  // Fetch all analyses
  const { data: analyses = [], isLoading: analysesLoading, refetch: refetchAnalyses } = useQuery<YoutubeAnalysis[]>({
    queryKey: ["/api/youtube/analyses"],
  });

  // Fetch questions for selected analysis (legacy mode)
  const { data: questions = [], isLoading: questionsLoading } = useQuery<YoutubeQuestion[]>({
    queryKey: [`/api/youtube/questions/${selectedAnalysisId}`],
    enabled: !!selectedAnalysisId && !useEnhancedMode,
  });

  // Fetch enhanced conversation history
  const { data: enhancedHistory = [] } = useQuery<ConversationTurn[]>({
    queryKey: [`/api/youtube/${selectedAnalysisId}/conversation-history`],
    enabled: !!selectedAnalysisId && useEnhancedMode,
  });

  // Update conversation history when data changes
  useEffect(() => {
    console.log("Enhanced history changed:", enhancedHistory);
    console.log("Use enhanced mode:", useEnhancedMode);
    if (useEnhancedMode && enhancedHistory) {
      console.log("Setting conversation history to:", enhancedHistory);
      setConversationHistory(enhancedHistory);
    }
  }, [enhancedHistory, useEnhancedMode]);

  // Fetch translations for selected analysis
  const { data: translations = [] } = useQuery<YoutubeTranslation[]>({
    queryKey: [`/api/youtube/translations/${selectedAnalysisId}`],
    enabled: !!selectedAnalysisId,
  });

  // Fetch blogs for the selected analysis
  const { data: blogData, refetch: refetchBlogs } = useQuery<YoutubeBlog[]>({
    queryKey: ["/api/youtube/blogs", selectedAnalysisId],
    queryFn: async () => {
      if (!selectedAnalysisId) return [];
      const response = await apiRequest(
        'GET',
        `/api/youtube/blogs?analysisId=${selectedAnalysisId}`
      );
      return response.json();
    },
    enabled: !!selectedAnalysisId && selectedAnalysisId !== null,
  });

  // Update blogs when data changes
  useEffect(() => {
    if (blogData) {
      setBlogs(blogData);
    }
  }, [blogData]);

  // Update blogs when data changes
  useEffect(() => {
    if (blogData) {
      setBlogs(blogData);
    }
  }, [blogData]);

  // Function to track progress via Server-Sent Events
  const trackProgress = (sessionId: string) => {
    const eventSource = new EventSource(`/api/youtube/progress/${sessionId}`);
    
    eventSource.onmessage = (event) => {
      try {
        const progressUpdate = JSON.parse(event.data);
        setProgressData({
          progress: progressUpdate.progress,
          stage: progressUpdate.stage,
          message: progressUpdate.message,
          isProcessing: !progressUpdate.completed && !progressUpdate.error
        });
        
        // Close connection when completed or error
        if (progressUpdate.completed || progressUpdate.error) {
          setTimeout(() => {
            setProgressData({ progress: 0, stage: '', message: '', isProcessing: false });
            eventSource.close();
          }, 2000); // Hide progress after 2 seconds
        }
      } catch (error) {
        console.error('Error parsing progress update:', error);
        setProgressData({ progress: 0, stage: '', message: '', isProcessing: false });
      }
    };

    eventSource.onerror = () => {
      console.log('Progress tracking connection closed or error occurred');
      setProgressData({ progress: 0, stage: '', message: '', isProcessing: false });
      eventSource.close();
    };

    return eventSource;
  };

  // Analyze YouTube video mutation
  const analyzeMutation = useMutation({
    mutationFn: async (url: string) => {
      // Generate session ID for progress tracking
      const sessionId = `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Start progress tracking
      setProgressData({ progress: 0, stage: 'starting', message: 'Initializing...', isProcessing: true });
      const eventSource = trackProgress(sessionId);
      
      try {
        const res = await apiRequest("POST", "/api/youtube/analyze", { url, sessionId });
        const result = await res.json();
        eventSource.close();
        return result;
      } catch (error) {
        eventSource.close();
        setProgressData(prev => ({ ...prev, isProcessing: false }));
        throw error;
      }
    },
    onSuccess: (data: YoutubeAnalysis) => {
      setProgressData({ progress: 100, stage: 'completed', message: 'Analysis completed!', isProcessing: false });
      toast({
        title: "Video Analyzed Successfully",
        description: "The video has been processed and added to your knowledge base.",
      });
      refetchAnalyses();
      setSelectedAnalysisId((data as any).analysisId || data.id);
      setYoutubeUrl("");
    },
    onError: (error: Error) => {
      setProgressData({ progress: 0, stage: 'error', message: 'Analysis failed', isProcessing: false });
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze the video. Please check the URL and try again.",
        variant: "destructive",
      });
    },
  });

  // Enhanced ask question mutation
  const askEnhancedMutation = useMutation({
    mutationFn: async ({ analysisId, question }: { analysisId: number; question: string }) => {
      const res = await apiRequest("POST", `/api/youtube/${analysisId}/ask-enhanced`, { 
        question,
        conversationHistory: conversationHistory.slice(-5) // Send last 5 turns for context
      });
      return await res.json();
    },
    onSuccess: (response) => {
      console.log("askEnhancedMutation onSuccess called", response);
      const conversationTurn = response.data;
      console.log("conversationTurn:", conversationTurn);
      
      // Don't update state optimistically, let the query refetch handle it
      setChatQuestion("");
      
      // Invalidate the query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: [`/api/youtube/${selectedAnalysisId}/conversation-history`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Question Failed",
        description: error.message || "Failed to get an answer. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Legacy ask question mutation
  const askMutation = useMutation({
    mutationFn: async ({ analysisId, question }: { analysisId: number; question: string }) => {
      const res = await apiRequest("POST", "/api/youtube/ask", { analysisId, question });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/youtube/questions/${selectedAnalysisId}`] });
      setChatQuestion("");
    },
    onError: (error: Error) => {
      toast({
        title: "Question Failed",
        description: error.message || "Failed to get an answer. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Semantic search mutation
  const semanticSearchMutation = useMutation({
    mutationFn: async ({ analysisId, query }: { analysisId: number; query: string }) => {
      const res = await apiRequest("POST", `/api/youtube/${analysisId}/semantic-search`, { 
        query, 
        limit: 10 
      });
      return await res.json();
    },
    onError: (error: Error) => {
      toast({
        title: "Search Failed",
        description: error.message || "Failed to search. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Translate mutation
  const translateMutation = useMutation({
    mutationFn: async ({ analysisId, targetLanguageCode, targetLanguageName }: { 
      analysisId: number; 
      targetLanguageCode: string;
      targetLanguageName: string;
    }) => {
      const res = await apiRequest("POST", "/api/youtube/translate", { 
        analysisId, 
        targetLanguageCode,
        targetLanguageName 
      });
      return await res.json();
    },
    onSuccess: (data: YoutubeTranslation) => {
      queryClient.invalidateQueries({ queryKey: [`/api/youtube/translations/${selectedAnalysisId}`] });
      setViewingTranslation(data.languageCode);
      toast({
        title: "Translation Complete",
        description: `Transcript translated to ${data.languageName} successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Translation Failed",
        description: error.message || "Failed to translate. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Blog generation function
  const generateBlog = async () => {
    if (!selectedAnalysisId) {
      toast({
        title: "No Video Selected",
        description: "Please select a video first.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await apiRequest(
        'POST',
        `/api/youtube/${selectedAnalysisId}/generate-blog`,
        {
          blogStyle: blogStyle,
          targetAudience: targetAudience,
        }
      );

      if (response.ok) {
        const result = await response.json();
        const newBlog = result.data;
        setBlogs(prev => [newBlog, ...prev]);
        setSelectedBlog(newBlog);
        toast({
          title: "Blog Generated Successfully",
          description: "Your blog has been created from the video transcript.",
        });
        refetchBlogs();
      } else {
        throw new Error('Failed to generate blog');
      }
    } catch (error) {
      console.error('Error generating blog:', error);
      toast({
        title: "Generation Failed",
        description: "Unable to generate blog. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper functions
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getYouTubeUrl = (videoId: string, startTime?: number) => {
    const selectedAnalysis = analyses.find(a => a.id === selectedAnalysisId);
    if (!selectedAnalysis) return '#';
    
    const baseUrl = `https://www.youtube.com/watch?v=${selectedAnalysis.videoId}`;
    return startTime ? `${baseUrl}&t=${Math.floor(startTime)}s` : baseUrl;
  };

  // Blog helper functions
  const formatDate = (dateString: Date | null | string) => {
    if (!dateString) return 'Unknown date';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'generating': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAnalyze = () => {
    if (!youtubeUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a YouTube URL to analyze.",
        variant: "destructive",
      });
      return;
    }

    if (progressData.isProcessing) {
      toast({
        title: "Processing in Progress",
        description: "Please wait for the current video to finish processing.",
        variant: "destructive",
      });
      return;
    }

    analyzeMutation.mutate(youtubeUrl);
  };

  const handleAskQuestion = () => {
    if (!selectedAnalysisId) {
      toast({
        title: "Select a Video",
        description: "Please select a video from your knowledge base first.",
        variant: "destructive",
      });
      return;
    }
    if (!chatQuestion.trim()) {
      toast({
        title: "Question Required",
        description: "Please enter a question to ask.",
        variant: "destructive",
      });
      return;
    }

    // Always use enhanced mode
    askEnhancedMutation.mutate({ analysisId: selectedAnalysisId, question: chatQuestion });
  };

  const handleSemanticSearch = () => {
    if (!searchQuery.trim() || !selectedAnalysisId) {
      toast({
        title: "Search Required",
        description: "Please enter a search query and select a video.",
        variant: "destructive",
      });
      return;
    }
    semanticSearchMutation.mutate({ analysisId: selectedAnalysisId, query: searchQuery });
  };

  const handleTranslate = () => {
    if (!selectedAnalysisId || !selectedLanguage) {
      toast({
        title: "Missing Information",
        description: "Please select a language to translate to.",
        variant: "destructive",
      });
      return;
    }
    
    const languageName = SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name || selectedLanguage;
    translateMutation.mutate({ 
      analysisId: selectedAnalysisId, 
      targetLanguageCode: selectedLanguage,
      targetLanguageName: languageName
    });
  };

  const selectedAnalysis = analyses.find(a => a.id === selectedAnalysisId);
  const currentTranslation = viewingTranslation 
    ? translations.find(t => t.languageCode === viewingTranslation)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-950 dark:via-blue-950/30 dark:to-purple-950/20">
      <div className="container mx-auto p-6 space-y-8">
        {/* Enhanced Header with Glass Morphism */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-3xl blur-xl"></div>
          <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-3xl p-8 shadow-2xl">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-3">
                <div className="relative">
                  <Brain className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                  <div className="absolute inset-0 bg-blue-600/20 rounded-full blur-lg animate-pulse"></div>
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  AI-Powered YouTube Knowledge Base
                </h1>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-lg max-w-2xl mx-auto">
                Transform YouTube videos into intelligent knowledge with advanced AI analysis, semantic search, and conversational insights
              </p>
              
              {/* Enhanced Mode Indicator */}
              <div className="flex items-center justify-center mt-6">
                <div className="flex items-center gap-2 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm rounded-full px-4 py-2 border border-white/30 dark:border-slate-700/30">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <Badge variant="default" className="font-medium">
                    🚀 Enhanced AI Mode
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* URL Input Section - Modern Glass Card */}
      <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-white/30 dark:border-slate-700/30 shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="relative">
              <Youtube className="h-6 w-6 text-red-500" />
              <div className="absolute inset-0 bg-red-500/20 rounded-full blur-sm animate-pulse"></div>
            </div>
            <span className="bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent font-semibold">
              Add YouTube Video to Knowledge Base
            </span>
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-300">
            {useEnhancedMode 
              ? "🚀 Enhanced AI processing with semantic search, RAG, and conversation memory"
              : "📝 Basic video analysis and Q&A functionality"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Input
                data-testid="input-youtube-url"
                placeholder="https://www.youtube.com/watch?v=... or paste any YouTube URL"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                disabled={analyzeMutation.isPending || progressData.isProcessing}
                className="h-12 pl-12 bg-white/50 dark:bg-slate-800/50 border-white/30 dark:border-slate-700/30 focus:border-blue-400 dark:focus:border-blue-400 rounded-xl text-lg backdrop-blur-sm"
              />
              <Youtube className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
            </div>
            <Button
              data-testid="button-analyze"
              onClick={handleAnalyze}
              disabled={analyzeMutation.isPending || progressData.isProcessing}
              size="lg"
              className="h-12 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {(analyzeMutation.isPending || progressData.isProcessing) ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {progressData.isProcessing && progressData.stage ? 
                    `${progressData.stage}... ${progressData.progress}%` : 
                    'Processing...'
                  }
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-5 w-5" />
                  Analyze Video
                </>
              )}
            </Button>
          </div>

          {/* Progress Bar */}
          {progressData.isProcessing && (
            <div className="space-y-3 p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Youtube className="h-4 w-4 text-red-500" />
                  Processing Video
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-muted-foreground">{progressData.progress}%</span>
                  {progressData.progress > 90 && (
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  )}
                </div>
              </div>
              <Progress 
                value={progressData.progress} 
                className="h-3 bg-white/60 dark:bg-gray-800/60" 
              />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                <span className="capitalize font-medium">{progressData.stage}</span>
                <span>•</span>
                <span>{progressData.message}</span>
                {progressData.progress > 50 && (
                  <>
                    <span>•</span>
                    <span className="text-green-600 dark:text-green-400">Almost done!</span>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content Grid with Enhanced Styling */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Enhanced Knowledge Base */}
        <Card className="lg:col-span-1 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-white/30 dark:border-slate-700/30 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="relative">
                <BookOpen className="h-6 w-6 text-emerald-600" />
                <div className="absolute inset-0 bg-emerald-600/20 rounded-full blur-sm animate-pulse"></div>
              </div>
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent font-semibold">
                Knowledge Base
              </span>
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <span>Your analyzed videos</span>
              <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                {analyses.length}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analysesLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="relative">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <div className="absolute inset-0 bg-blue-600/20 rounded-full blur-sm animate-pulse"></div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">Loading your knowledge base...</p>
              </div>
            ) : analyses.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="relative mx-auto w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-full flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xs mx-auto">
                  No videos analyzed yet. Add a YouTube video above to build your AI-powered knowledge base.
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[450px] pr-4">
                <div className="space-y-3">
                  {analyses.map((analysis) => (
                    <button
                      key={analysis.id}
                      data-testid={`button-analysis-${analysis.id}`}
                      onClick={() => {
                        setSelectedAnalysisId(analysis.id);
                        setConversationHistory([]);
                      }}
                      className={`group w-full text-left p-4 rounded-xl transition-all duration-300 ${
                        selectedAnalysisId === analysis.id
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-[1.02] border-transparent"
                          : "bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-800/80 border-white/30 dark:border-slate-700/30 hover:shadow-lg hover:scale-[1.01]"
                      } backdrop-blur-sm border`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`relative flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
                          selectedAnalysisId === analysis.id 
                            ? "bg-white/20" 
                            : "bg-red-100 dark:bg-red-900/30"
                        }`}>
                          <Youtube className={`h-6 w-6 ${
                            selectedAnalysisId === analysis.id 
                              ? "text-white" 
                              : "text-red-500"
                          }`} />
                          {selectedAnalysisId === analysis.id && (
                            <div className="absolute inset-0 bg-white/30 rounded-lg blur animate-pulse"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-semibold text-sm leading-tight line-clamp-2 mb-1 ${
                            selectedAnalysisId === analysis.id 
                              ? "text-white" 
                              : "text-slate-900 dark:text-slate-100"
                          }`} data-testid={`text-title-${analysis.id}`}>
                            {analysis.videoTitle}
                          </div>
                          <div className={`text-xs truncate mb-2 ${
                            selectedAnalysisId === analysis.id 
                              ? "text-white/80" 
                              : "text-slate-600 dark:text-slate-400"
                          }`} data-testid={`text-channel-${analysis.id}`}>
                            📺 {analysis.channelName}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={selectedAnalysisId === analysis.id ? "secondary" : "default"} 
                                className={`text-xs font-medium ${
                                  selectedAnalysisId === analysis.id 
                                    ? "bg-white/20 text-white border-white/30" 
                                    : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700"
                                }`}
                              >
                                🚀 AI Enhanced
                              </Badge>
                            </div>
                            <div className={`text-xs ${
                              selectedAnalysisId === analysis.id 
                                ? "text-white/70" 
                                : "text-slate-500 dark:text-slate-400"
                            }`}>
                              {new Date(analysis.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Chat Interface */}
        <Card className="lg:col-span-2 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border-white/30 dark:border-slate-700/30 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm border-b border-white/20 dark:border-slate-700/20">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
                  <div className="relative p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg text-white shadow-lg">
                    <MessageCircle className="h-5 w-5" />
                    <div className="absolute inset-0 bg-white/20 rounded-lg blur animate-pulse"></div>
                  </div>
                  💬 AI Assistant
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400 mt-1">
                  {selectedAnalysis
                    ? `Chat about: ${selectedAnalysis.videoTitle}`
                    : "Select a video to start asking questions"}
                </CardDescription>
              </div>
              
              {/* Enhanced Tab Navigation */}
              {selectedAnalysisId && (
                <div className="flex space-x-1 bg-white/30 dark:bg-slate-800/30 p-1 rounded-xl backdrop-blur-sm border border-white/20 dark:border-slate-700/20 shadow-lg">
                  <Button
                    variant={activeTab === 'chat' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('chat')}
                    className={activeTab === 'chat' 
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg border-0" 
                      : "text-slate-700 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50 border-0"
                    }
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Chat
                  </Button>
                  <Button
                    variant={activeTab === 'search' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('search')}
                    className={activeTab === 'search' 
                      ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg border-0" 
                      : "text-slate-700 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50 border-0"
                    }
                  >
                    <Search className="h-4 w-4 mr-1" />
                    Search
                  </Button>
                  <Button
                    variant={activeTab === 'blogs' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('blogs')}
                    className={activeTab === 'blogs' 
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg border-0" 
                      : "text-slate-700 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50 border-0"
                    }
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Blogs
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            {/* Enhanced Chat Display */}
            {activeTab === 'chat' && (
              <>
                <ScrollArea className="border border-white/30 dark:border-slate-700/30 rounded-xl p-4 h-[400px] bg-gradient-to-b from-slate-50/50 to-white/50 dark:from-slate-900/50 dark:to-slate-800/50 backdrop-blur-sm">
                  {!selectedAnalysisId ? (
                    <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
                      <div className="text-center space-y-3">
                        <div className="relative mx-auto w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-full flex items-center justify-center">
                          <MessageCircle className="h-8 w-8 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-medium">Ready to chat!</p>
                          <p className="text-sm">Select a video from your knowledge base to start chatting</p>
                        </div>
                      </div>
                    </div>
                  ) : conversationHistory.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
                      <div className="text-center space-y-3">
                        <div className="relative mx-auto w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center">
                          <Brain className="h-8 w-8 text-blue-500 dark:text-blue-400" />
                          <div className="absolute inset-0 bg-blue-500/20 rounded-full blur animate-pulse"></div>
                        </div>
                        <div>
                          <p className="font-medium">No questions asked yet</p>
                          <p className="text-sm">Start by asking something about the video!</p>
                          <p className="text-xs mt-2 text-slate-400">
                            Debug: Enhanced=true, 
                            History={conversationHistory.length}, 
                            Questions={questions.length}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {conversationHistory.map((item) => {
                        // Debug logging
                        console.log("Rendering Q&A item:", item, "Enhanced mode: true");
                        
                        // Handle enhanced format (always enabled)
                        const isEnhanced = 'citations' in item;
                        const question = (item as ConversationTurn).question;
                        const answer = (item as ConversationTurn).answer;
                        const id = isEnhanced ? (item as ConversationTurn).id : (item as YoutubeQuestion).id.toString();
                        
                        console.log("Rendering conversation item:", item, "id:", id);
                        
                        return (
                          <div key={id} className="space-y-4">
                            {/* User Question */}
                            <div className="flex justify-end">
                              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl rounded-br-md p-4 max-w-[80%] shadow-lg backdrop-blur-sm">
                                <p className="text-sm font-medium">{question}</p>
                              </div>
                            </div>
                            
                            {/* AI Answer */}
                            <div className="flex justify-start">
                              <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/30 dark:border-slate-700/30 rounded-2xl rounded-bl-md p-4 max-w-[80%] shadow-lg">
                                <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">{answer}</p>
                                
                                {/* Enhanced features for new format */}
                                {isEnhanced && (
                                  <div className="mt-3 space-y-3">
                                    <div className="flex items-center gap-2 text-sm">
                                      <Badge 
                                        variant="outline" 
                                        className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700"
                                      >
                                        {Math.round((item as ConversationTurn).confidence)}% confidence
                                      </Badge>
                                      <span className="text-slate-500 dark:text-slate-400">{new Date((item as ConversationTurn).timestamp).toLocaleTimeString()}</span>
                                    </div>
                                    
                                    {/* Citations */}
                                    {(item as ConversationTurn).citations.length > 0 && (
                                      <div className="space-y-2 p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-200/30 dark:border-blue-700/30">
                                        <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1">
                                          <ExternalLink className="h-3 w-3" />
                                          Sources:
                                        </p>
                                        {(item as ConversationTurn).citations.map((citation, idx) => (
                                          <div key={idx} className="flex items-center gap-2 text-xs">
                                            <Clock className="h-3 w-3 text-blue-500" />
                                            {citation.startTime && (
                                              <a
                                                href={getYouTubeUrl(selectedAnalysis?.videoId || '', citation.startTime)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline flex items-center gap-1 font-medium"
                                              >
                                                {formatTime(citation.startTime)} - {formatTime(citation.endTime || citation.startTime + 30)}
                                                <ExternalLink className="h-3 w-3" />
                                              </a>
                                            )}
                                            <Badge 
                                              variant="secondary" 
                                              className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                                            >
                                              {Math.round(citation.relevanceScore * 100)}% match
                                            </Badge>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent my-4"></div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>

                {/* Enhanced Question Input */}
                <div className="space-y-4 p-4 bg-white/30 dark:bg-slate-800/30 rounded-xl border border-white/30 dark:border-slate-700/30 backdrop-blur-sm">
                  <div className="flex gap-3">
                    <Textarea
                      data-testid="input-question"
                      placeholder="💭 Ask a question about the video content... (AI remembers context)"
                      value={chatQuestion}
                      onChange={(e) => setChatQuestion(e.target.value)}
                      onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleAskQuestion();
                      }
                    }}
                    disabled={!selectedAnalysisId || askEnhancedMutation.isPending}
                    className="min-h-[60px] flex-1 bg-white/60 dark:bg-slate-800/60 border-white/30 dark:border-slate-700/30 focus:border-blue-400 dark:focus:border-blue-400 rounded-xl backdrop-blur-sm"
                  />
                  <Button
                    data-testid="button-send-question"
                    onClick={handleAskQuestion}
                    disabled={!selectedAnalysisId || askEnhancedMutation.isPending}
                    size="icon"
                    className="h-[60px] w-[60px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg rounded-xl"
                  >
                    {askEnhancedMutation.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                  </div>
                </div>
              </>
            )}

            {/* Enhanced Semantic Search */}
            {activeTab === 'search' && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search for specific topics or concepts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSemanticSearch();
                      }
                    }}
                  />
                  <Button 
                    onClick={handleSemanticSearch}
                    disabled={semanticSearchMutation.isPending || !searchQuery.trim()}
                  >
                    {semanticSearchMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Search
                  </Button>
                </div>

                {/* Search Results */}
                <ScrollArea className="h-[400px] border rounded-lg p-4">
                  {semanticSearchMutation.data ? (
                    <div className="space-y-4">
                      {semanticSearchMutation.data.data.map((result: SearchResult, idx: number) => (
                        <div key={idx} className="border rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <Badge variant="secondary">
                              Match: {Math.round(result.relevanceScore * 100)}%
                            </Badge>
                            {result.citation.startTime && (
                              <a
                                href={getYouTubeUrl(selectedAnalysis?.videoId || '', result.citation.startTime)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
                              >
                                <Clock className="h-3 w-3" />
                                {formatTime(result.citation.startTime)} - {formatTime(result.citation.endTime || result.citation.startTime + 30)}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                          <p className="text-gray-700">{result.chunk.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Enter a search query to find relevant content</p>
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}

            {/* Blog Generation & Management */}
            {activeTab === 'blogs' && (
              <BlogsSection 
                selectedAnalysisId={selectedAnalysisId}
                selectedAnalysis={selectedAnalysis}
                blogs={blogs}
                selectedBlog={selectedBlog}
                setSelectedBlog={setSelectedBlog}
                isGenerating={isGenerating}
                blogStyle={blogStyle}
                setBlogStyle={setBlogStyle}
                targetAudience={targetAudience}
                setTargetAudience={setTargetAudience}
                generateBlog={generateBlog}
                formatDate={formatDate}
                getStatusColor={getStatusColor}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Transcript Display with Translation */}
      {selectedAnalysis && (
        <Card className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border-white/30 dark:border-slate-700/30 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 backdrop-blur-sm border-b border-white/20 dark:border-slate-700/20">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
                  <div className="relative p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg text-white shadow-lg">
                    {currentTranslation ? (
                      <Languages className="h-5 w-5" />
                    ) : (
                      <FileText className="h-5 w-5" />
                    )}
                    <div className="absolute inset-0 bg-white/20 rounded-lg blur animate-pulse"></div>
                  </div>
                  {currentTranslation ? (
                    <>
                      📝 Translated Transcript ({currentTranslation.languageName})
                    </>
                  ) : (
                    '📝 Video Transcript (English)'
                  )}
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400 mt-1">
                  {selectedAnalysis.videoTitle} by {selectedAnalysis.channelName}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {translations.length > 0 && (
                  <Select value={viewingTranslation || "original"} onValueChange={(value) => setViewingTranslation(value === "original" ? null : value)}>
                    <SelectTrigger className="w-[180px] bg-white/50 dark:bg-slate-800/50 border-white/30 dark:border-slate-700/30 rounded-xl backdrop-blur-sm" data-testid="select-view-translation">
                      <SelectValue placeholder="View Translation" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg border-white/30 dark:border-slate-700/30">
                      <SelectItem value="original">Original (English)</SelectItem>
                      {translations.map(t => (
                        <SelectItem key={t.id} value={t.languageCode}>
                          {t.languageName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div
              data-testid="text-transcript"
              className="prose prose-sm max-w-none bg-gradient-to-br from-slate-50/80 to-white/80 dark:from-slate-900/80 dark:to-slate-800/80 p-6 rounded-xl max-h-[400px] overflow-y-auto whitespace-pre-wrap border border-white/30 dark:border-slate-700/30 backdrop-blur-sm shadow-inner text-slate-800 dark:text-slate-200 leading-relaxed"
            >
              {currentTranslation ? currentTranslation.translatedTranscript : selectedAnalysis.transcript}
            </div>

            {/* Enhanced Translation Controls */}
            <div className="flex items-center gap-3 pt-4 border-t border-white/20 dark:border-slate-700/20">
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="w-[220px] bg-white/50 dark:bg-slate-800/50 border-white/30 dark:border-slate-700/30 rounded-xl backdrop-blur-sm" data-testid="select-language">
                  <SelectValue placeholder="🌍 Select language to translate" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg border-white/30 dark:border-slate-700/30">
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <SelectItem key={lang.code} value={lang.code} className="hover:bg-blue-50 dark:hover:bg-blue-900/30">
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                data-testid="button-translate"
                onClick={handleTranslate}
                disabled={!selectedLanguage || translateMutation.isPending}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg rounded-xl px-6"
              >
                {translateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Translating...
                  </>
                ) : (
                  <>
                    <Languages className="h-4 w-4 mr-2" />
                    {selectedLanguage 
                      ? `Translate to ${SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name}`
                      : 'Translate'
                    }
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Context and Analysis Section */}
      {selectedAnalysis && (() => {
        const context = generateContextFromTranscript(selectedAnalysis.transcript, selectedAnalysis.videoTitle);
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Video Context & Analysis
              </CardTitle>
              <CardDescription>
                AI-powered insights and contextual understanding of "{selectedAnalysis.videoTitle}"
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Key Topics Section */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Key Topics Discussed
                </h4>
                <div className="flex flex-wrap gap-2">
                  {context.topics.map((topic, index) => (
                    <Badge key={index} variant="secondary" className="capitalize">
                      {topic.replace(/[_-]/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Context Summary */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Content Overview
                </h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900 leading-relaxed">
                    {context.summary}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Discussion Points */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Main Discussion Points
                </h4>
                <div className="space-y-2">
                  {context.discussionPoints.map((point, index) => {
                    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500'];
                    return (
                      <div key={index} className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full ${colors[index % colors.length]} mt-2 flex-shrink-0`}></div>
                        <p className="text-sm text-gray-700">{point}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* Video Metadata */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Video Information
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h5 className="font-medium text-sm text-gray-800">Channel</h5>
                    <p className="text-xs text-gray-600 mt-1">{selectedAnalysis.channelName}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h5 className="font-medium text-sm text-gray-800">Video ID</h5>
                    <p className="text-xs text-gray-600 mt-1 font-mono">{selectedAnalysis.videoId}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h5 className="font-medium text-sm text-gray-800">Transcript Length</h5>
                    <p className="text-xs text-gray-600 mt-1">{selectedAnalysis.transcript.length.toLocaleString()} characters</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h5 className="font-medium text-sm text-gray-800">Word Count</h5>
                    <p className="text-xs text-gray-600 mt-1">~{selectedAnalysis.transcript.split(/\s+/).length.toLocaleString()} words</p>
                  </div>
                </div>
              </div>

              {/* Context Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-2"
                  onClick={() => window.open(selectedAnalysis.videoUrl, '_blank')}
                >
                  <ExternalLink className="h-3 w-3" />
                  Watch Video
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-2"
                  onClick={() => {
                    const summary = `Video: ${selectedAnalysis.videoTitle}\nChannel: ${selectedAnalysis.channelName}\nTopics: ${context.topics.join(', ')}\n\nSummary: ${context.summary}`;
                    navigator.clipboard.writeText(summary);
                    toast({ title: "Summary copied to clipboard!" });
                  }}
                >
                  <BookOpen className="h-3 w-3" />
                  Copy Summary
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })()}
      </div>
    </div>
  );
}