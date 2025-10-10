import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Youtube, MessageCircle, Send, Sparkles } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { YoutubeAnalysis, YoutubeQuestion } from "@shared/schema";

export default function YoutubeKnowledgePage() {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<number | null>(null);
  const [chatQuestion, setChatQuestion] = useState("");
  const { toast } = useToast();

  // Fetch all analyses
  const { data: analyses = [], isLoading: analysesLoading } = useQuery<YoutubeAnalysis[]>({
    queryKey: ["/api/youtube/analyses"],
  });

  // Fetch questions for selected analysis
  const { data: questions = [], isLoading: questionsLoading } = useQuery<YoutubeQuestion[]>({
    queryKey: [`/api/youtube/questions/${selectedAnalysisId}`],
    enabled: !!selectedAnalysisId,
  });

  // Analyze YouTube video mutation
  const analyzeMutation = useMutation({
    mutationFn: async (url: string) => {
      const res = await apiRequest("POST", "/api/youtube/analyze", { url });
      return await res.json();
    },
    onSuccess: (data: YoutubeAnalysis) => {
      toast({
        title: "Video Analyzed Successfully",
        description: "The video has been processed and added to your knowledge base.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/youtube/analyses"] });
      setSelectedAnalysisId(data.id);
      setYoutubeUrl("");
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze the video. Please check the URL and try again.",
        variant: "destructive",
      });
    },
  });

  // Ask question mutation
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

  const handleAnalyze = () => {
    if (!youtubeUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a YouTube URL to analyze.",
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
    askMutation.mutate({ analysisId: selectedAnalysisId, question: chatQuestion });
  };

  const selectedAnalysis = analyses.find(a => a.id === selectedAnalysisId);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">YouTube Knowledge Base</h1>
        <p className="text-muted-foreground">
          Analyze YouTube videos and ask questions about their content using AI
        </p>
      </div>

      {/* URL Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-500" />
            Add YouTube Video
          </CardTitle>
          <CardDescription>
            Enter a YouTube URL to extract transcript and build knowledge base
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              data-testid="input-youtube-url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              disabled={analyzeMutation.isPending}
            />
            <Button
              data-testid="button-analyze"
              onClick={handleAnalyze}
              disabled={analyzeMutation.isPending}
            >
              {analyzeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analyze
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Knowledge Base</CardTitle>
            <CardDescription>Your analyzed videos</CardDescription>
          </CardHeader>
          <CardContent>
            {analysesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : analyses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No videos analyzed yet
              </p>
            ) : (
              <div className="space-y-2">
                {analyses.map((analysis) => (
                  <button
                    key={analysis.id}
                    data-testid={`button-analysis-${analysis.id}`}
                    onClick={() => setSelectedAnalysisId(analysis.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedAnalysisId === analysis.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "hover:bg-muted border-border"
                    }`}
                  >
                    <div className="font-medium text-sm truncate" data-testid={`text-title-${analysis.id}`}>
                      {analysis.videoTitle}
                    </div>
                    <div className="text-xs opacity-80 truncate mt-1" data-testid={`text-channel-${analysis.id}`}>
                      {analysis.channelName}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Ask Questions
            </CardTitle>
            <CardDescription>
              {selectedAnalysis
                ? `Chat about: ${selectedAnalysis.videoTitle}`
                : "Select a video to start asking questions"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Chat Messages */}
            <div className="border rounded-lg p-4 h-[400px] overflow-y-auto space-y-4">
              {!selectedAnalysisId ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Select a video from your knowledge base to start chatting
                </div>
              ) : questionsLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : questions.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No questions asked yet. Start by asking something about the video!
                </div>
              ) : (
                questions.map((q) => (
                  <div key={q.id} className="space-y-3">
                    {/* User Question */}
                    <div className="flex justify-end">
                      <div
                        data-testid={`message-question-${q.id}`}
                        className="bg-primary text-primary-foreground rounded-lg p-3 max-w-[80%]"
                      >
                        {q.question}
                      </div>
                    </div>
                    {/* AI Answer */}
                    <div className="flex justify-start">
                      <div
                        data-testid={`message-answer-${q.id}`}
                        className="bg-muted rounded-lg p-3 max-w-[80%]"
                      >
                        {q.answer}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <Textarea
                data-testid="input-question"
                placeholder="Ask a question about the video..."
                value={chatQuestion}
                onChange={(e) => setChatQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAskQuestion();
                  }
                }}
                disabled={!selectedAnalysisId || askMutation.isPending}
                className="min-h-[60px]"
              />
              <Button
                data-testid="button-send-question"
                onClick={handleAskQuestion}
                disabled={!selectedAnalysisId || askMutation.isPending}
                size="icon"
                className="h-[60px] w-[60px]"
              >
                {askMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transcript Display */}
      {selectedAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle>Video Transcript</CardTitle>
            <CardDescription>
              {selectedAnalysis.videoTitle} by {selectedAnalysis.channelName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              data-testid="text-transcript"
              className="prose prose-sm max-w-none bg-muted p-4 rounded-lg max-h-[400px] overflow-y-auto whitespace-pre-wrap"
            >
              {selectedAnalysis.transcript}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
