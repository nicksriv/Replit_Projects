import { createReadStream } from 'fs';
import { unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import OpenAI from 'openai';
import { generateEmbedding, chunkText, cosineSimilarity, generateChatCompletion } from './openai';

const execAsync = promisify(exec);

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
        console.error('Failed to cleanup temp file:', cleanupError);
      }
    }
    
    console.error('Download error:', error);
    throw new Error(`Failed to download audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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
  try {
    console.log(`Generating transcript for video ID: ${videoId}`);
    
    // Step 1: Fetch video page to extract API key
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const pageResponse = await fetch(videoUrl);
    const html = await pageResponse.text();
    
    const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
    if (!apiKeyMatch) {
      throw new Error('Could not extract API key from video page');
    }
    const apiKey = apiKeyMatch[1];
    
    // Step 2: Call Innertube API to get player response (using Android client for better caption access)
    const playerEndpoint = `https://www.youtube.com/youtubei/v1/player?key=${apiKey}`;
    const playerResponse = await fetch(playerEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: {
          client: {
            clientName: 'ANDROID',
            clientVersion: '20.10.38'
          }
        },
        videoId: videoId
      })
    });
    
    const playerData = await playerResponse.json();
    
    // Step 3: Extract caption tracks
    const captionTracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!captionTracks || captionTracks.length === 0) {
      throw new Error('No captions/subtitles available for this video');
    }
    
    // Step 4: Find English track first, otherwise use first available
    let selectedTrack = captionTracks.find((track: any) => track.languageCode?.startsWith('en')) || captionTracks[0];
    const langCode = selectedTrack.languageCode || 'unknown';
    console.log(`Using transcript in language: ${langCode}`);
    
    // Step 5: Fetch transcript XML
    const transcriptResponse = await fetch(selectedTrack.baseUrl);
    
    if (!transcriptResponse.ok) {
      throw new Error(`Failed to fetch transcript: HTTP ${transcriptResponse.status}`);
    }
    
    const transcriptXml = await transcriptResponse.text();
    
    // Step 6: Parse XML to extract text (YouTube uses <p> tags)
    const textRegex = /<p[^>]*>([^<]*)<\/p>/g;
    const transcriptTexts: string[] = [];
    let match;
    
    while ((match = textRegex.exec(transcriptXml)) !== null) {
      const text = match[1]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
        .trim();
      if (text) {
        transcriptTexts.push(text);
      }
    }
    
    if (transcriptTexts.length === 0) {
      throw new Error('No transcript text found in captions');
    }
    
    const fullTranscript = transcriptTexts.join(' ');
    console.log(`Successfully fetched captions, length: ${fullTranscript.length} characters`);
    return fullTranscript;
    
  } catch (error: any) {
    console.error(`Transcript generation error for ${videoId}:`, error);
    
    if (error instanceof Error) {
      if (error.message.includes('private') || error.message.includes('unavailable')) {
        throw new Error('This video is private or unavailable. Please use a public video.');
      }
      if (error.message.includes('age')) {
        throw new Error('This video is age-restricted and cannot be processed.');
      }
      if (error.message.includes('captions') || error.message.includes('subtitles')) {
        throw error;
      }
      throw new Error(`Failed to fetch transcript: ${error.message}`);
    }
    
    throw new Error('Failed to generate YouTube transcript. Please try a different video with captions enabled.');
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

  // Fetch metadata and transcript in parallel
  const [metadata, transcript] = await Promise.all([
    getVideoMetadata(videoId),
    getYouTubeTranscript(videoId)
  ]);
  
  if (!transcript || transcript.trim().length === 0) {
    throw new Error('No transcript available for this video');
  }

  const { title: videoTitle, channelName } = metadata;
  
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
  
  // Take top 3 chunks - removed the 0.7 threshold as it was too restrictive
  // Real queries typically score 0.45-0.6 similarity with lyrical content
  const topChunks = chunksWithSimilarity.slice(0, 3);

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
