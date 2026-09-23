/**
 * Clean up internal UUID prefix from filenames for clean UI display.
 * e.g. "799aa267-cec2-4a29-8248-29990b07f8cf_myvideo.mp4" -> "myvideo.mp4"
 */
export const getCleanFilename = (filename: string | null | undefined): string => {
  if (!filename) return '';
  return filename.replace(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}_/, '');
};

/**
 * Format duration in seconds to "Xm Ys" string.
 */
export const formatDuration = (seconds: number | null | undefined): string => {
  if (seconds === null || seconds === undefined || isNaN(seconds)) return '-';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs}s`;
};

/**
 * Format ISO date string into readable local timestamp string.
 */
export const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
