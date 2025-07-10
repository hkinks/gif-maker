# GIF Maker Web App

A web application that allows you to create GIFs from YouTube videos with custom text overlays.

## Features

- **YouTube Video Input**: Enter any YouTube URL to load a video
- **Video Clipping**: Select start and end times to create clips
- **Text Overlay**: Add custom text with positioning options (top/bottom)
- **Text Customization**: Choose font, color, and size for overlay text
- **GIF Generation**: Convert video clips to GIF format with text overlays
- **Download**: Download the generated GIF file

## How to Use

1. **Install Dependencies**: 
   ```bash
   npm run install-deps
   ```
   Or manually:
   ```bash
   npm install
   uv sync
   ```

2. **Start Development**: 
   ```bash
   # Terminal 1: Start the React development server
   npm run dev
   
   # Terminal 2: Start the Python API server  
   npm run server
   ```

3. **Open the App**: Navigate to `http://localhost:3000` in your browser

4. **Load Video**: 
   - Enter a YouTube URL in the input field
   - Click "Load Video" to load the video player
   - Or upload a video file directly

5. **Set Clip Time**:
   - Use the timeline controls to set start and end times
   - Use "Set Current as Start/End" buttons while the video is playing
   - Click "Preview Clip" to preview your selection

6. **Add Text Overlay**:
   - Enter text in the overlay field
   - Choose position (top or bottom)
   - Select font, color, and size
   - Preview appears below the controls

7. **Create GIF**:
   - Click "Create GIF" to generate the GIF
   - Wait for processing to complete
   - Download the generated GIF

## Technical Details

- **Frontend**: React 19 + TypeScript + Vite
- **Video Processing**: FFmpeg.js (WebAssembly)
- **Backend**: Python with uv for YouTube video processing
- **Supported Formats**: YouTube videos, uploaded video files → GIF output
- **Browser Requirements**: Modern browsers with WebAssembly support

## File Structure

```
gif-maker/
├── src/
│   ├── components/     # React components
│   ├── hooks/         # Custom React hooks
│   ├── types/         # TypeScript type definitions
│   ├── utils/         # Utility functions
│   ├── App.tsx        # Main React component
│   └── main.tsx       # React entry point
├── server.py          # Python API server
├── vite.config.ts     # Vite configuration
├── tsconfig.json      # TypeScript configuration
└── README.md          # This file
```

## Limitations

- Due to CORS restrictions, the app works best with direct video URLs
- YouTube's API restrictions may limit some video access
- Processing time depends on video length and browser performance
- Large videos may take longer to process

## Requirements

- Node.js and npm (for FFmpeg packages)
- Python 3.x (for the development server)
- uv (for Python dependency management)
- Modern web browser with WebAssembly support
- Internet connection for accessing videos
- yt-dlp (installed via uv) for YouTube video processing