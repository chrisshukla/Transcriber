import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileAudio, FileVideo, X, Play, Loader2, Languages, Check } from 'lucide-react';
import { jobsApi } from '../api/jobs';
import { ProgressBar } from '../components/ProgressBar';
import { useToast } from '../components/Toast';

const ALLOWED_EXTENSIONS = [
  '.mp4',
  '.avi',
  '.mov',
  '.mkv',
  '.webm',
  '.mp3',
  '.wav',
  '.m4a',
];

export const Upload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isStartingTranscription, setIsStartingTranscription] = useState<boolean>(false);
  const [language, setLanguage] = useState<string>('hi');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const navigate = useNavigate();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFile = (selectedFile: File): boolean => {
    const extension = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      toast.error(
        `Unsupported file type. Supported extensions: ${ALLOWED_EXTENSIONS.join(', ')}`
      );
      return false;
    }
    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      }
    }
  };

  const removeFile = () => {
    setFile(null);
    setUploadProgress(0);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const isVideoFile = (filename: string): boolean => {
    const videoExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.webm'];
    const ext = '.' + filename.split('.').pop()?.toLowerCase();
    return videoExtensions.includes(ext);
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // 1. Upload File
      const uploadRes = await jobsApi.uploadFile(file, (progress) => {
        setUploadProgress(progress);
      });

      toast.success('File uploaded successfully!');

      // Extract UUID prefixed filename from return path (e.g. "uploads/uuid_name.mp3" or "uploads\\uuid_name.mp3")
      const filenameInUploads = uploadRes.path.replace(/^.*[\\/]/, '');

      // 2. Start Transcription with chosen language
      setIsStartingTranscription(true);
      const transcribeRes = await jobsApi.startTranscription(filenameInUploads, language);

      toast.success('Transcription job queued!');
      
      // Redirect directly to the JobDetails page for real-time monitoring
      navigate(`/jobs/${transcribeRes.job_id}`);

    } catch (error: any) {
      console.error(error);
      const errMsg = error.response?.data?.detail || 'An error occurred during upload.';
      toast.error(errMsg);
      setIsUploading(false);
      setIsStartingTranscription(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-foreground">Upload Media File</h2>
        <p className="text-xs font-semibold text-muted-foreground mt-0.5">Select an audio or video file to process with Whisper AI</p>
      </div>

      <div className="glass-card rounded-3xl p-8 shadow-xl flex flex-col gap-6">
        {/* Drag and Drop Zone */}
        {!file && (
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileSelect}
            className={`flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-3xl cursor-pointer transition-all duration-300 ${
              dragActive
                ? 'border-indigo-500 bg-indigo-500/10 scale-[1.02] shadow-xl glow-primary'
                : 'border-border/80 hover:border-indigo-500/60 hover:bg-muted/20 animate-dropzone'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={ALLOWED_EXTENSIONS.join(',')}
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <div className="p-4 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 rounded-2xl mb-4 border border-indigo-500/20 glow-primary">
              <UploadCloud className="w-10 h-10 animate-bounce" />
            </div>
            <p className="text-base font-extrabold text-foreground text-center">
              Drag & Drop file here or click to browse
            </p>
            <p className="text-xs text-muted-foreground text-center mt-1.5 font-medium">
              Supported Formats: MP4, AVI, MOV, MKV, WEBM, MP3, WAV, M4A
            </p>
          </div>
        )}

        {/* Selected File Details */}
        {file && (
          <div className="relative p-6 border border-border/80 rounded-2xl bg-card/60 flex items-center gap-4 shadow-sm">
            <div className={`p-4 rounded-2xl border ${
              isVideoFile(file.name)
                ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
            }`}>
              {isVideoFile(file.name) ? <FileVideo className="w-8 h-8" /> : <FileAudio className="w-8 h-8" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate pr-6" title={file.name}>
                {file.name}
              </p>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                {formatBytes(file.size)}
              </p>
            </div>
            {!isUploading && (
              <button
                onClick={removeFile}
                className="absolute right-3 top-3 p-1.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-muted transition-colors cursor-pointer"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Language & Transcription Mode Selection */}
        {file && !isUploading && (
          <div className="flex flex-col gap-2.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-2">
              <Languages className="w-4 h-4 text-indigo-400" />
              Transcription Mode (Word-for-Word)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                {
                  id: 'hi',
                  label: 'Hinglish (Hindi + Eng)',
                  desc: 'Word-for-word, no translation',
                  badge: 'Recommended',
                },
                {
                  id: 'auto',
                  label: 'Auto-Detect',
                  desc: 'Auto-detect per segment',
                  badge: null,
                },
                {
                  id: 'en',
                  label: 'English Only',
                  desc: 'Pure English speech',
                  badge: null,
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLanguage(opt.id)}
                  className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                    language === opt.id
                      ? 'border-indigo-500 bg-indigo-500/15 shadow-sm ring-1 ring-indigo-500/50'
                      : 'border-border/60 hover:border-border bg-card/40 hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">{opt.label}</span>
                    {language === opt.id && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 font-medium leading-tight">
                    {opt.desc}
                  </span>
                  {opt.badge && (
                    <span className="mt-2 inline-block text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 w-fit">
                      {opt.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Upload Action Progress */}
        {isUploading && (
          <div className="space-y-2.5 p-2">
            <div className="flex justify-between items-center text-xs font-extrabold text-muted-foreground">
              <span>{isStartingTranscription ? 'Enqueuing Job...' : 'Uploading File...'}</span>
              <span className="font-mono">{uploadProgress}%</span>
            </div>
            <ProgressBar progress={uploadProgress} />
          </div>
        )}

        {/* Action Button */}
        {file && !isUploading && (
          <button
            onClick={handleUpload}
            className="w-full flex items-center justify-center gap-2.5 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:scale-[1.02] active:scale-[0.98] text-white font-black rounded-2xl shadow-xl shadow-indigo-500/25 transition-all cursor-pointer glow-primary text-sm uppercase tracking-wider"
          >
            <Play className="w-4 h-4 fill-white" />
            Start Transcription Job
          </button>
        )}

        {isStartingTranscription && (
          <div className="flex items-center justify-center gap-2.5 py-3 text-sm font-bold text-muted-foreground">
            <Loader2 className="w-4.5 h-4.5 animate-spin text-indigo-500" />
            Connecting to sequential worker queue...
          </div>
        )}
      </div>
    </div>
  );
};

