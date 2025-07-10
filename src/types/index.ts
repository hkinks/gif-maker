export interface VideoConfig {
  startTime: number;
  endTime: number;
  overlayText: string;
  textPosition: 'top' | 'bottom';
  textColor: string;
  textFont: string;
  textSize: number;
}

export interface VideoFile {
  file: File;
  url: string;
  duration?: number;
}

export interface YouTubeVideo {
  videoId: string;
  url: string;
}

export type VideoSource = VideoFile | YouTubeVideo;

export interface GifCreationProgress {
  percentage: number;
  message: string;
}

export interface FFmpegInstance {
  load: (config?: any) => Promise<boolean>;
  writeFile: (name: string, data: Uint8Array) => Promise<void>;
  readFile: (name: string) => Promise<Uint8Array>;
  deleteFile: (name: string) => Promise<void>;
  exec: (args: string[]) => Promise<void>;
  on: (event: string, callback: (data: any) => void) => void;
}

export interface AppState {
  ffmpegLoaded: boolean;
  ffmpegLoading: boolean;
  videoSource: VideoSource | null;
  videoConfig: VideoConfig;
  gifCreating: boolean;
  gifProgress: GifCreationProgress;
  generatedGifUrl: string | null;
  error: string | null;
}