import { YoutubeTranscript } from 'youtube-transcript';
import { generateEmbedding, chunkText, cosineSimilarity, generateChatCompletion } from './openai';

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
  }>;
}

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

export async function getYouTubeTranscript(videoId: string): Promise<string> {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    return transcript.map(item => item.text).join(' ');
  } catch (error) {
    throw new Error(`Failed to fetch YouTube transcript: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function analyzeYouTubeVideo(
  url: string,
  storage: any,
  userId: number
): Promise<YouTubeAnalysisResult> {
  const videoId = await extractYouTubeVideoId(url);
  
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }

  const transcript = await getYouTubeTranscript(videoId);
  
  if (!transcript || transcript.trim().length === 0) {
    throw new Error('No transcript available for this video');
  }

  const videoTitle = `YouTube Video ${videoId}`;
  const channelName = "YouTube Channel";
  
  const analysis = await storage.createYoutubeAnalysis({
    videoId,
    videoTitle,
    channelName,
    videoUrl: url,
    transcript,
  }, userId);

  const textChunks = chunkText(transcript, 500, 50);
  
  const chunksWithEmbeddings = await Promise.all(
    textChunks.map(async (chunk, index) => {
      const embedding = await generateEmbedding(chunk);
      
      const savedChunk = await storage.createYoutubeChunk({
        analysisId: analysis.id,
        chunkIndex: index,
        content: chunk,
        embedding: JSON.stringify(embedding),
      });
      
      return {
        ...savedChunk,
        embedding,
      };
    })
  );

  return {
    analysisId: analysis.id,
    videoId,
    videoTitle,
    channelName,
    videoUrl: url,
    transcript,
    chunks: chunksWithEmbeddings,
  };
}

export async function answerQuestion(
  analysisId: number,
  question: string,
  storage: any
): Promise<{ question: string; answer: string }> {
  const chunks = await storage.getYoutubeChunks(analysisId);
  
  if (!chunks || chunks.length === 0) {
    throw new Error('No content found for this analysis');
  }

  const questionEmbedding = await generateEmbedding(question);
  
  const chunksWithSimilarity = chunks.map((chunk: any) => ({
    ...chunk,
    embedding: JSON.parse(chunk.embedding),
    similarity: cosineSimilarity(questionEmbedding, JSON.parse(chunk.embedding)),
  }));

  chunksWithSimilarity.sort((a: any, b: any) => b.similarity - a.similarity);
  
  const topChunks = chunksWithSimilarity.slice(0, 5).filter((c: any) => c.similarity > 0.7);

  if (topChunks.length === 0) {
    return {
      question,
      answer: "I couldn't find relevant information in the video transcript to answer your question. Please try rephrasing or ask about a different topic from the video."
    };
  }

  const context = topChunks.map((c: any) => c.content).join('\n\n');

  const messages = [
    {
      role: "system" as const,
      content: "You are a helpful assistant that answers questions based on YouTube video transcripts. Provide accurate, concise answers based only on the context provided. If the context doesn't contain enough information, say so."
    },
    {
      role: "user" as const,
      content: `Based on the following video transcript excerpts, please answer this question:\n\nQuestion: ${question}\n\nTranscript Context:\n${context}\n\nAnswer:`
    }
  ];

  const answer = await generateChatCompletion(messages);

  await storage.createYoutubeQuestion({
    analysisId,
    question,
    answer,
  });

  return { question, answer };
}
