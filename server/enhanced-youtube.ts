import "dotenv/config";// Enhanced YouTube Processor for LMS Integration
// This extends the existing server/youtube.ts with chatbot functionality

import { createReadStream } from 'fs';
import { unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import OpenAI from 'openai';
import { YoutubeTranscript } from 'youtube-transcript';
import { generateEmbedding, chunkText, cosineSimilarity, generateChatCompletion } from './openai';
import { storage } from './storage';

const execAsync = promisify(exec);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Enhanced interfaces that extend existing LMS types
export interface YouTubeAnalysisResult {
  analysisId: number;
  videoId: string;
  videoTitle: string;
  channelName: string;
  videoUrl: string;
  transcript: string;
  chunks: Array<{
    id: number;
    chunkIndex: number;
    content: string;
    embedding: number[];
    startTime?: number;
    endTime?: number;
    keywords?: string[];
  }>;
  // Enhanced chatbot fields
  knowledgeBaseData?: {
    totalChunks: number;
    processingTime: number;
    embeddingModel: string;
    confidence: number;
  };
}

export interface ConversationTurn {
  id: string;
  question: string;
  answer: string;
  citations: Citation[];
  timestamp: Date;
  confidence: number;
  analysisId: number;
}

export interface Citation {
  chunkId: string;
  text: string;
  startTime?: number;
  endTime?: number;
  relevanceScore: number;
}

export interface SearchResult {
  chunk: any;
  relevanceScore: number;
  citation: Citation;
}

// Keep existing function for backward compatibility
export async function extractYouTubeVideoId(url: string): Promise<string | null> {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

// Enhanced metadata extraction
async function getVideoMetadata(videoId: string): Promise<{ title: string; channelName: string }> {
  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const response = await fetch(url);
    const html = await response.text();
    
    // Extract title from meta tags or page title
    let title = 'YouTube Video';
    const titleMatch = html.match(/<meta name="title" content="([^"]+)"/) || 
                      html.match(/<title>([^<]+)<\/title>/);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].replace(' - YouTube', '').trim();
    }
    
    // Extract channel name from meta tags
    let channelName = 'YouTube Channel';
    const channelMatch = html.match(/<link itemprop="name" content="([^"]+)">/) ||
                        html.match(/"author":"([^"]+)"/);
    if (channelMatch && channelMatch[1]) {
      channelName = channelMatch[1].trim();
    }
    
    console.log(`Extracted metadata - Title: ${title}, Channel: ${channelName}`);
    return { title, channelName };
  } catch (error) {
    console.error('Failed to fetch video metadata:', error);
    return { title: `YouTube Video ${videoId}`, channelName: 'YouTube Channel' };
  }
}

// Enhanced transcript extraction with timestamps
async function getTranscriptWithTimestamps(videoId: string): Promise<Array<{text: string, start: number, duration: number}>> {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    return transcript.map(item => ({
      text: item.text,
      start: item.offset / 1000, // Convert to seconds
      duration: item.duration / 1000 // Convert to seconds
    }));
  } catch (error) {
    console.error('Failed to get transcript with timestamps:', error);
    // Fallback to basic transcript without timestamps
    try {
      const basicTranscript = await YoutubeTranscript.fetchTranscript(videoId);
      return basicTranscript.map((item, index) => ({
        text: item.text,
        start: index * 5, // Estimate 5 seconds per segment
        duration: 5
      }));
    } catch (fallbackError) {
      throw new Error('Failed to extract transcript from video');
    }
  }
}

// Enhanced chunking with timestamp preservation
function createEnhancedChunks(transcript: Array<{text: string, start: number, duration: number}>, chunkSize: number = 1000): Array<{
  content: string;
  startTime: number;
  endTime: number;
  keywords: string[];
}> {
  const chunks = [];
  let currentChunk = '';
  let currentStartTime = 0;
  let chunkStartTime = 0;

  for (let i = 0; i < transcript.length; i++) {
    const item = transcript[i];
    
    if (currentChunk.length === 0) {
      chunkStartTime = item.start;
    }
    
    currentChunk += item.text + ' ';
    
    if (currentChunk.length >= chunkSize || i === transcript.length - 1) {
      const keywords = extractKeywords(currentChunk);
      chunks.push({
        content: currentChunk.trim(),
        startTime: chunkStartTime,
        endTime: item.start + item.duration,
        keywords
      });
      
      // Handle overlap for better context
      if (currentChunk.length > 200) {
        const overlapText = currentChunk.slice(-200);
        currentChunk = overlapText;
        currentStartTime = item.start;
      } else {
        currentChunk = '';
      }
    }
  }

  return chunks;
}

// Extract keywords from text
function extractKeywords(text: string): string[] {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !['this', 'that', 'with', 'have', 'will', 'from', 'they', 'been', 'said', 'each', 'which', 'their'].includes(word));
  
  // Return top 5 most frequent words
  const wordCount = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
}

// Enhanced analysis function that maintains compatibility
export async function analyzeYouTubeVideo(url: string, userId?: number): Promise<YouTubeAnalysisResult> {
  const startTime = Date.now();
  
  const videoId = await extractYouTubeVideoId(url);
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }

  try {
    // Get video metadata
    const { title, channelName } = await getVideoMetadata(videoId);
    
    // Get transcript with timestamps
    const transcriptWithTimestamps = await getTranscriptWithTimestamps(videoId);
    const fullTranscript = transcriptWithTimestamps.map(item => item.text).join(' ');
    
    // Create enhanced chunks with timestamps
    const enhancedChunks = createEnhancedChunks(transcriptWithTimestamps);
    
    // Generate embeddings for chunks
    const chunksWithEmbeddings = [];
    for (let i = 0; i < enhancedChunks.length; i++) {
      const chunk = enhancedChunks[i];
      try {
        const embedding = await generateEmbedding(chunk.content);
        chunksWithEmbeddings.push({
          id: i + 1,
          chunkIndex: i,
          content: chunk.content,
          embedding,
          startTime: chunk.startTime,
          endTime: chunk.endTime,
          keywords: chunk.keywords
        });
      } catch (error) {
        console.error(`Failed to generate embedding for chunk ${i}:`, error);
        // Add chunk without embedding to maintain structure
        chunksWithEmbeddings.push({
          id: i + 1,
          chunkIndex: i,
          content: chunk.content,
          embedding: [],
          startTime: chunk.startTime,
          endTime: chunk.endTime,
          keywords: chunk.keywords
        });
      }
    }

    const processingTime = Date.now() - startTime;
    
    // Create analysis result
    const result: YouTubeAnalysisResult = {
      analysisId: 0, // Will be set by database
      videoId,
      videoTitle: title,
      channelName,
      videoUrl: url,
      transcript: fullTranscript,
      chunks: chunksWithEmbeddings,
      knowledgeBaseData: {
        totalChunks: chunksWithEmbeddings.length,
        processingTime,
        embeddingModel: 'text-embedding-3-small',
        confidence: 0.95
      }
    };

    console.log(`Video analysis completed in ${processingTime}ms with ${chunksWithEmbeddings.length} chunks`);
    return result;
  } catch (error) {
    console.error('Error analyzing YouTube video:', error);
    throw error;
  }
}

// Enhanced question answering with citations
export async function answerQuestionWithContext(
  analysisId: number,
  question: string,
  conversationHistory: any[] = []
): Promise<ConversationTurn> {
  try {
    // Get analysis data from database
    const analysis = await storage.getYoutubeAnalysis(analysisId);
    if (!analysis) {
      throw new Error('Analysis not found');
    }

    // Get chunks for this analysis
    const chunks = await storage.getYoutubeChunks(analysisId);
    
    // Generate embedding for the question
    const questionEmbedding = await generateEmbedding(question);
    
    // Find most relevant chunks using cosine similarity
    const similarities = chunks
      .filter((chunk: any) => chunk.embedding && chunk.embedding.length > 0)
      .map((chunk: any) => {
        try {
          // Parse embedding from JSON string if needed
          const embedding = typeof chunk.embedding === 'string' 
            ? JSON.parse(chunk.embedding) 
            : chunk.embedding;
            
          return {
            ...chunk,
            embedding,
            similarity: cosineSimilarity(questionEmbedding, embedding)
          };
        } catch (error) {
          console.warn(`Failed to parse embedding for chunk ${chunk.id}:`, error);
          return null;
        }
      })
      .filter((chunk: any) => chunk !== null && chunk.similarity >= 0.5) // Lowered threshold for better recall
      .sort((a: any, b: any) => b.similarity - a.similarity)
      .slice(0, 5); // Top 5 most relevant chunks

    // Build context from relevant chunks
    let context = 'Relevant information from the video:\n\n';
    const citations: Citation[] = [];
    
    similarities.forEach((chunk: any, index: number) => {
      const timeInfo = chunk.startTime ? ` (${formatTime(chunk.startTime)} - ${formatTime(chunk.endTime)})` : '';
      context += `[${index + 1}]${timeInfo}: ${chunk.content}\n\n`;
      
      citations.push({
        chunkId: chunk.id.toString(),
        text: chunk.content.substring(0, 150) + '...',
        startTime: chunk.startTime,
        endTime: chunk.endTime,
        relevanceScore: chunk.similarity
      });
    });

    // Add conversation history for context
    if (conversationHistory.length > 0) {
      context += '\nPrevious conversation:\n';
      conversationHistory.slice(-3).forEach(turn => {
        context += `Q: ${turn.question}\nA: ${turn.answer}\n\n`;
      });
    }

    // Check if we have relevant context
    if (similarities.length === 0) {
      return {
        id: `turn_${Date.now()}`,
        question,
        answer: "I couldn't find relevant information in the video transcript to answer your question. The content might not cover this topic, or you might want to try rephrasing your question.",
        citations: [],
        timestamp: new Date(),
        confidence: 0,
        analysisId
      };
    }

    // Generate answer using OpenAI
    const systemPrompt = `You are an AI assistant that answers questions based on YouTube video transcripts. 
    Use the provided context to answer the user's question accurately and helpfully.
    Always reference specific sections when possible and include timestamp information.
    If the answer isn't clearly available in the context, say so clearly.
    Be conversational but informative. Cite relevant timestamps when available.`;

    const answer = await generateChatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Context: ${context}\n\nQuestion: ${question}` }
    ]);

    // Calculate confidence based on similarity scores and number of relevant chunks
    const avgSimilarity = similarities.reduce((sum: number, chunk: any) => sum + chunk.similarity, 0) / similarities.length;
    const chunkBonus = Math.min(similarities.length / 5, 1) * 0.1; // Bonus for having multiple relevant chunks
    const confidence = Math.min((avgSimilarity + chunkBonus) * 100, 95);

    const conversationTurn: ConversationTurn = {
      id: `turn_${Date.now()}`,
      question,
      answer,
      citations,
      timestamp: new Date(),
      confidence,
      analysisId
    };

    return conversationTurn;
  } catch (error) {
    console.error('Error answering question:', error);
    throw new Error(`Failed to answer question: ${(error as Error).message}`);
  }
}

// Semantic search across video content
export async function performSemanticSearch(
  analysisId: number,
  query: string,
  limit: number = 10
): Promise<SearchResult[]> {
  try {
    // Get chunks for this analysis
    const chunks = await storage.getYoutubeChunks(analysisId);
    
    if (chunks.length === 0) {
      return [];
    }

    // Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(query);
    
    // Calculate similarities and sort
    const searchResults = chunks
      .filter((chunk: any) => chunk.embedding)
      .map((chunk: any) => {
        try {
          // Parse embedding from JSON string if needed
          const embedding = typeof chunk.embedding === 'string' 
            ? JSON.parse(chunk.embedding) 
            : chunk.embedding;
            
          if (!Array.isArray(embedding) || embedding.length === 0) {
            return null;
          }
          
          const relevanceScore = cosineSimilarity(queryEmbedding, embedding);
          
          return {
            chunk: {
              ...chunk,
              embedding // Include parsed embedding
            },
            relevanceScore,
            citation: {
              chunkId: chunk.id.toString(),
              text: chunk.content.substring(0, 200) + '...',
              startTime: chunk.startTime,
              endTime: chunk.endTime,
              relevanceScore
            }
          };
        } catch (error) {
          console.warn(`Failed to process chunk ${chunk.id} for search:`, error);
          return null;
        }
      })
      .filter((result: any) => result !== null && result.relevanceScore >= 0.3) // Lower threshold for search
      .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit) as SearchResult[];

    return searchResults;
  } catch (error) {
    console.error('Error performing semantic search:', error);
    throw new Error(`Search failed: ${(error as Error).message}`);
  }
}

// Utility function to format time
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Keep existing downloadYouTubeAudio function for compatibility
async function downloadYouTubeAudio(videoId: string): Promise<string> {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const audioPath = join(tmpdir(), `youtube-${videoId}-${Date.now()}.mp3`);
  
  try {
    console.log(`Downloading audio for video: ${videoId}`);
    
    // Use yt-dlp to download audio (most reliable method)
    const command = `yt-dlp -x --audio-format mp3 --audio-quality 5 --no-progress -o "${audioPath}" "${videoUrl}"`;
    
    await execAsync(command, {
      maxBuffer: 100 * 1024 * 1024, // 100MB buffer for large videos
    });
    
    console.log(`Audio downloaded to: ${audioPath}`);
    return audioPath;
  } catch (error) {
    // Clean up on error
    try {
      await unlink(audioPath);
    } catch (cleanupError) {
      // Ignore if file doesn't exist
      if ((cleanupError as any).code !== 'ENOENT') {
        console.error('Error cleaning up audio file:', cleanupError);
      }
    }
    
    console.error('Error downloading YouTube audio:', error);
    throw new Error(`Failed to download audio: ${(error as Error).message}`);
  }
}

// Export functions for backward compatibility and new features

// YouTube processor object for easy access
export const enhancedYoutubeProcessor = {
  analyzeYouTubeVideo,
  answerQuestionWithContext,
  performSemanticSearch,
  extractYouTubeVideoId
};
export {
  downloadYouTubeAudio,
  getVideoMetadata,
  getTranscriptWithTimestamps,
  createEnhancedChunks,
  extractKeywords,
  formatTime
};