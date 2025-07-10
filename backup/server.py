#!/usr/bin/env python3
import http.server
import socketserver
import os
import json
import tempfile
import subprocess
from urllib.parse import urlparse

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()
    
    def do_POST(self):
        if self.path == '/api/download-video':
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
                
                video_url = data.get('url')
                video_id = data.get('videoId')
                
                if not video_url or not video_id:
                    self.send_response(400)
                    self.end_headers()
                    self.wfile.write(b'Missing URL or video ID')
                    return
                
                # Download video using yt-dlp
                temp_dir = tempfile.mkdtemp()
                video_path = os.path.join(temp_dir, f'{video_id}.mp4')
                
                try:
                    # Use yt-dlp to download video (using uv to run it)
                    subprocess.run([
                        'uv', 'run', 'yt-dlp', 
                        '-f', 'best[ext=mp4]',
                        '-o', video_path,
                        video_url
                    ], check=True, capture_output=True)
                    
                    # Read and send the video file
                    with open(video_path, 'rb') as f:
                        video_data = f.read()
                    
                    self.send_response(200)
                    self.send_header('Content-Type', 'video/mp4')
                    self.send_header('Content-Length', str(len(video_data)))
                    self.end_headers()
                    self.wfile.write(video_data)
                    
                    # Clean up
                    os.remove(video_path)
                    os.rmdir(temp_dir)
                    
                except subprocess.CalledProcessError as e:
                    self.send_response(500)
                    self.end_headers()
                    error_msg = f'Failed to download video: {e.stderr.decode() if e.stderr else str(e)}'
                    self.wfile.write(error_msg.encode())
                except Exception as e:
                    self.send_response(500)
                    self.end_headers()
                    self.wfile.write(f'Server error: {str(e)}'.encode())
                    
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(f'Server error: {str(e)}'.encode())
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == "__main__":
    PORT = 8001
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with socketserver.TCPServer(("0.0.0.0", PORT), CORSHTTPRequestHandler) as httpd:
        print(f"Server running at http://localhost:{PORT}")
        print("Press Ctrl+C to stop the server")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
