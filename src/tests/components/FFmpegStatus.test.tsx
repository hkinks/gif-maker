import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FFmpegStatus } from '../../components/FFmpegStatus';

describe('FFmpegStatus Component', () => {
  it('shows loading status', () => {
    render(<FFmpegStatus loaded={false} loading={true} error={null} />);
    
    expect(screen.getByText(/loading ffmpeg for video processing/i)).toBeInTheDocument();
    expect(screen.getByText(/🔄/)).toBeInTheDocument();
  });

  it('shows success status when loaded', () => {
    render(<FFmpegStatus loaded={true} loading={false} error={null} />);
    
    expect(screen.getByText(/ffmpeg ready! you can now create gifs/i)).toBeInTheDocument();
    expect(screen.getByText(/✅/)).toBeInTheDocument();
  });

  it('shows error status', () => {
    const errorMessage = 'Failed to load FFmpeg';
    render(<FFmpegStatus loaded={false} loading={false} error={errorMessage} />);
    
    expect(screen.getByText(/failed to load ffmpeg/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(errorMessage))).toBeInTheDocument();
    expect(screen.getByText(/❌/)).toBeInTheDocument();
    expect(screen.getByText(/check your internet connection/i)).toBeInTheDocument();
  });

  it('renders nothing when not loading, no error, and not loaded', () => {
    const { container } = render(<FFmpegStatus loaded={false} loading={false} error={null} />);
    
    expect(container.firstChild).toBeNull();
  });

  it('applies correct CSS classes', () => {
    const { rerender } = render(<FFmpegStatus loaded={false} loading={true} error={null} />);
    expect(screen.getByText(/loading ffmpeg/i)).toHaveClass('ffmpeg-status', 'loading');

    rerender(<FFmpegStatus loaded={true} loading={false} error={null} />);
    expect(screen.getByText(/ffmpeg ready/i)).toHaveClass('ffmpeg-status', 'success');

    rerender(<FFmpegStatus loaded={false} loading={false} error="Error message" />);
    expect(screen.getByText(/failed to load/i)).toHaveClass('ffmpeg-status', 'error');
  });
});