import { describe, it, expect, vi } from 'vitest';
import { extractVideoId, isValidYouTubeUrl, getYouTubeEmbedUrl, downloadYouTubeVideo } from '../../utils/youtube';

describe('YouTube Utilities', () => {
  describe('extractVideoId', () => {
    it('extracts video ID from standard YouTube URL', () => {
      const testCases = [
        {
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          expected: 'dQw4w9WgXcQ'
        },
        {
          url: 'https://youtu.be/dQw4w9WgXcQ',
          expected: 'dQw4w9WgXcQ'
        },
        {
          url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          expected: 'dQw4w9WgXcQ'
        },
        {
          url: 'https://www.youtube.com/v/dQw4w9WgXcQ',
          expected: 'dQw4w9WgXcQ'
        }
      ];

      testCases.forEach(({ url, expected }) => {
        expect(extractVideoId(url)).toBe(expected);
      });
    });

    it('returns null for invalid URLs', () => {
      const invalidUrls = [
        'https://example.com',
        'not-a-url',
        'https://youtube.com/invalid',
        '',
        'https://www.youtube.com/watch?v=invalid', // Invalid video ID length
        'https://www.youtube.com/watch' // No video ID
      ];

      invalidUrls.forEach(url => {
        expect(extractVideoId(url)).toBe(null);
      });
    });
  });

  describe('isValidYouTubeUrl', () => {
    it('returns true for valid YouTube URLs', () => {
      const validUrls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtu.be/dQw4w9WgXcQ',
        'https://www.youtube.com/embed/dQw4w9WgXcQ'
      ];

      validUrls.forEach(url => {
        expect(isValidYouTubeUrl(url)).toBe(true);
      });
    });

    it('returns false for invalid URLs', () => {
      const invalidUrls = [
        'https://example.com',
        'not-a-url',
        ''
      ];

      invalidUrls.forEach(url => {
        expect(isValidYouTubeUrl(url)).toBe(false);
      });
    });
  });

  describe('getYouTubeEmbedUrl', () => {
    it('generates correct embed URL', () => {
      const videoId = 'dQw4w9WgXcQ';
      const embedUrl = getYouTubeEmbedUrl(videoId);
      
      expect(embedUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ?enablejsapi=1&controls=1&modestbranding=1');
    });
  });

  describe('downloadYouTubeVideo', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('downloads video successfully', async () => {
      const mockBlob = new Blob(['video data'], { type: 'video/mp4' });
      const mockResponse = {
        ok: true,
        blob: vi.fn().mockResolvedValue(mockBlob)
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const videoId = 'dQw4w9WgXcQ';

      const result = await downloadYouTubeVideo(url, videoId);

      expect(fetch).toHaveBeenCalledWith('/api/download-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, videoId })
      });

      expect(result).toBeInstanceOf(File);
      expect(result.name).toBe('video.mp4');
      expect(result.type).toBe('video/mp4');
    });

    it('throws error when download fails', async () => {
      const mockResponse = {
        ok: false,
        status: 500
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const videoId = 'dQw4w9WgXcQ';

      await expect(downloadYouTubeVideo(url, videoId)).rejects.toThrow('Failed to download video from server');
    });

    it('throws error when fetch fails', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const videoId = 'dQw4w9WgXcQ';

      await expect(downloadYouTubeVideo(url, videoId)).rejects.toThrow('Network error');
    });
  });
});