import React, { useRef, useEffect } from 'react';
import { getYouTubeEmbedUrl } from '../utils/youtube';
import type { VideoSource } from '../types';

interface VideoPlayerProps {
  videoSource: VideoSource;
  onDurationChange?: (duration: number) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoSource, onDurationChange }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !('file' in videoSource)) return;

    const handleLoadedMetadata = () => {
      if (video.duration && onDurationChange) {
        onDurationChange(video.duration);
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata);
  }, [videoSource, onDurationChange]);

  if ('videoId' in videoSource) {
    // YouTube video
    return (
      <div className="video-player">
        <iframe
          src={getYouTubeEmbedUrl(videoSource.videoId)}
          width="800"
          height="450"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        <p className="youtube-note">
          Note: For YouTube videos, you'll need to manually enter start and end times
        </p>
      </div>
    );
  }

  // Uploaded video file
  return (
    <div className="video-player">
      <video
        ref={videoRef}
        src={videoSource.url}
        controls
        width="800"
        height="450"
      />
    </div>
  );
};