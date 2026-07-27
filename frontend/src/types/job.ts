export type JobStatus =
  | 'UPLOADED'
  | 'EXTRACTING_AUDIO'
  | 'DETECTING_SPEECH'
  | 'TRANSCRIBING'
  | 'MERGING'
  | 'GENERATING_PDF'
  | 'COMPLETED'
  | 'FAILED';

export interface Job {
  id: string;
  filename: string;
  status: JobStatus;
  progress: number;
  language: string | null;
  duration: number | null;
  created_at: string;
  completed_at: string | null;
  pdf_path: string | null;
  txt_path: string | null;
  json_path: string | null;
  error: string | null;
}

export interface UploadResponse {
  message: string;
  filename: string;
  path: string;
}

export interface TranscribeResponse {
  message: string;
  job_id: string;
  status: JobStatus;
  progress: number;
}

export interface MessageResponse {
  success: boolean;
  message: string;
}
