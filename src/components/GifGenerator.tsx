import React, { useState } from 'react';
import { downloadYouTubeVideo } from '../utils/youtube';
import { downloadFile } from '../utils/file';
import type { VideoSource, VideoConfig, GifCreationProgress } from '../types';

interface GifGeneratorProps {
  videoSource: VideoSource;
  config: VideoConfig;
  ffmpegLoaded: boolean;
  createGif: (
    videoFile: File,
    startTime: number,
    endTime: number,
    overlayText?: string,
    textPosition?: 'top' | 'bottom',
    textColor?: string,
    textSize?: number,
    onProgress?: (progress: GifCreationProgress) => void
  ) => Promise<Blob>;
  onGifGenerated: (url: string) => void;
}

export const GifGenerator: React.FC<GifGeneratorProps> = ({
  videoSource,
  config,
  ffmpegLoaded,
  createGif,
  onGifGenerated
}) => {
  const [creating, setCreating] = useState(false);
  const [progress, setProgress] = useState<GifCreationProgress>({ percentage: 0, message: '' });

  const handleCreateGif = async () => {
    if (!ffmpegLoaded) {
      alert('FFmpeg is still loading. Please wait a moment and try again.');
      return;
    }

    if (config.startTime >= config.endTime) {
      alert('Start time must be less than end time');
      return;
    }

    try {
      setCreating(true);
      setProgress({ percentage: 0, message: 'Preparing video...' });

      let videoFile: File;

      if ('videoId' in videoSource) {
        // Download YouTube video
        setProgress({ percentage: 10, message: 'Downloading YouTube video...' });
        videoFile = await downloadYouTubeVideo(videoSource.url, videoSource.videoId);
      } else {
        // Use uploaded file
        videoFile = videoSource.file;
      }

      setProgress({ percentage: 30, message: 'Processing video...' });

      const gifBlob = await createGif(
        videoFile,
        config.startTime,
        config.endTime,
        config.overlayText,
        config.textPosition,
        config.textColor,
        config.textSize,
        (progress) => setProgress(progress)
      );

      const gifUrl = URL.createObjectURL(gifBlob);
      onGifGenerated(gifUrl);

      setProgress({ percentage: 100, message: 'GIF created successfully!' });
      
      // Auto-download the GIF
      downloadFile(gifBlob, 'generated.gif');

    } catch (error) {
      console.error('Error creating GIF:', error);
      alert(`Failed to create GIF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setCreating(false);
      setTimeout(() => {
        setProgress({ percentage: 0, message: '' });
      }, 3000);
    }
  };

  return (
    <div className="gif-generator">
      <button
        className="create-gif-button"
        onClick={handleCreateGif}
        disabled={!ffmpegLoaded || creating}
      >
        {creating ? 'Creating GIF...' : 'Create GIF'}
      </button>

      {creating && (
        <div className="progress">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <span className="progress-text">{progress.message}</span>
        </div>
      )}
    </div>
  );
};