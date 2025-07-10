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

      await ffmpegInstance.load({
        coreURL: '/node_modules/@ffmpeg/core/dist/umd/ffmpeg-core.js',
        wasmURL: '/node_modules/@ffmpeg/core/dist/umd/ffmpeg-core.wasm'
      });

      setFfmpeg(ffmpegInstance);
      setLoaded(true);
    } catch (err) {
      console.error('Failed to load FFmpeg:', err);
      setError(err instanceof Error ? err.message : 'Failed to load FFmpeg');
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