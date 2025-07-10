import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFFmpeg } from '../../hooks/useFFmpeg';

// Mock FFmpeg
const mockFFmpegInstance = {
  on: vi.fn(),
  load: vi.fn().mockResolvedValue(true),
  exec: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
  deleteFile: vi.fn().mockResolvedValue(undefined)
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
    mockFFmpegInstance.load.mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useFFmpeg());

    await waitFor(() => {
      expect(result.current.error).toBe(errorMessage);
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
});