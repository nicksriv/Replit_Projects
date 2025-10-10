import { YoutubeTranscript } from 'youtube-transcript';
import ytdl from '@distube/ytdl-core';
import { createWriteStream, createReadStream } from 'fs';
import { unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import OpenAI from 'openai';
import { generateEmbedding, chunkText, cosineSimilarity, generateChatCompletion } from './openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

async function downloadYouTubeAudio(videoId: string): Promise<string> {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const audioPath = join(tmpdir(), `youtube-${videoId}-${Date.now()}.mp3`);
  
  return new Promise((resolve, reject) => {
    let writeStream: ReturnType<typeof createWriteStream> | null = null;
    
    const cleanupOnError = async (error: Error) => {
      try {
        if (writeStream) {
          writeStream.destroy();
        }
        await unlink(audioPath);
        console.log(`Cleaned up temp file after error: ${audioPath}`);
      } catch (cleanupError) {
        // Ignore ENOENT errors (file never created), log others
        if ((cleanupError as any).code !== 'ENOENT') {
          console.error('Failed to cleanup temp file:', cleanupError);
        }
      }
      reject(error);
    };
    
    try {
      console.log(`Downloading audio for video: ${videoId}`);
      
      const stream = ytdl(videoUrl, {
        filter: 'audioonly',
        quality: 'lowestaudio',
      });
      
      writeStream = createWriteStream(audioPath);
      
      stream.pipe(writeStream);
      
      writeStream.on('finish', () => {
        console.log(`Audio downloaded to: ${audioPath}`);
        resolve(audioPath);
      });
      
      writeStream.on('error', (error) => {
        cleanupOnError(new Error(`Failed to write audio: ${error.message}`));
      });
      
      stream.on('error', (error) => {
        cleanupOnError(new Error(`Failed to stream audio: ${error.message}`));
      });
    } catch (error) {
      cleanupOnError(error instanceof Error ? error : new Error('Unknown download error'));
    }
  });
}

async function transcribeAudioWithWhisper(audioPath: string): Promise<string> {
  try {
    console.log(`Transcribing audio file: ${audioPath}`);
    
    const transcription = await openai.audio.transcriptions.create({
      file: createReadStream(audioPath) as any,
      model: 'whisper-1',
      language: 'en', // You can make this dynamic or remove to auto-detect
    });
    
    console.log(`Transcription complete, length: ${transcription.text.length} characters`);
    return transcription.text;
  } catch (error) {
    console.error('Whisper transcription error:', error);
    throw new Error(`Failed to transcribe audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getYouTubeTranscript(videoId: string): Promise<string> {
  let audioPath: string | null = null;
  
  try {
    console.log(`Generating transcript for video ID: ${videoId}`);
    
    // First, try to get existing captions (faster and free)
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
      if (transcript && transcript.length > 0) {
        const fullTranscript = transcript.map(item => item.text).join(' ');
        console.log(`Successfully fetched existing captions, length: ${fullTranscript.length} characters`);
        return fullTranscript;
      }
    } catch (captionError) {
      console.log('No captions available, will use Whisper to generate transcript');
    }
    
    // If no captions, download audio and use Whisper
    audioPath = await downloadYouTubeAudio(videoId);
    const transcript = await transcribeAudioWithWhisper(audioPath);
    
    return transcript;
  } catch (error) {
    console.error(`Transcript generation error for ${videoId}:`, error);
    
    if (error instanceof Error) {
      if (error.message.includes('private') || error.message.includes('unavailable')) {
        throw new Error('This video is private or unavailable. Please use a public video.');
      }
      if (error.message.includes('age')) {
        throw new Error('This video is age-restricted and cannot be processed.');
      }
      throw new Error(`Failed to generate transcript: ${error.message}`);
    }
    throw new Error('Failed to generate YouTube transcript. Please try a different video.');
  } finally {
    // Always clean up the audio file, even on success or error
    if (audioPath) {
      try {
        await unlink(audioPath);
        console.log(`Cleaned up audio file: ${audioPath}`);
      } catch (unlinkError) {
        console.error('Failed to clean up audio file (non-critical):', unlinkError);
      }
    }
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
