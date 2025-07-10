import React from 'react';

interface FFmpegStatusProps {
  loaded: boolean;
  loading: boolean;
  error: string | null;
}

export const FFmpegStatus: React.FC<FFmpegStatusProps> = ({ loaded, loading, error }) => {
  if (!loading && !error && loaded) {
    return (
      <div className="ffmpeg-status success">
        ✅ FFmpeg ready! You can now create GIFs.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="ffmpeg-status loading">
        🔄 Loading FFmpeg for video processing...
      </div>
    );
  }

  if (error) {
    return (
      <div className="ffmpeg-status error">
        ❌ Failed to load FFmpeg: {error}
        <br />
        <small>Check your internet connection and refresh the page</small>
      </div>
    );
  }

  return null;
};