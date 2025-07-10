import React, { useState } from 'react';
import { extractVideoId } from '../utils/youtube';
import { isVideoFile } from '../utils/file';
import type { VideoSource } from '../types';

interface VideoLoaderProps {
  onVideoLoad: (source: VideoSource) => void;
}

export const VideoLoader: React.FC<VideoLoaderProps> = ({ onVideoLoad }) => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleYouTubeLoad = async () => {
    if (!youtubeUrl.trim()) {
      alert('Please enter a YouTube URL');
      return;
    }

    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      alert('Invalid YouTube URL');
      return;
    }

    try {
      setLoading(true);
      onVideoLoad({
        videoId,
        url: youtubeUrl
      });
    } catch (error) {
      console.error('Error loading YouTube video:', error);
      alert('Failed to load video. Please check the URL and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      alert('Please select a video file');
      return;
    }

    if (!isVideoFile(file)) {
      alert('Please select a valid video file');
      return;
    }

    try {
      const url = URL.createObjectURL(file);
      onVideoLoad({
        file,
        url
      });
    } catch (error) {
      console.error('Error loading video file:', error);
      alert('Failed to load video file. Please try again.');
    }
  };

  return (
    <div className="video-loader">
      <div className="youtube-section">
        <label htmlFor="youtube-url">YouTube URL:</label>
        <div className="input-group">
          <input
            id="youtube-url"
            type="text"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="Enter YouTube URL"
            disabled={loading}
          />
          <button 
            onClick={handleYouTubeLoad}
            disabled={loading || !youtubeUrl.trim()}
          >
            {loading ? 'Loading...' : 'Load Video'}
          </button>
        </div>
      </div>

      <div className="divider">
        <span>OR</span>
      </div>

      <div className="file-section">
        <label htmlFor="video-file">Upload a video file:</label>
        <input
          id="video-file"
          type="file"
          accept="video/*"
          onChange={handleFileLoad}
        />
      </div>
    </div>
  );
};