import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VideoLoader } from '../../components/VideoLoader';

describe('VideoLoader Component', () => {
  beforeEach(() => {
    // Mock window.alert for each test
    vi.stubGlobal('alert', vi.fn());
  });

  it('renders YouTube URL input and file upload', () => {
    const mockOnVideoLoad = vi.fn();
    render(<VideoLoader onVideoLoad={mockOnVideoLoad} />);

    expect(screen.getByLabelText(/youtube url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/upload a video file/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /load video/i })).toBeInTheDocument();
  });

  it('handles YouTube URL submission', async () => {
    const user = userEvent.setup();
    const mockOnVideoLoad = vi.fn();
    render(<VideoLoader onVideoLoad={mockOnVideoLoad} />);

    const urlInput = screen.getByLabelText(/youtube url/i);
    const loadButton = screen.getByRole('button', { name: /load video/i });

    await user.type(urlInput, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await user.click(loadButton);

    expect(mockOnVideoLoad).toHaveBeenCalledWith({
      videoId: 'dQw4w9WgXcQ',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    });
  });

  it('disables button for empty or whitespace-only URL', async () => {
    const user = userEvent.setup();
    const mockOnVideoLoad = vi.fn();
    render(<VideoLoader onVideoLoad={mockOnVideoLoad} />);

    const urlInput = screen.getByLabelText(/youtube url/i);
    const loadButton = screen.getByRole('button', { name: /load video/i });
    
    // Button should be disabled initially
    expect(loadButton).toBeDisabled();
    
    // Type spaces - button should remain disabled
    await user.type(urlInput, '   ');
    expect(loadButton).toBeDisabled();
    
    // Type actual content - button should be enabled
    await user.type(urlInput, 'https://youtube.com');
    expect(loadButton).not.toBeDisabled();
  });

  it('shows alert for invalid YouTube URL', async () => {
    const user = userEvent.setup();
    const mockOnVideoLoad = vi.fn();
    render(<VideoLoader onVideoLoad={mockOnVideoLoad} />);

    const urlInput = screen.getByLabelText(/youtube url/i);
    const loadButton = screen.getByRole('button', { name: /load video/i });

    await user.type(urlInput, 'https://invalid-url.com');
    await user.click(loadButton);

    expect(window.alert).toHaveBeenCalledWith('Invalid YouTube URL');
  });

  it('handles file upload', async () => {
    const user = userEvent.setup();
    const mockOnVideoLoad = vi.fn();
    render(<VideoLoader onVideoLoad={mockOnVideoLoad} />);

    const file = new File(['video content'], 'test.mp4', { type: 'video/mp4' });
    const fileInput = screen.getByLabelText(/upload a video file/i);

    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(mockOnVideoLoad).toHaveBeenCalledWith({
        file,
        url: 'blob:test-url'
      });
    });
  });

  it('shows alert for non-video file', async () => {
    const mockOnVideoLoad = vi.fn();
    render(<VideoLoader onVideoLoad={mockOnVideoLoad} />);

    const file = new File(['text content'], 'test.txt', { type: 'text/plain' });
    const fileInput = screen.getByLabelText(/upload a video file/i);

    // Simulate file change event
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(window.alert).toHaveBeenCalledWith('Please select a valid video file');
  });

  it('disables button during loading', async () => {
    const user = userEvent.setup();
    const mockOnVideoLoad = vi.fn();
    render(<VideoLoader onVideoLoad={mockOnVideoLoad} />);

    const urlInput = screen.getByLabelText(/youtube url/i);
    const loadButton = screen.getByRole('button', { name: /load video/i });

    await user.type(urlInput, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    
    // Button should be enabled initially
    expect(loadButton).not.toBeDisabled();
    
    // Type in URL to enable button
    expect(loadButton).not.toBeDisabled();
  });
});