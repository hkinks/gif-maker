import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFFmpeg } from '../../hooks/useFFmpeg';

// Mock FFmpeg
const mockFFmpegInstance = {
  on: vi.fn(),
  load: vi.fn(),
  exec: vi.fn(),
  writeFile: vi.fn(),
  readFile: vi.fn(),
  deleteFile: vi.fn(),
  loaded: true
};

vi.mock('@ffmpeg/ffmpeg', () => ({
  FFmpeg: vi.fn(() => mockFFmpegInstance)
}));

vi.mock('@ffmpeg/util', () => ({
  fetchFile: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4]))
}));

describe('useFFmpeg Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementations
    mockFFmpegInstance.load.mockResolvedValue(true);
    mockFFmpegInstance.exec.mockResolvedValue(undefined);
    mockFFmpegInstance.writeFile.mockResolvedValue(undefined);
    mockFFmpegInstance.readFile.mockResolvedValue(new Uint8Array([1, 2, 3, 4]));
    mockFFmpegInstance.deleteFile.mockResolvedValue(undefined);
    mockFFmpegInstance.loaded = true;
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useFFmpeg());

    expect(result.current.ffmpeg).toBeNull();
    expect(result.current.loaded).toBe(false);
    expect(result.current.loading).toBe(true); // Should be loading initially
    expect(result.current.error).toBeNull();
  });

  it('loads FFmpeg successfully', async () => {
    const { result } = renderHook(() => useFFmpeg());

    await waitFor(() => {
      expect(result.current.loaded).toBe(true);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.ffmpeg).toBeTruthy();
    expect(mockFFmpegInstance.load).toHaveBeenCalled();
  });

  it('handles FFmpeg loading error', async () => {
    const errorMessage = 'Failed to load';
    mockFFmpegInstance.load.mockRejectedValue(new Error(errorMessage));
    mockFFmpegInstance.loaded = false;

    const { result } = renderHook(() => useFFmpeg());

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.error).toContain(errorMessage);
    });

    expect(result.current.loaded).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it('creates GIF successfully', async () => {
    const { result } = renderHook(() => useFFmpeg());

    // Wait for FFmpeg to load
    await waitFor(() => {
      expect(result.current.loaded).toBe(true);
    });

    const mockFile = new File(['video content'], 'test.mp4', { type: 'video/mp4' });
    const mockProgressCallback = vi.fn();

    const gifBlob = await result.current.createGif(
      mockFile,
      0,
      10,
      'Test Text',
      'top',
      '#ffffff',
      24,
      mockProgressCallback
    );

    expect(gifBlob).toBeInstanceOf(Blob);
    expect(gifBlob.type).toBe('image/gif');
    expect(mockFFmpegInstance.writeFile).toHaveBeenCalledWith('input.mp4', expect.any(Uint8Array));
    expect(mockFFmpegInstance.exec).toHaveBeenCalledWith(expect.arrayContaining([
      '-i', 'input.mp4',
      '-ss', '0',
      '-t', '10'
    ]));
    expect(mockFFmpegInstance.readFile).toHaveBeenCalledWith('output.gif');
    expect(mockProgressCallback).toHaveBeenCalled();
  });

  it('throws error when creating GIF without FFmpeg loaded', async () => {
    const { result } = renderHook(() => useFFmpeg());
    
    // Don't wait for loading to complete
    const mockFile = new File(['video content'], 'test.mp4', { type: 'video/mp4' });

    await expect(result.current.createGif(mockFile, 0, 10)).rejects.toThrow('FFmpeg not loaded');
  });

  it('cleans up files after GIF creation', async () => {
    const { result } = renderHook(() => useFFmpeg());

    await waitFor(() => {
      expect(result.current.loaded).toBe(true);
    });

    const mockFile = new File(['video content'], 'test.mp4', { type: 'video/mp4' });
    await result.current.createGif(mockFile, 0, 10);

    expect(mockFFmpegInstance.deleteFile).toHaveBeenCalledWith('input.mp4');
    expect(mockFFmpegInstance.deleteFile).toHaveBeenCalledWith('output.gif');
  });

  it('cleans up files even when GIF creation fails', async () => {
    const { result } = renderHook(() => useFFmpeg());

    await waitFor(() => {
      expect(result.current.loaded).toBe(true);
    });

    mockFFmpegInstance.exec.mockRejectedValueOnce(new Error('Processing failed'));

    const mockFile = new File(['video content'], 'test.mp4', { type: 'video/mp4' });
    
    await expect(result.current.createGif(mockFile, 0, 10)).rejects.toThrow('Processing failed');

    expect(mockFFmpegInstance.deleteFile).toHaveBeenCalledWith('input.mp4');
    expect(mockFFmpegInstance.deleteFile).toHaveBeenCalledWith('output.gif');
  });

  it('demonstrates stuck loading scenario - replicates the original bug', async () => {
    // Mock hanging load that never resolves - this replicates the stuck loading bug
    mockFFmpegInstance.load.mockImplementation(() => {
      return new Promise(() => {
        // This promise never resolves, simulating the hanging CDN issue
        // This demonstrates the original bug where the app gets stuck at "Loading FFmpeg..."
      });
    });

    const { result } = renderHook(() => useFFmpeg());

    // Should start loading
    expect(result.current.loading).toBe(true);
    expect(result.current.loaded).toBe(false);

    // Wait a bit to simulate the user experience
    await new Promise(resolve => setTimeout(resolve, 100));

    // The bug: app would be stuck in loading state indefinitely
    // Our fix: timeout mechanism should eventually show error
    expect(result.current.loading).toBe(true); // Still loading (demonstrating the bug)
    expect(result.current.loaded).toBe(false);
    expect(result.current.error).toBeNull(); // No error yet (bug scenario)
    
    // This test successfully demonstrates the stuck loading issue that users experienced
  });

  it('tries multiple CDN sources when first fails', async () => {
    let callCount = 0;
    mockFFmpegInstance.load.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        throw new Error('First CDN failed');
      }
      return Promise.resolve();
    });

    const { result } = renderHook(() => useFFmpeg());

    await waitFor(() => {
      expect(result.current.loaded).toBe(true);
    });

    // Should have tried multiple times
    expect(mockFFmpegInstance.load).toHaveBeenCalledTimes(2);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('fails gracefully when all CDN sources fail', async () => {
    mockFFmpegInstance.load.mockRejectedValue(new Error('All CDNs failed'));

    const { result } = renderHook(() => useFFmpeg());

    await waitFor(() => {
      expect(result.current.error).toContain('FFmpeg loading failed');
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.loaded).toBe(false);
    // Should have tried multiple CDN sources (3 configs in our implementation)
    expect(mockFFmpegInstance.load).toHaveBeenCalledTimes(3);
  });
});