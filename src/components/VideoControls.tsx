import React from 'react';
import type { VideoConfig, VideoSource } from '../types';

interface VideoControlsProps {
  config: VideoConfig;
  onChange: (config: Partial<VideoConfig>) => void;
  videoSource: VideoSource;
}

export const VideoControls: React.FC<VideoControlsProps> = ({ config, onChange, videoSource }) => {
  const isYouTubeVideo = 'videoId' in videoSource;

  const handlePreviewClip = () => {
    if (config.startTime >= config.endTime) {
      alert('Start time must be less than end time');
      return;
    }

    if (!isYouTubeVideo) {
      // For uploaded videos, we can control playback
      const video = document.querySelector('video');
      if (video) {
        video.currentTime = config.startTime;
        video.play();

        const checkTime = () => {
          if (video.currentTime >= config.endTime) {
            video.pause();
            video.removeEventListener('timeupdate', checkTime);
          }
        };

        video.addEventListener('timeupdate', checkTime);
      }
    } else {
      // For YouTube videos, just show info
      const duration = config.endTime - config.startTime;
      alert(
        `Clip preview: ${config.startTime}s to ${config.endTime}s (${duration}s duration)\n\n` +
        `Note: You can manually seek to ${config.startTime}s in the video player to preview the start of your clip.`
      );
    }
  };

  const handleSetCurrentTime = (type: 'start' | 'end') => {
    if (!isYouTubeVideo) {
      // For uploaded videos, get current time from video element
      const video = document.querySelector('video');
      if (video) {
        const currentTime = Math.floor(video.currentTime * 10) / 10;
        onChange({
          [type === 'start' ? 'startTime' : 'endTime']: currentTime
        });
      }
    } else {
      // For YouTube videos, ask user for manual input
      const timeInput = prompt(`Enter the current time in seconds for ${type} time:`);
      if (timeInput !== null && !isNaN(Number(timeInput))) {
        const currentTime = parseFloat(timeInput);
        onChange({
          [type === 'start' ? 'startTime' : 'endTime']: currentTime
        });
      }
    }
  };

  return (
    <div className="video-controls">
      <h3>Clip Settings</h3>
      
      <div className="time-inputs">
        <div className="time-input">
          <label htmlFor="start-time">Start Time (seconds):</label>
          <input
            id="start-time"
            type="number"
            min="0"
            step="0.1"
            value={config.startTime}
            onChange={(e) => onChange({ startTime: parseFloat(e.target.value) || 0 })}
          />
        </div>
        
        <div className="time-input">
          <label htmlFor="end-time">End Time (seconds):</label>
          <input
            id="end-time"
            type="number"
            min="0"
            step="0.1"
            value={config.endTime}
            onChange={(e) => onChange({ endTime: parseFloat(e.target.value) || 10 })}
          />
        </div>
      </div>
      
      <div className="control-buttons">
        <button onClick={handlePreviewClip}>
          Preview Clip
        </button>
        <button onClick={() => handleSetCurrentTime('start')}>
          Set Current as Start
        </button>
        <button onClick={() => handleSetCurrentTime('end')}>
          Set Current as End
        </button>
      </div>
    </div>
  );
};