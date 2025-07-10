import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextOverlay } from '../../components/TextOverlay';
import type { VideoConfig } from '../../types';

const defaultConfig: VideoConfig = {
  startTime: 0,
  endTime: 10,
  overlayText: '',
  textPosition: 'top',
  textColor: '#ffffff',
  textFont: 'Arial',
  textSize: 24
};

describe('TextOverlay Component', () => {
  it('renders text overlay controls', () => {
    const mockOnChange = vi.fn();
    render(<TextOverlay config={defaultConfig} onChange={mockOnChange} />);

    expect(screen.getByLabelText(/text:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/position:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/color:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/font:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/size:/i)).toBeInTheDocument();
  });

  it('shows preview text', () => {
    const mockOnChange = vi.fn();
    const configWithText = { ...defaultConfig, overlayText: 'Test Text' };
    render(<TextOverlay config={configWithText} onChange={mockOnChange} />);

    expect(screen.getByText('Test Text')).toBeInTheDocument();
  });

  it('shows default preview when no text', () => {
    const mockOnChange = vi.fn();
    render(<TextOverlay config={defaultConfig} onChange={mockOnChange} />);

    expect(screen.getByText('Preview Text')).toBeInTheDocument();
  });

  it('calls onChange when text input changes', async () => {
    const mockOnChange = vi.fn();
    render(<TextOverlay config={defaultConfig} onChange={mockOnChange} />);

    const textInput = screen.getByLabelText(/text:/i);
    
    // Simulate typing by directly changing the value
    fireEvent.change(textInput, { target: { value: 'Hello World' } });

    expect(mockOnChange).toHaveBeenCalledWith({ overlayText: 'Hello World' });
  });

  it('calls onChange when position changes', async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();
    render(<TextOverlay config={defaultConfig} onChange={mockOnChange} />);

    const positionSelect = screen.getByLabelText(/position:/i);
    await user.selectOptions(positionSelect, 'bottom');

    expect(mockOnChange).toHaveBeenCalledWith({ textPosition: 'bottom' });
  });

  it('calls onChange when color changes', async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();
    render(<TextOverlay config={defaultConfig} onChange={mockOnChange} />);

    const colorInput = screen.getByLabelText(/color:/i);
    await user.click(colorInput);
    
    // Simulate color change by directly firing change event
    fireEvent.change(colorInput, { target: { value: '#ff0000' } });

    expect(mockOnChange).toHaveBeenCalledWith({ textColor: '#ff0000' });
  });

  it('calls onChange when font changes', async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();
    render(<TextOverlay config={defaultConfig} onChange={mockOnChange} />);

    const fontSelect = screen.getByLabelText(/font:/i);
    await user.selectOptions(fontSelect, 'Impact');

    expect(mockOnChange).toHaveBeenCalledWith({ textFont: 'Impact' });
  });

  it('calls onChange when size changes', async () => {
    const mockOnChange = vi.fn();
    render(<TextOverlay config={defaultConfig} onChange={mockOnChange} />);

    const sizeInput = screen.getByLabelText(/size:/i);
    
    // Simulate range input change
    fireEvent.change(sizeInput, { target: { value: '32' } });

    expect(mockOnChange).toHaveBeenCalledWith({ textSize: 32 });
  });

  it('applies correct styles to preview text', () => {
    const mockOnChange = vi.fn();
    const config = {
      ...defaultConfig,
      overlayText: 'Styled Text',
      textColor: '#ff0000',
      textFont: 'Impact',
      textSize: 32
    };
    render(<TextOverlay config={config} onChange={mockOnChange} />);

    const preview = screen.getByText('Styled Text');
    expect(preview).toHaveStyle({
      color: 'rgb(255, 0, 0)',
      fontFamily: 'Impact',
      fontSize: '32px'
    });
  });
});