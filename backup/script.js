class GifMaker {
    constructor() {
        this.ffmpeg = null;
        this.videoFile = null;
        this.ffmpegLoaded = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateTextPreview();
        this.initFFmpeg();
    }

    async initFFmpeg() {
        try {
            console.log('Starting FFmpeg initialization...');
            this.showFFmpegLoading(true);
            
            // Check if FFmpegWASM is available
            if (typeof FFmpegWASM === 'undefined') {
                throw new Error('FFmpeg WASM library not loaded. Check internet connection.');
            }
            
            const { FFmpeg } = FFmpegWASM;
            this.ffmpeg = new FFmpeg();
            
            this.ffmpeg.on('log', ({ message }) => {
                console.log('[FFmpeg]', message);
            });

            this.ffmpeg.on('progress', ({ progress }) => {
                const percentage = Math.round(progress * 100);
                this.updateProgress(percentage);
            });

            console.log('Loading FFmpeg core files...');
            
            // Use local npm packages for FFmpeg core (absolute paths from web root)
            await this.ffmpeg.load({
                coreURL: '/node_modules/@ffmpeg/core/dist/umd/ffmpeg-core.js',
                wasmURL: '/node_modules/@ffmpeg/core/dist/umd/ffmpeg-core.wasm'
            });
            
            this.ffmpegLoaded = true;
            console.log('FFmpeg loaded successfully');
            
            // Show success message briefly
            const statusDiv = document.getElementById('ffmpeg-status');
            const statusText = document.getElementById('ffmpeg-status-text');
            statusText.innerHTML = '✅ FFmpeg ready! You can now create GIFs.';
            statusDiv.style.background = '#e8f6e8';
            
            // Hide success message after 3 seconds
            setTimeout(() => {
                this.showFFmpegLoading(false);
            }, 3000);
            
        } catch (error) {
            console.error('Failed to load FFmpeg:', error);
            this.ffmpegLoaded = false;
            this.showFFmpegLoading(false);
            
            const statusDiv = document.getElementById('ffmpeg-status');
            const statusText = document.getElementById('ffmpeg-status-text');
            statusText.innerHTML = `❌ Failed to load FFmpeg: ${error.message}<br><small>Check your internet connection and try refreshing the page</small>`;
            statusDiv.style.display = 'block';
            statusDiv.style.background = '#ffe6e6';
        }
    }

    setupEventListeners() {
        document.getElementById('load-video').addEventListener('click', () => {
            this.loadVideo();
        });

        document.getElementById('load-file').addEventListener('click', () => {
            this.loadVideoFile();
        });

        document.getElementById('preview-clip').addEventListener('click', () => {
            this.previewClip();
        });

        document.getElementById('set-current-start').addEventListener('click', () => {
            this.setCurrentTime('start');
        });

        document.getElementById('set-current-end').addEventListener('click', () => {
            this.setCurrentTime('end');
        });

        document.getElementById('create-gif').addEventListener('click', () => {
            this.createGif();
        });

        const textInputs = ['overlay-text', 'text-position', 'text-color', 'text-font', 'text-size'];
        textInputs.forEach(id => {
            document.getElementById(id).addEventListener('input', () => {
                this.updateTextPreview();
            });
        });

        document.getElementById('text-size').addEventListener('input', (e) => {
            document.getElementById('text-size-value').textContent = e.target.value + 'px';
        });
    }

    async loadVideo() {
        const url = document.getElementById('youtube-url').value.trim();
        if (!url) {
            alert('Please enter a YouTube URL');
            return;
        }

        try {
            const videoId = this.extractVideoId(url);
            if (!videoId) {
                throw new Error('Invalid YouTube URL');
            }

            // Create iframe for YouTube video
            const videoContainer = document.getElementById('video-player').parentElement;
            const existingPlayer = document.getElementById('video-player');
            
            // Replace video element with YouTube iframe
            const iframe = document.createElement('iframe');
            iframe.id = 'youtube-iframe';
            iframe.width = existingPlayer.offsetWidth || 800;
            iframe.height = existingPlayer.offsetHeight || 450;
            iframe.src = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&controls=1&modestbranding=1`;
            iframe.frameBorder = '0';
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
            iframe.allowFullscreen = true;
            
            videoContainer.replaceChild(iframe, existingPlayer);
            
            // Store video ID for later use
            this.currentVideoId = videoId;
            this.currentVideoUrl = url;
            
            // Set default duration (user will need to adjust manually)
            document.getElementById('end-time').value = 30;
            document.getElementById('end-time').max = 3600; // 1 hour max
            document.getElementById('start-time').max = 3600;
            
            document.getElementById('video-section').style.display = 'block';
            
            // Show message to user about manual time setting
            alert('Video loaded! Please set the start and end times manually as YouTube videos cannot be directly accessed for duration detection.');
            
        } catch (error) {
            console.error('Error loading video:', error);
            alert('Failed to load video. Please check the URL and try again.');
        }
    }

    async loadVideoFile() {
        const fileInput = document.getElementById('video-file');
        const file = fileInput.files[0];
        
        if (!file) {
            alert('Please select a video file');
            return;
        }

        try {
            // Replace iframe with video element if it exists
            const iframe = document.getElementById('youtube-iframe');
            if (iframe) {
                const videoElement = document.createElement('video');
                videoElement.id = 'video-player';
                videoElement.controls = true;
                videoElement.style.width = '100%';
                videoElement.style.maxWidth = '800px';
                videoElement.style.height = '450px';
                videoElement.style.background = '#000';
                videoElement.style.borderRadius = '5px';
                videoElement.style.marginBottom = '20px';
                
                iframe.parentElement.replaceChild(videoElement, iframe);
            }

            const videoPlayer = document.getElementById('video-player');
            const videoUrl = URL.createObjectURL(file);
            videoPlayer.src = videoUrl;
            
            videoPlayer.addEventListener('loadedmetadata', () => {
                document.getElementById('end-time').value = Math.floor(videoPlayer.duration);
                document.getElementById('end-time').max = videoPlayer.duration;
                document.getElementById('start-time').max = videoPlayer.duration;
            });

            document.getElementById('video-section').style.display = 'block';
            
            // Store the file for later use
            this.videoFile = file;
            this.currentVideoId = null; // Clear YouTube video ID
            
        } catch (error) {
            console.error('Error loading video file:', error);
            alert('Failed to load video file. Please try again.');
        }
    }

    async extractVideoUrl(youtubeUrl) {
        // This method is now deprecated in favor of iframe approach
        const videoId = this.extractVideoId(youtubeUrl);
        if (!videoId) {
            throw new Error('Invalid YouTube URL');
        }
        
        return `https://www.youtube.com/embed/${videoId}`;
    }

    extractVideoId(url) {
        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[7].length === 11) ? match[7] : null;
    }

    async downloadVideo(videoUrl) {
        try {
            // Use server endpoint to download video
            const response = await fetch('/api/download-video', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    url: videoUrl,
                    videoId: this.currentVideoId 
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to download video from server');
            }
            
            const blob = await response.blob();
            return new File([blob], 'video.mp4', { type: 'video/mp4' });
        } catch (error) {
            console.error('Error downloading video:', error);
            throw error;
        }
    }

    previewClip() {
        const startTime = parseFloat(document.getElementById('start-time').value);
        const endTime = parseFloat(document.getElementById('end-time').value);

        if (startTime >= endTime) {
            alert('Start time must be less than end time');
            return;
        }

        const videoPlayer = document.getElementById('video-player');
        const iframe = document.getElementById('youtube-iframe');

        if (videoPlayer && !iframe) {
            // For uploaded video files, we can control playback
            videoPlayer.currentTime = startTime;
            videoPlayer.play();

            const checkTime = () => {
                if (videoPlayer.currentTime >= endTime) {
                    videoPlayer.pause();
                    videoPlayer.removeEventListener('timeupdate', checkTime);
                }
            };

            videoPlayer.addEventListener('timeupdate', checkTime);
        } else {
            // For YouTube iframe, we can't directly control playback
            alert(`Clip preview: ${startTime}s to ${endTime}s (${endTime - startTime}s duration)\n\nNote: You can manually seek to ${startTime}s in the video player to preview the start of your clip.`);
        }
    }

    setCurrentTime(type) {
        const videoPlayer = document.getElementById('video-player');
        const iframe = document.getElementById('youtube-iframe');

        if (videoPlayer && !iframe) {
            // For uploaded video files, we can get current time automatically
            const currentTime = Math.floor(videoPlayer.currentTime * 10) / 10;
            if (type === 'start') {
                document.getElementById('start-time').value = currentTime;
            } else {
                document.getElementById('end-time').value = currentTime;
            }
        } else {
            // For YouTube iframe, we need manual input
            const timeInput = prompt(`Enter the current time in seconds for ${type} time:`);
            if (timeInput !== null && !isNaN(timeInput)) {
                const currentTime = parseFloat(timeInput);
                if (type === 'start') {
                    document.getElementById('start-time').value = currentTime;
                } else {
                    document.getElementById('end-time').value = currentTime;
                }
            }
        }
    }

    updateTextPreview() {
        const text = document.getElementById('overlay-text').value || 'Preview Text';
        const color = document.getElementById('text-color').value;
        const font = document.getElementById('text-font').value;
        const size = document.getElementById('text-size').value;
        
        const preview = document.getElementById('text-preview-display');
        preview.textContent = text;
        preview.style.color = color;
        preview.style.fontFamily = font;
        preview.style.fontSize = size + 'px';
    }

    async createGif() {
        if (!this.ffmpegLoaded || !this.ffmpeg) {
            alert('FFmpeg is still loading. Please wait a moment and try again.');
            return;
        }
        
        if (!this.currentVideoId && !this.videoFile) {
            alert('Please load a video first');
            return;
        }

        const startTime = parseFloat(document.getElementById('start-time').value);
        const endTime = parseFloat(document.getElementById('end-time').value);
        const overlayText = document.getElementById('overlay-text').value;
        const textPosition = document.getElementById('text-position').value;
        const textColor = document.getElementById('text-color').value;
        const textFont = document.getElementById('text-font').value;
        const textSize = document.getElementById('text-size').value;

        if (startTime >= endTime) {
            alert('Start time must be less than end time');
            return;
        }

        try {
            this.showProgress(true);
            document.getElementById('create-gif').disabled = true;

            // Get video data
            if (this.currentVideoId && !this.videoFile) {
                // Download video from server for YouTube videos
                this.videoFile = await this.downloadVideo(this.currentVideoUrl);
            }
            
            if (!this.videoFile) {
                throw new Error('No video file available');
            }
            
            const videoData = await this.videoFile.arrayBuffer();
            await this.ffmpeg.writeFile('input.mp4', new Uint8Array(videoData));

            const duration = endTime - startTime;
            
            // Build FFmpeg arguments - simplified approach
            const args = [
                '-i', 'input.mp4',
                '-ss', startTime.toString(),
                '-t', duration.toString(),
                '-vf', this.buildVideoFilter(overlayText, textPosition, textColor, textSize),
                '-r', '10', // 10 fps
                '-s', '480x270', // smaller size for better performance
                '-f', 'gif',
                'output.gif'
            ];

            console.log('FFmpeg args:', args);
            
            // Try to create GIF with text overlay
            try {
                await this.ffmpeg.exec(args);
            } catch (textError) {
                console.warn('Text overlay failed, creating GIF without text:', textError);
                // Fallback: create GIF without text overlay
                const fallbackArgs = [
                    '-i', 'input.mp4',
                    '-ss', startTime.toString(),
                    '-t', duration.toString(),
                    '-vf', 'scale=480:-1:flags=lanczos',
                    '-r', '10',
                    '-s', '480x270',
                    '-f', 'gif',
                    'output.gif'
                ];
                await this.ffmpeg.exec(fallbackArgs);
            }

            const gifData = await this.ffmpeg.readFile('output.gif');
            const gifBlob = new Blob([gifData], { type: 'image/gif' });
            const gifUrl = URL.createObjectURL(gifBlob);

            const downloadLink = document.getElementById('download-link');
            downloadLink.href = gifUrl;
            downloadLink.download = 'generated.gif';
            downloadLink.style.display = 'inline-block';
            downloadLink.textContent = 'Download GIF';

            // Clean up files
            try {
                await this.ffmpeg.deleteFile('input.mp4');
                await this.ffmpeg.deleteFile('output.gif');
            } catch (cleanupError) {
                console.warn('Cleanup error:', cleanupError);
            }

            this.showProgress(false);
            document.getElementById('create-gif').disabled = false;
            
            alert('GIF created successfully!');

        } catch (error) {
            console.error('Error creating GIF:', error);
            console.error('Error details:', error.message);
            
            // Clean up files on error
            try {
                await this.ffmpeg.deleteFile('input.mp4');
                await this.ffmpeg.deleteFile('output.gif');
            } catch (cleanupError) {
                console.warn('Cleanup error:', cleanupError);
            }
            
            alert(`Failed to create GIF: ${error.message}`);
            this.showProgress(false);
            document.getElementById('create-gif').disabled = false;
        }
    }

    buildVideoFilter(overlayText, textPosition, textColor, textSize) {
        // Start with basic video filter
        let filter = 'scale=480:-1:flags=lanczos';
        
        // Add text overlay if text is provided
        if (overlayText && overlayText.trim()) {
            // Escape text for FFmpeg
            const escapedText = overlayText.replace(/['\\]/g, '\\$&');
            
            // Convert hex color to RGB
            const hexColor = textColor.replace('#', '');
            const r = parseInt(hexColor.substr(0, 2), 16);
            const g = parseInt(hexColor.substr(2, 2), 16);
            const b = parseInt(hexColor.substr(4, 2), 16);
            const rgbColor = `0x${hexColor}`;
            
            // Calculate position
            const yPosition = textPosition === 'top' ? '50' : 'h-50';
            
            // Add drawtext filter
            filter += `,drawtext=text='${escapedText}':fontcolor=${rgbColor}:fontsize=${textSize}:x=(w-text_w)/2:y=${yPosition}:shadowcolor=black:shadowx=2:shadowy=2`;
        }
        
        return filter;
    }

    showProgress(show) {
        document.getElementById('progress').style.display = show ? 'block' : 'none';
        if (!show) {
            document.querySelector('.progress-fill').style.width = '0%';
        }
    }

    updateProgress(percentage) {
        document.querySelector('.progress-fill').style.width = percentage + '%';
        document.getElementById('progress-text').textContent = `Creating GIF... ${percentage}%`;
    }

    showFFmpegLoading(show) {
        const createButton = document.getElementById('create-gif');
        const statusDiv = document.getElementById('ffmpeg-status');
        
        if (show) {
            createButton.textContent = 'Loading FFmpeg...';
            createButton.disabled = true;
            statusDiv.style.display = 'block';
        } else {
            createButton.textContent = 'Create GIF';
            createButton.disabled = false;
            statusDiv.style.display = 'none';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new GifMaker();
});