import api from './client';
import type { Job, UploadResponse, TranscribeResponse, MessageResponse } from '../types/job';

export const jobsApi = {
  /**
   * Get all transcription jobs.
   */
  getJobs: async (): Promise<Job[]> => {
    const response = await api.get<Job[]>('/jobs/');
    return response.data;
  },

  /**
   * Get detail of a specific job.
   */
  getJob: async (id: string): Promise<Job> => {
    const response = await api.get<Job>(`/jobs/${id}`);
    return response.data;
  },

  /**
   * Upload an audio or video file.
   */
  uploadFile: async (
    file: File,
    onProgress?: (percentCompleted: number) => void
  ): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<UploadResponse>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });

    return response.data;
  },

  /**
   * Start the transcription job for an uploaded file.
   */
  startTranscription: async (filename: string): Promise<TranscribeResponse> => {
    // The FastAPI backend route is /transcribe?filename=...
    const response = await api.post<TranscribeResponse>(
      `/transcribe?filename=${encodeURIComponent(filename)}`
    );
    return response.data;
  },

  /**
   * Delete a job.
   */
  deleteJob: async (id: string): Promise<MessageResponse> => {
    const response = await api.delete<MessageResponse>(`/jobs/${id}`);
    return response.data;
  },

  /**
   * Generate download URLs for direct links.
   */
  getDownloadUrl: (type: 'pdf' | 'txt' | 'json', id: string): string => {
    return `http://localhost:8000/download/${type}/${id}`;
  },

  /**
   * Trigger download directly by fetching blob and saving.
   */
  downloadFile: async (type: 'pdf' | 'txt' | 'json', id: string, filename: string): Promise<void> => {
    const response = await api.get(`/download/${type}/${id}`, {
      responseType: 'blob',
    });
    
    const contentType = response.headers['content-type'];
    const blob = new Blob([response.data], {
      type: typeof contentType === 'string' ? contentType : undefined,
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

