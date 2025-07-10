export const extractVideoId = (url: string): string | null => {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
};

export const isValidYouTubeUrl = (url: string): boolean => {
  return extractVideoId(url) !== null;
};

export const getYouTubeEmbedUrl = (videoId: string): string => {
  return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&controls=1&modestbranding=1`;
};

export const downloadYouTubeVideo = async (url: string, videoId: string): Promise<File> => {
  const response = await fetch('/api/download-video', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      url,
      videoId 
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to download video from server');
  }
  
  const blob = await response.blob();
  return new File([blob], 'video.mp4', { type: 'video/mp4' });
};