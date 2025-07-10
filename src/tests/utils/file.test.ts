import { describe, it, expect, vi } from 'vitest';
import { createObjectURL, downloadFile, isVideoFile, formatTime, parseTime } from '../../utils/file';

describe('File Utilities', () => {
  describe('createObjectURL', () => {
    it('creates object URL for blob', () => {
      const mockBlob = new Blob(['test'], { type: 'text/plain' });
      const url = createObjectURL(mockBlob);
      
      expect(url).toBe('blob:test-url');
      expect(URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
    });
  });

  describe('downloadFile', () => {
    it('triggers file download', () => {
      const mockBlob = new Blob(['test'], { type: 'text/plain' });
      const filename = 'test.txt';
      
      // Mock DOM methods
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
        style: { display: '' }
      };
      
      const mockAppendChild = vi.fn();
      const mockRemoveChild = vi.fn();
      
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      vi.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);
      vi.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild);
      
      downloadFile(mockBlob, filename);
      
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockLink.href).toBe('blob:test-url');
      expect(mockLink.download).toBe(filename);
      expect(mockAppendChild).toHaveBeenCalledWith(mockLink);
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalledWith(mockLink);
    });
  });

  describe('isVideoFile', () => {
    it('returns true for video files', () => {
      const videoFiles = [
        new File([''], 'test.mp4', { type: 'video/mp4' }),
        new File([''], 'test.avi', { type: 'video/avi' }),
        new File([''], 'test.mov', { type: 'video/mov' }),
        new File([''], 'test.webm', { type: 'video/webm' })
      ];

      videoFiles.forEach(file => {
        expect(isVideoFile(file)).toBe(true);
      });
    });

    it('returns false for non-video files', () => {
      const nonVideoFiles = [
        new File([''], 'test.txt', { type: 'text/plain' }),
        new File([''], 'test.jpg', { type: 'image/jpeg' }),
        new File([''], 'test.pdf', { type: 'application/pdf' }),
        new File([''], 'test.json', { type: 'application/json' })
      ];

      nonVideoFiles.forEach(file => {
        expect(isVideoFile(file)).toBe(false);
      });
    });
  });

  describe('formatTime', () => {
    it('formats seconds to MM:SS format', () => {
      const testCases = [
        { input: 0, expected: '0:00' },
        { input: 30, expected: '0:30' },
        { input: 60, expected: '1:00' },
        { input: 90, expected: '1:30' },
        { input: 3661, expected: '61:01' },
        { input: 125.7, expected: '2:05' }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(formatTime(input)).toBe(expected);
      });
    });
  });

  describe('parseTime', () => {
    it('parses MM:SS format to seconds', () => {
      const testCases = [
        { input: '0:00', expected: 0 },
        { input: '0:30', expected: 30 },
        { input: '1:00', expected: 60 },
        { input: '1:30', expected: 90 },
        { input: '10:05', expected: 605 }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(parseTime(input)).toBe(expected);
      });
    });

    it('parses plain number strings', () => {
      const testCases = [
        { input: '0', expected: 0 },
        { input: '30.5', expected: 30.5 },
        { input: '120', expected: 120 }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(parseTime(input)).toBe(expected);
      });
    });

    it('handles invalid input', () => {
      expect(isNaN(parseTime('invalid'))).toBe(true);
      expect(isNaN(parseTime(''))).toBe(true);
      expect(parseTime('1:2:3')).toBe(1); // parseFloat('1:2:3') returns 1
    });
  });
});