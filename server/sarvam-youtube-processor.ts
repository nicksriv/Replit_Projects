import { exec, spawn } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import ytdl from '@distube/ytdl-core';
import axios from 'axios';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface VideoInfo {
  videoId: string;
  title: string;
  channelName: string;
  duration: number;
  description?: string;
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  duration: number;
  speaker_id?: string;
}

export interface TranscriptResult {
  text: string;
  language: string;
  segments: TranscriptSegment[];
  processing_time: number;
  word_count: number;
  provider: string;
  model: string;
  chunks_processed: number;
}

export class SarvamYouTubeProcessor {
  private readonly downloadFolder: string;
  private readonly maxDuration: number = 29; // Safe duration for chunks (29 seconds)
  private readonly sarvamApiKey: string;
  private readonly sarvamBaseUrl: string = 'https://api.sarvam.ai';

  constructor() {
    this.downloadFolder = join(process.cwd(), 'temp_downloads');
    this.sarvamApiKey = process.env.SARVAM_API_KEY || '';
    this.ensureDownloadFolder();
  }

  private async ensureDownloadFolder(): Promise<void> {
    try {
      await fs.mkdir(this.downloadFolder, { recursive: true });
    } catch (error) {
      console.error('Error creating download folder:', error);
    }
  }

  public isAvailable(): boolean {
    return !!this.sarvamApiKey;
  }

  /**
   * Extract video ID from YouTube URL
   */
  public extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  }

  /**
   * Get video information from YouTube
   */
  public async getVideoInfo(url: string): Promise<VideoInfo | null> {
    try {
      const videoId = this.extractVideoId(url);
      if (!videoId) return null;

      // Try with updated ytdl-core first
      console.log('Attempting to get video info with @distube/ytdl-core...');
      const info = await ytdl.getInfo(url, {
        // Add options to help bypass some restrictions
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          }
        }
      });
      const details = info.videoDetails;

      return {
        videoId,
        title: details.title || 'Unknown Title',
        channelName: details.author?.name || 'Unknown Channel',
        duration: parseInt(details.lengthSeconds) || 0,
        description: details.description || ''
      };
    } catch (error) {
      console.error('Error getting video info with ytdl-core:', error);
      
      // Fallback: try to extract basic info from URL and use a default
      const videoId = this.extractVideoId(url);
      if (videoId) {
        console.log('Falling back to basic video info extraction...');
        return {
          videoId,
          title: `YouTube Video ${videoId}`,
          channelName: 'Unknown Channel',
          duration: 0,
          description: ''
        };
      }
      
      return null;
    }
  }

  /**
   * Download audio from YouTube video
   */
  public async downloadAudio(url: string): Promise<string | null> {
    try {
      const videoId = this.extractVideoId(url);
      if (!videoId) throw new Error('Invalid YouTube URL');

      const outputPath = join(this.downloadFolder, `${videoId}.wav`);
      
      // Remove existing file if it exists
      try {
        await fs.unlink(outputPath);
      } catch (error) {
        // File doesn't exist, ignore
      }

      console.log('Downloading audio from YouTube...');
      
      try {
        // Use @distube/ytdl-core to get audio stream with better options
        const audioStream = ytdl(url, {
          filter: 'audioonly',
          quality: 'highestaudio',
          requestOptions: {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            }
          }
        });

        // Use FFmpeg to convert to WAV
        const ffmpegProcess = spawn('ffmpeg', [
          '-i', 'pipe:0',
          '-acodec', 'pcm_s16le',
          '-ar', '16000',
          '-ac', '1',
          '-f', 'wav',
          '-y', // Overwrite output file
          outputPath
        ]);

        audioStream.pipe(ffmpegProcess.stdin);

        return new Promise((resolve, reject) => {
          let errorOutput = '';
          
          ffmpegProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
          });

          ffmpegProcess.on('close', (code) => {
            if (code === 0) {
              console.log('Audio download completed:', outputPath);
              resolve(outputPath);
            } else {
              console.error('FFmpeg error output:', errorOutput);
              reject(new Error(`FFmpeg process exited with code ${code}`));
            }
          });

          ffmpegProcess.on('error', (error) => {
            console.error('FFmpeg process error:', error);
            reject(error);
          });

          audioStream.on('error', (error) => {
            console.error('Audio stream error:', error);
            reject(error);
          });
        });
      } catch (streamError) {
        console.error('Error creating audio stream:', streamError);
        throw streamError;
      }

    } catch (error) {
      console.error('Error downloading audio:', error);
      return null;
    }
  }

  /**
   * Get audio duration using FFprobe
   */
  private async getAudioDuration(audioPath: string): Promise<number> {
    try {
      const { stdout } = await execAsync(`ffprobe -v quiet -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`);
      return parseFloat(stdout.trim());
    } catch (error) {
      console.warn('Could not determine audio duration:', error);
      return 0;
    }
  }

  /**
   * Split audio into chunks of max_duration seconds
   */
  private async splitAudioIntoChunks(audioPath: string): Promise<string[]> {
    try {
      const duration = await this.getAudioDuration(audioPath);
      
      if (duration <= this.maxDuration) {
        return [audioPath]; // No need to split
      }

      const chunkPaths: string[] = [];
      const baseName = audioPath.replace('.wav', '');
      const chunkCount = Math.ceil(duration / this.maxDuration);

      console.log(`Splitting ${duration.toFixed(1)}s audio into ${chunkCount} chunks of ${this.maxDuration}s each`);

      for (let i = 0; i < chunkCount; i++) {
        const startTime = i * this.maxDuration;
        const chunkPath = `${baseName}_chunk_${(i + 1).toString().padStart(3, '0')}.wav`;

        // Use FFmpeg to extract chunk
        const command = `ffmpeg -i "${audioPath}" -ss ${startTime} -t ${this.maxDuration} -c copy -y "${chunkPath}"`;
        
        try {
          await execAsync(command);
          
          // Verify chunk was created
          const stats = await fs.stat(chunkPath);
          if (stats.size > 0) {
            chunkPaths.push(chunkPath);
            console.log(`Created chunk ${i + 1}/${chunkCount}: ${chunkPath}`);
          } else {
            throw new Error('Empty chunk created');
          }
        } catch (chunkError) {
          console.error(`Failed to create chunk ${i + 1}:`, chunkError);
          // Clean up any partial chunks
          await this.cleanupChunks(chunkPaths);
          throw new Error('Failed to split audio into chunks');
        }
      }

      return chunkPaths;
    } catch (error) {
      console.error('Error splitting audio:', error);
      throw error;
    }
  }

  /**
   * Clean up temporary chunk files
   */
  private async cleanupChunks(chunkPaths: string[]): Promise<void> {
    for (const chunkPath of chunkPaths) {
      try {
        await fs.unlink(chunkPath);
        console.log('Cleaned up chunk:', chunkPath);
      } catch (error) {
        console.warn(`Failed to clean up chunk ${chunkPath}:`, error);
      }
    }
  }

  /**
   * Generate transcript using Sarvam AI for a single file
   */
  private async generateTranscriptSingle(audioPath: string): Promise<TranscriptResult> {
    try {
      console.log('Starting Sarvam AI transcription of:', audioPath);
      const startTime = Date.now();

      // Check file size
      const stats = await fs.stat(audioPath);
      console.log(`Audio file size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

      // Read audio file
      const audioBuffer = await fs.readFile(audioPath);

      // Prepare form data for Sarvam API
      const formData = new FormData();
      const audioBlob = new Blob([new Uint8Array(audioBuffer)], { type: 'audio/wav' });
      formData.append('file', audioBlob, 'audio.wav');
      formData.append('model', 'saaras:v2.5');

      // Make API call to Sarvam AI
      console.log('Making API call to Sarvam AI...');
      const response = await axios.post(
        `${this.sarvamBaseUrl}/speech-to-text-translate`,
        formData,
        {
          headers: {
            'api-subscription-key': this.sarvamApiKey,
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000, // 60 second timeout
        }
      );

      const processingTime = (Date.now() - startTime) / 1000;
      console.log(`Sarvam AI transcription completed in ${processingTime.toFixed(2)} seconds`);

      // Extract transcript and metadata from response
      const transcript = response.data.transcript || '';
      const language = response.data.language_code || 'unknown';
      
      // Format segments if available
      const segments: TranscriptSegment[] = [];
      if (response.data.diarized_transcript?.entries) {
        for (const entry of response.data.diarized_transcript.entries) {
          if (entry.transcript && typeof entry.start_time_seconds === 'number') {
            segments.push({
              start: parseFloat(entry.start_time_seconds.toFixed(2)),
              end: parseFloat(entry.end_time_seconds?.toFixed(2) || entry.start_time_seconds.toFixed(2)),
              text: entry.transcript.trim(),
              duration: parseFloat((entry.end_time_seconds - entry.start_time_seconds).toFixed(2)),
              speaker_id: entry.speaker_id || 'unknown'
            });
          }
        }
      }

      return {
        text: transcript.trim(),
        language,
        segments,
        processing_time: parseFloat(processingTime.toFixed(2)),
        word_count: transcript ? transcript.split(/\s+/).length : 0,
        provider: 'sarvam_ai',
        model: 'saaras:v2.5',
        chunks_processed: 1
      };

    } catch (error) {
      console.error('Error in single-file transcription:', error);
      throw new Error(`Sarvam AI transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate transcript using chunked approach
   */
  private async generateTranscriptChunked(audioPath: string): Promise<TranscriptResult> {
    let chunkPaths: string[] = [];
    
    try {
      // Split audio into chunks
      chunkPaths = await this.splitAudioIntoChunks(audioPath);
      const totalChunks = chunkPaths.length;

      console.log(`Processing ${totalChunks} chunks with Sarvam AI...`);

      const allTranscripts: string[] = [];
      const allSegments: TranscriptSegment[] = [];
      let totalProcessingTime = 0;
      let detectedLanguage = 'unknown';
      let chunkOffset = 0;

      for (let i = 0; i < chunkPaths.length; i++) {
        const chunkPath = chunkPaths[i];
        console.log(`Processing chunk ${i + 1}/${totalChunks}: ${chunkPath}`);

        try {
          const chunkResult = await this.generateTranscriptSingle(chunkPath);
          const transcriptText = chunkResult.text.trim();

          if (transcriptText) {
            allTranscripts.push(transcriptText);

            // Adjust segment timestamps for chunked processing
            const chunkSegments = chunkResult.segments;
            for (const segment of chunkSegments) {
              segment.start += chunkOffset;
              segment.end += chunkOffset;
              allSegments.push(segment);
            }
          }

          // Use language from first chunk that has content
          if (detectedLanguage === 'unknown' && chunkResult.language) {
            detectedLanguage = chunkResult.language;
          }

          totalProcessingTime += chunkResult.processing_time;
          chunkOffset += this.maxDuration; // Move offset for next chunk

          console.log(`Chunk ${i + 1} completed: ${transcriptText.length} characters`);

        } catch (chunkError) {
          console.warn(`Chunk ${i + 1} failed:`, chunkError);
          // Continue with other chunks even if one fails
          chunkOffset += this.maxDuration; // Still move offset
          continue;
        }
      }

      // Stitch all transcripts together
      const finalTranscript = allTranscripts.join(' ');
      const wordCount = finalTranscript ? finalTranscript.split(/\s+/).length : 0;

      console.log(`Chunked transcription completed: ${allTranscripts.length} successful chunks, ${wordCount} total words`);

      return {
        text: finalTranscript,
        language: detectedLanguage,
        segments: allSegments,
        processing_time: parseFloat(totalProcessingTime.toFixed(2)),
        word_count: wordCount,
        provider: 'sarvam_ai',
        model: 'saaras:v2.5',
        chunks_processed: allTranscripts.length
      };

    } catch (error) {
      console.error('Error in chunked transcription:', error);
      throw error;
    } finally {
      // Clean up chunk files
      if (chunkPaths.length > 0) {
        await this.cleanupChunks(chunkPaths);
      }
    }
  }

  /**
   * Main method to generate transcript from YouTube URL
   */
  public async processYouTubeVideo(url: string): Promise<{
    videoInfo: VideoInfo;
    transcript: TranscriptResult;
  }> {
    if (!this.isAvailable()) {
      throw new Error('Sarvam AI client not available. Please check your API key.');
    }

    console.log(`Starting YouTube video processing: ${url}`);

    // Get video information
    const videoInfo = await this.getVideoInfo(url);
    if (!videoInfo) {
      throw new Error('Failed to extract video information. Please check if the video is accessible and not private.');
    }

    console.log(`Video info extracted: "${videoInfo.title}" by ${videoInfo.channelName}`);

    // Download audio
    const audioPath = await this.downloadAudio(url);
    if (!audioPath) {
      throw new Error('Failed to download video audio. This could be due to video restrictions, geo-blocking, or YouTube anti-bot measures.');
    }

    try {
      // Verify the downloaded file exists and has content
      const stats = await fs.stat(audioPath);
      if (stats.size === 0) {
        throw new Error('Downloaded audio file is empty');
      }
      
      console.log(`Downloaded audio file: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

      // Get audio duration to determine processing approach
      const duration = await this.getAudioDuration(audioPath);
      console.log(`Audio duration: ${duration.toFixed(2)} seconds`);

      if (duration === 0) {
        throw new Error('Could not determine audio duration or file is corrupted');
      }

      let transcript: TranscriptResult;

      if (duration > this.maxDuration) {
        console.log(`Audio exceeds ${this.maxDuration}s limit, splitting into chunks...`);
        transcript = await this.generateTranscriptChunked(audioPath);
      } else {
        console.log('Audio within limit, processing as single file...');
        transcript = await this.generateTranscriptSingle(audioPath);
      }

      if (!transcript.text || transcript.text.trim().length === 0) {
        throw new Error('Transcript generation returned empty result');
      }

      return { videoInfo, transcript };

    } catch (processingError) {
      console.error('Error during audio processing:', processingError);
      throw processingError;
    } finally {
      // Clean up main audio file
      try {
        await fs.unlink(audioPath);
        console.log('Cleaned up audio file:', audioPath);
      } catch (error) {
        console.warn('Failed to clean up audio file:', error);
      }
    }
  }
}