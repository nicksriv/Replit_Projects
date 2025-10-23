// Enhanced YouTube Knowledge Page Component for LMS Integration
// This replaces/enhances the existing client/src/pages/YoutubeKnowledgePage.tsx

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Zap
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";

// Enhanced types for the chatbot functionality
interface EnhancedYoutubeAnalysis {
  id: number;
  videoId: string;
  videoTitle: string;
  channelName: string;
  transcript: string;
  knowledgeBaseData: {
    chunks: TranscriptChunk[];
    embeddings: number[][];
    processingMetadata: ProcessingMetadata;
  };
  processingStatus: 'pending' | 'processing' | 'completed' | 'error';
  embeddingModel: string;
  createdAt: string;
  updatedAt: string;
}

interface TranscriptChunk {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  keywords: string[];
}

interface ConversationTurn {
  id: string;
  question: string;
  answer: string;
  citations: Citation[];
  timestamp: string;
  confidence: number;
}

interface Citation {
  chunkId: string;
  text: string;
  startTime: number;
  endTime: number;
  relevanceScore: number;
}

interface SearchResult {
  chunk: TranscriptChunk;
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

export default function EnhancedYoutubeKnowledgePage() {
  // State management
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<number | null>(null);
  const [chatQuestion, setChatQuestion] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [activeTab, setActiveTab] = useState<'chat' | 'search' | 'history'>('chat');
  const [conversationHistory, setConversationHistory] = useState<ConversationTurn[]>([]);
  
  const { toast } = useToast();

  // Fetch all analyses
  const { data: analyses = [], isLoading: analysesLoading, refetch: refetchAnalyses } = useQuery<EnhancedYoutubeAnalysis[]>({
    queryKey: ["/api/youtube/analyses"],
  });

  // Fetch conversation history for selected analysis
  const { data: history = [] } = useQuery<ConversationTurn[]>({
    queryKey: [`/api/youtube/conversation-history/${selectedAnalysisId}`],
    enabled: !!selectedAnalysisId,
  });

  // Process video mutation
  const processVideoMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await apiRequest("/api/youtube/analyze", {
        method: "POST",
        body: JSON.stringify({ url }),
        headers: { "Content-Type": "application/json" },
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Video processed successfully and added to knowledge base!",
      });
      setYoutubeUrl("");
      refetchAnalyses();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process video",
        variant: "destructive",
      });
    },
  });

  // Ask question mutation
  const askQuestionMutation = useMutation({
    mutationFn: async ({ question, analysisId }: { question: string; analysisId: number }) => {
      const response = await apiRequest(`/api/youtube/${analysisId}/ask-enhanced`, {
        method: "POST",
        body: JSON.stringify({ 
          question, 
          conversationHistory 
        }),
        headers: { "Content-Type": "application/json" },
      });
      return response;
    },
    onSuccess: (data: ConversationTurn) => {
      setConversationHistory(prev => [...prev, data]);
      setChatQuestion("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to get answer",
        variant: "destructive",
      });
    },
  });

  // Semantic search mutation
  const semanticSearchMutation = useMutation({
    mutationFn: async ({ query, analysisId }: { query: string; analysisId: number }) => {
      const response = await apiRequest(`/api/youtube/${analysisId}/semantic-search`, {
        method: "POST",
        body: JSON.stringify({ query, limit: 10 }),
        headers: { "Content-Type": "application/json" },
      });
      return response;
    },
  });

  // Update conversation history when analysis changes
  useEffect(() => {
    if (history) {
      setConversationHistory(history);
    }
  }, [history]);

  // Helper functions
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleProcessVideo = () => {
    if (!youtubeUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a YouTube URL",
        variant: "destructive",
      });
      return;
    }
    processVideoMutation.mutate(youtubeUrl);
  };

  const handleAskQuestion = () => {
    if (!chatQuestion.trim() || !selectedAnalysisId) {
      toast({
        title: "Error",
        description: "Please select a video and enter a question",
        variant: "destructive",
      });
      return;
    }
    askQuestionMutation.mutate({ 
      question: chatQuestion, 
      analysisId: selectedAnalysisId 
    });
  };

  const handleSemanticSearch = () => {
    if (!searchQuery.trim() || !selectedAnalysisId) {
      toast({
        title: "Error",
        description: "Please select a video and enter a search query",
        variant: "destructive",
      });
      return;
    }
    semanticSearchMutation.mutate({ 
      query: searchQuery, 
      analysisId: selectedAnalysisId 
    });
  };

  const getYouTubeUrl = (videoId: string, startTime?: number) => {
    const baseUrl = `https://www.youtube.com/watch?v=${videoId}`;
    return startTime ? `${baseUrl}&t=${Math.floor(startTime)}s` : baseUrl;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Brain className="h-8 w-8 text-blue-600" />
          AI-Powered YouTube Knowledge Base
        </h1>
        <p className="text-gray-600">
          Process YouTube videos and chat with their content using advanced AI
        </p>
      </div>

      {/* Video Processing Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-600" />
            Add New Video to Knowledge Base
          </CardTitle>
          <CardDescription>
            Enter a YouTube URL to process and add to your intelligent knowledge base
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              disabled={processVideoMutation.isPending}
            />
            <Button 
              onClick={handleProcessVideo}
              disabled={processVideoMutation.isPending}
            >
              {processVideoMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              Process Video
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Video Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-green-600" />
            Select Video from Knowledge Base
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analysesLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading videos...</span>
            </div>
          ) : analyses.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No videos processed yet. Add a YouTube video above to get started.
            </p>
          ) : (
            <Select
              value={selectedAnalysisId?.toString() || ""}
              onValueChange={(value) => setSelectedAnalysisId(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a video to interact with..." />
              </SelectTrigger>
              <SelectContent>
                {analyses.map((analysis) => (
                  <SelectItem key={analysis.id} value={analysis.id.toString()}>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <span className="font-medium">{analysis.videoTitle}</span>
                        <span className="text-sm text-gray-500">{analysis.channelName}</span>
                      </div>
                      <Badge variant={analysis.processingStatus === 'completed' ? 'default' : 'secondary'}>
                        {analysis.processingStatus}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* Main Interaction Area */}
      {selectedAnalysisId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Chat Interface */}
          <div className="lg:col-span-2 space-y-4">
            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <Button
                variant={activeTab === 'chat' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('chat')}
                className="flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                Chat
              </Button>
              <Button
                variant={activeTab === 'search' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('search')}
                className="flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                Search
              </Button>
              <Button
                variant={activeTab === 'history' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('history')}
                className="flex items-center gap-2"
              >
                <History className="h-4 w-4" />
                History
              </Button>
            </div>

            {/* Chat Tab */}
            {activeTab === 'chat' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    AI Chat Assistant
                  </CardTitle>
                  <CardDescription>
                    Ask questions about the video content and get intelligent answers with citations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Conversation Display */}
                  <ScrollArea className="h-96 border rounded-lg p-4">
                    {conversationHistory.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Start a conversation by asking a question about the video!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {conversationHistory.map((turn) => (
                          <div key={turn.id} className="space-y-2">
                            {/* Question */}
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <p className="font-medium text-blue-900">Q: {turn.question}</p>
                            </div>
                            
                            {/* Answer */}
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-gray-900">{turn.answer}</p>
                              <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                                <Badge variant="outline">
                                  {Math.round(turn.confidence)}% confidence
                                </Badge>
                                <span>{new Date(turn.timestamp).toLocaleTimeString()}</span>
                              </div>
                            </div>

                            {/* Citations */}
                            {turn.citations.length > 0 && (
                              <div className="ml-4 space-y-1">
                                <p className="text-sm font-medium text-gray-600">Sources:</p>
                                {turn.citations.map((citation, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-sm">
                                    <Clock className="h-3 w-3" />
                                    <a
                                      href={getYouTubeUrl(
                                        analyses.find(a => a.id === selectedAnalysisId)?.videoId || '',
                                        citation.startTime
                                      )}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline flex items-center gap-1"
                                    >
                                      {formatTime(citation.startTime)} - {formatTime(citation.endTime)}
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                    <Badge variant="secondary" className="text-xs">
                                      {Math.round(citation.relevanceScore * 100)}% match
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            <Separator />
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>

                  {/* Question Input */}
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Ask a question about the video content..."
                      value={chatQuestion}
                      onChange={(e) => setChatQuestion(e.target.value)}
                      className="flex-1"
                      rows={2}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAskQuestion();
                        }
                      }}
                    />
                    <Button 
                      onClick={handleAskQuestion}
                      disabled={askQuestionMutation.isPending || !chatQuestion.trim()}
                      size="lg"
                    >
                      {askQuestionMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Search Tab */}
            {activeTab === 'search' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Semantic Search
                  </CardTitle>
                  <CardDescription>
                    Search through the video content using natural language
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                  {semanticSearchMutation.data && (
                    <ScrollArea className="h-96 border rounded-lg p-4">
                      <div className="space-y-4">
                        {semanticSearchMutation.data.map((result: SearchResult, idx: number) => (
                          <div key={idx} className="border rounded-lg p-3">
                            <div className="flex justify-between items-start mb-2">
                              <Badge variant="secondary">
                                Match: {Math.round(result.relevanceScore * 100)}%
                              </Badge>
                              <a
                                href={getYouTubeUrl(
                                  analyses.find(a => a.id === selectedAnalysisId)?.videoId || '',
                                  result.chunk.startTime
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
                              >
                                <Clock className="h-3 w-3" />
                                {formatTime(result.chunk.startTime)} - {formatTime(result.chunk.endTime)}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                            <p className="text-gray-700">{result.chunk.text}</p>
                            {result.chunk.keywords.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {result.chunk.keywords.map((keyword, kidx) => (
                                  <Badge key={kidx} variant="outline" className="text-xs">
                                    {keyword}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Video Info & Stats */}
          <div className="space-y-4">
            {/* Video Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Video Information</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const selectedAnalysis = analyses.find(a => a.id === selectedAnalysisId);
                  return selectedAnalysis ? (
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium text-sm text-gray-600">Title</p>
                        <p className="font-semibold">{selectedAnalysis.videoTitle}</p>
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-600">Channel</p>
                        <p>{selectedAnalysis.channelName}</p>
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-600">Status</p>
                        <Badge variant={selectedAnalysis.processingStatus === 'completed' ? 'default' : 'secondary'}>
                          {selectedAnalysis.processingStatus}
                        </Badge>
                      </div>
                      {selectedAnalysis.knowledgeBaseData && (
                        <div>
                          <p className="font-medium text-sm text-gray-600">Knowledge Base</p>
                          <p className="text-sm">{selectedAnalysis.knowledgeBaseData.chunks.length} text chunks</p>
                          <p className="text-sm">{selectedAnalysis.knowledgeBaseData.processingMetadata.totalChunks} total segments</p>
                        </div>
                      )}
                      <div>
                        <a
                          href={getYouTubeUrl(selectedAnalysis.videoId)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
                        >
                          Watch on YouTube
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  ) : null;
                })()}
              </CardContent>
            </Card>

            {/* Language Translation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Languages className="h-5 w-5" />
                  Translation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language for translation" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button className="w-full mt-2" variant="outline" disabled>
                  Translate Content
                  <Sparkles className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}