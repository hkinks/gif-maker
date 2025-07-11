import { useState, useEffect, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import type { GifCreationProgress } from '../types';

export const useFFmpeg = () => {
  const [ffmpeg, setFfmpeg] = useState<FFmpeg | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initFFmpeg = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const ffmpegInstance = new FFmpeg();
      
      ffmpegInstance.on('log', ({ message }) => {
        console.log('[FFmpeg]', message);
      });

      ffmpegInstance.on('progress', ({ progress }) => {
        console.log('[FFmpeg Progress]', progress);
      });

      // Try different loading strategies with latest version
      const configs = [
        {
          name: 'unpkg.com',
          coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
          wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm'
        },
        {
          name: 'jsdelivr.net',
          coreURL: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
          wasmURL: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm'
        },
        {
          name: 'default',
          coreURL: undefined,
          wasmURL: undefined
        }
      ];

      let lastError;
      let loadingSuccess = false;
      
      for (const config of configs) {
        try {
          console.log(`[FFmpeg] Attempting to load from: ${config.name}`);
          if (config.coreURL) {
            console.log(`[FFmpeg] Core URL: ${config.coreURL}`);
            console.log(`[FFmpeg] WASM URL: ${config.wasmURL}`);
          }
          
          // Add timeout to prevent hanging
          const loadPromise = config.name === 'default' 
            ? ffmpegInstance.load() 
            : ffmpegInstance.load(config);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Loading timeout after 30 seconds')), 30000)
          );
          
          await Promise.race([loadPromise, timeoutPromise]);
          
          console.log(`[FFmpeg] ✅ Successfully loaded from: ${config.name}`);
          loadingSuccess = true;
          break;
        } catch (configError) {
          console.warn(`[FFmpeg] ❌ Failed to load from ${config.name}:`, configError);
          lastError = configError;
        }
      }

      if (!loadingSuccess) {
        throw lastError || new Error('Failed to load FFmpeg from any source');
      }

      setFfmpeg(ffmpegInstance);
      setLoaded(true);
    } catch (err) {
      console.error('Failed to load FFmpeg:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load FFmpeg';
      setError(`FFmpeg loading failed: ${errorMessage}. Please check your internet connection and try refreshing the page.`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initFFmpeg();
  }, [initFFmpeg]);

  const createGif = useCallback(async (
    videoFile: File,
    startTime: number,
    endTime: number,
    overlayText?: string,
    textPosition: 'top' | 'bottom' = 'top',
    textColor: string = '#ffffff',
    textSize: number = 24,
    onProgress?: (progress: GifCreationProgress) => void
  ): Promise<Blob> => {
    if (!ffmpeg || !loaded) {
      throw new Error('FFmpeg not loaded');
    }

    try {
      const duration = endTime - startTime;
      
      // Write input file
      const videoData = await fetchFile(videoFile);
      await ffmpeg.writeFile('input.mp4', videoData);

      // Build video filter
      let filter = 'scale=480:-1:flags=lanczos';
      
      if (overlayText && overlayText.trim()) {
        const escapedText = overlayText.replace(/['\\]/g, '\\$&');
        const hexColor = textColor.replace('#', '');
        const rgbColor = `0x${hexColor}`;
        const yPosition = textPosition === 'top' ? '50' : 'h-50';
        
        filter += `,drawtext=text='${escapedText}':fontcolor=${rgbColor}:fontsize=${textSize}:x=(w-text_w)/2:y=${yPosition}:shadowcolor=black:shadowx=2:shadowy=2`;
      }

      // Execute FFmpeg command
      const args = [
        '-i', 'input.mp4',
        '-ss', startTime.toString(),
        '-t', duration.toString(),
        '-vf', filter,
        '-r', '10',
        '-s', '480x270',
        '-f', 'gif',
        'output.gif'
      ];

      onProgress?.({ percentage: 0, message: 'Starting GIF creation...' });
      
      await ffmpeg.exec(args);
      
      onProgress?.({ percentage: 90, message: 'Reading generated GIF...' });

      // Read output file
      const gifData = await ffmpeg.readFile('output.gif');
      const gifBlob = new Blob([gifData], { type: 'image/gif' });

      // Cleanup
      try {
        await ffmpeg.deleteFile('input.mp4');
        await ffmpeg.deleteFile('output.gif');
      } catch (cleanupError) {
        console.warn('Cleanup error:', cleanupError);
      }

      onProgress?.({ percentage: 100, message: 'GIF created successfully!' });
      
      return gifBlob;
    } catch (error) {
      // Cleanup on error
      try {
        await ffmpeg.deleteFile('input.mp4');
        await ffmpeg.deleteFile('output.gif');
      } catch (cleanupError) {
        console.warn('Cleanup error:', cleanupError);
      }
      
      throw error;
    }
  }, [ffmpeg, loaded]);

  return {
    ffmpeg,
    loaded,
    loading,
    error,
    createGif
  };
};