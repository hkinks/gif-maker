import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock FFmpeg
vi.mock('@ffmpeg/ffmpeg', () => ({
  FFmpeg: vi.fn(() => ({
    on: vi.fn(),
    load: vi.fn().mockResolvedValue(true),
    exec: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue(new Uint8Array()),
    deleteFile: vi.fn().mockResolvedValue(undefined)
  }))
}));

vi.mock('@ffmpeg/util', () => ({
  fetchFile: vi.fn().mockResolvedValue(new Uint8Array())
}));

// Mock URL.createObjectURL
Object.defineProperty(window.URL, 'createObjectURL', {
  value: vi.fn(() => 'blob:test-url')
});

Object.defineProperty(window.URL, 'revokeObjectURL', {
  value: vi.fn()
});

// Mock fetch
global.fetch = vi.fn();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
};