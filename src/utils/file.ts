export const createObjectURL = (blob: Blob): string => {
  return URL.createObjectURL(blob);
};

export const downloadFile = (blob: Blob, filename: string): void => {
  const url = createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const isVideoFile = (file: File): boolean => {
  return file.type.startsWith('video/');
};

export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const parseTime = (timeString: string): number => {
  const parts = timeString.split(':');
  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);
    return minutes * 60 + seconds;
  }
  return parseFloat(timeString);
};