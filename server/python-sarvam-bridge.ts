import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

export interface PythonSarvamResult {
  success: boolean;
  data?: {
    videoInfo: {
      videoId: string;
      title: string;
      channelName: string;
      duration: number;
    };
    transcript: {
      text: string;
      language: string;
      word_count: number;
      processing_time: number;
      chunks_processed: number;
      provider: string;
      model: string;
      segments?: any[];
    };
  };
  error?: string;
}

export class PythonSarvamBridge {
  private readonly pythonProjectPath: string;
  private readonly pythonExecutable: string;

  constructor() {
    this.pythonProjectPath = '/Users/nikhilsrivastava/Documents/GitHub/VSCode/Cursor_Projects/youtube-transcript-chatbot';
    this.pythonExecutable = join(this.pythonProjectPath, '.venv/bin/python');
  }

  /**
   * Check if the Python Sarvam implementation is available
   */
  public async isAvailable(): Promise<boolean> {
    try {
      // Check if Python environment exists
      const { stdout } = await execAsync(`cd "${this.pythonProjectPath}" && ${this.pythonExecutable} -c "import sarvam_transcript_generator; print('OK')"`);
      return stdout.trim() === 'OK';
    } catch (error) {
      console.error('Python Sarvam implementation not available:', error);
      return false;
    }
  }

  /**
   * Process YouTube video using the working Python implementation
   */
  public async processYouTubeVideo(url: string): Promise<PythonSarvamResult> {
    try {
      console.log(`Processing YouTube video with Python Sarvam: ${url}`);
      
      // Create a temporary Python script to process the video
      const scriptContent = `
import sys
import os
import json
import warnings
import logging

# Suppress all warnings and logging to ensure clean JSON output
warnings.filterwarnings("ignore")
logging.getLogger().setLevel(logging.CRITICAL)

sys.path.append('${this.pythonProjectPath}')

from dotenv import load_dotenv
from youtube_processor import YouTubeProcessor
from sarvam_transcript_generator import SarvamTranscriptGenerator

# Load environment variables
load_dotenv()

def process_video(url):
    try:
        # Initialize components
        youtube_processor = YouTubeProcessor()
        sarvam_generator = SarvamTranscriptGenerator()
        
        if not sarvam_generator.is_available():
            return {"success": False, "error": "Sarvam API not available"}
        
        # Get video info
        video_info = youtube_processor.get_video_info(url)
        if not video_info:
            return {"success": False, "error": "Failed to get video information"}
        
        # Download audio (redirect stdout and stderr to suppress messages)
        import sys
        import subprocess
        from contextlib import redirect_stdout, redirect_stderr
        from io import StringIO
        
        # Suppress all output from yt-dlp
        stdout = StringIO()
        stderr = StringIO()
        with redirect_stdout(stdout), redirect_stderr(stderr):
            audio_path = youtube_processor.download_audio(url)
        
        if not audio_path:
            return {"success": False, "error": "Failed to download audio"}
        
        # Generate transcript with Sarvam
        transcript_result = sarvam_generator.generate_transcript(audio_path, include_timestamps=True)
        
        # Clean up audio file
        if os.path.exists(audio_path):
            os.remove(audio_path)
        
        # Extract video ID from URL
        import re
        video_id = 'unknown'
        patterns = [
            r'(?:youtube\\.com\\/watch\\?v=|youtu\\.be\\/|youtube\\.com\\/embed\\/)([^&\\n?#]+)',
            r'youtube\\.com\\/v\\/([^&\\n?#]+)'
        ]
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                video_id = match.group(1)
                break
        
        # Format result
        result = {
            "success": True,
            "data": {
                "videoInfo": {
                    "videoId": video_id,
                    "title": video_info.get('title', 'Unknown Title'),
                    "channelName": video_info.get('uploader', 'Unknown Channel'),
                    "duration": video_info.get('duration', 0)
                },
                "transcript": {
                    "text": transcript_result.get('text', ''),
                    "language": transcript_result.get('language', 'unknown'),
                    "word_count": transcript_result.get('word_count', 0),
                    "processing_time": transcript_result.get('processing_time', 0),
                    "chunks_processed": transcript_result.get('chunks_processed', 1),
                    "provider": transcript_result.get('provider', 'sarvam_ai'),
                    "model": transcript_result.get('model', 'saaras:v2.5'),
                    "segments": transcript_result.get('segments', [])
                }
            }
        }
        
        return result
        
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    try:
        url = sys.argv[1] if len(sys.argv) > 1 else ""
        if not url:
            print(json.dumps({"success": False, "error": "No URL provided"}))
            sys.exit(1)
        
        result = process_video(url)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"success": False, "error": f"Script execution error: {str(e)}"}))
        sys.exit(1)
`;

      // Write temporary script
      const tempScriptPath = join(this.pythonProjectPath, 'temp_process_video.py');
      writeFileSync(tempScriptPath, scriptContent);

      try {
        // Execute Python script
        const { stdout, stderr } = await execAsync(
          `cd "${this.pythonProjectPath}" && ${this.pythonExecutable} temp_process_video.py "${url}"`,
          { timeout: 300000 } // 5 minute timeout
        );

        if (stderr) {
          console.warn('Python script stderr:', stderr);
        }

        // Extract only the JSON from stdout (last line should be the JSON result)
        const lines = stdout.trim().split('\n').filter(line => line.trim() !== '');
        const jsonLine = lines[lines.length - 1];
        
        console.log('Python script output lines:', lines.length);
        console.log('Last line for JSON parsing:', jsonLine.substring(0, 200) + '...');

        // Validate that the line looks like JSON before parsing
        if (!jsonLine.startsWith('{') || !jsonLine.endsWith('}')) {
          console.error('Invalid JSON format. Full output:', stdout);
          throw new Error(`Invalid JSON response from Python script: ${jsonLine.substring(0, 100)}`);
        }

        // Parse result
        const result: PythonSarvamResult = JSON.parse(jsonLine);
        console.log(`Python Sarvam processing completed: ${result.success ? 'SUCCESS' : 'FAILED'}`);
        
        if (result.success && result.data) {
          console.log(`Transcript generated: ${result.data.transcript.word_count} words, ${result.data.transcript.chunks_processed} chunks`);
        }

        return result;

      } finally {
        // Clean up temporary script
        try {
          unlinkSync(tempScriptPath);
        } catch (error) {
          console.warn('Failed to clean up temp script:', error);
        }
      }

    } catch (error) {
      console.error('Error in Python Sarvam bridge:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Extract video ID from YouTube URL (helper method)
   */
  private extractVideoId(url: string): string {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    
    return 'unknown';
  }
}