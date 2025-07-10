import { useState } from 'react';
import { VideoLoader } from './components/VideoLoader';
import { VideoPlayer } from './components/VideoPlayer';
import { VideoControls } from './components/VideoControls';
import { TextOverlay } from './components/TextOverlay';
import { GifGenerator } from './components/GifGenerator';
import { FFmpegStatus } from './components/FFmpegStatus';
import { useFFmpeg } from './hooks/useFFmpeg';
import type { VideoSource, VideoConfig } from './types';
import './App.css';

const defaultConfig: VideoConfig = {
  startTime: 0,
  endTime: 10,
  overlayText: '',
  textPosition: 'top',
  textColor: '#ffffff',
  textFont: 'Arial',
  textSize: 24
};

function App() {
  const [videoSource, setVideoSource] = useState<VideoSource | null>(null);
  const [videoConfig, setVideoConfig] = useState<VideoConfig>(defaultConfig);
  const [generatedGifUrl, setGeneratedGifUrl] = useState<string | null>(null);
  
  const { loaded: ffmpegLoaded, loading: ffmpegLoading, error: ffmpegError, createGif } = useFFmpeg();

  const handleVideoLoad = (source: VideoSource) => {
    setVideoSource(source);
    setGeneratedGifUrl(null);
    
    // Reset end time based on video type
    if ('file' in source) {
      // For uploaded files, we'll get duration from the video element
      setVideoConfig(prev => ({ ...prev, startTime: 0 }));
    } else {
      // For YouTube videos, set a default
      setVideoConfig(prev => ({ ...prev, startTime: 0, endTime: 30 }));
    }
  };

  const handleConfigChange = (newConfig: Partial<VideoConfig>) => {
    setVideoConfig(prev => ({ ...prev, ...newConfig }));
  };

  const handleVideoDurationChange = (duration: number) => {
    setVideoConfig(prev => ({ 
      ...prev, 
      endTime: Math.min(prev.endTime, duration) 
    }));
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>GIF Maker</h1>
        <FFmpegStatus 
          loaded={ffmpegLoaded} 
          loading={ffmpegLoading} 
          error={ffmpegError} 
        />
      </header>

      <main className="app-main">
        <VideoLoader onVideoLoad={handleVideoLoad} />

        {videoSource && (
          <div className="video-section">
            <VideoPlayer 
              videoSource={videoSource} 
              onDurationChange={handleVideoDurationChange}
            />
            
            <VideoControls
              config={videoConfig}
              onChange={handleConfigChange}
              videoSource={videoSource}
            />
            
            <TextOverlay
              config={videoConfig}
              onChange={handleConfigChange}
            />
            
            <GifGenerator
              videoSource={videoSource}
              config={videoConfig}
              ffmpegLoaded={ffmpegLoaded}
              createGif={createGif}
              onGifGenerated={setGeneratedGifUrl}
            />

            {generatedGifUrl && (
              <div className="gif-result">
                <h3>Generated GIF</h3>
                <img src={generatedGifUrl} alt="Generated GIF" />
                <a 
                  href={generatedGifUrl} 
                  download="generated.gif"
                  className="download-button"
                >
                  Download GIF
                </a>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;