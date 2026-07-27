import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Globe,
  FileDown,
  AlertOctagon,
  RefreshCw,
  Trash2,
  FileText,
} from 'lucide-react';
import { jobsApi } from '../api/jobs';
import type { Job } from '../types/job';
import { StatusBadge } from '../components/StatusBadge';
import { ProgressBar } from '../components/ProgressBar';
import { SkeletonCard } from '../components/LoadingSpinner';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { useToast } from '../components/Toast';

export const JobDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [downloadingType, setDownloadingType] = useState<'pdf' | 'txt' | 'json' | null>(null);

  const navigate = useNavigate();
  const toast = useToast();
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);


  const fetchJobDetails = async (showLoading = false) => {
    if (!id) return;
    try {
      if (showLoading) setIsLoading(true);
      const data = await jobsApi.getJob(id);
      setJob(data);
      
      // Stop polling if job is completed or failed
      if ((data.status === 'COMPLETED' || data.status === 'FAILED') && pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
        toast.info(`Job status transitioned to ${data.status.toLowerCase()}. Polling stopped.`);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load job details.');
      
      // Stop polling on API errors
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  // Initial load & Polling setup
  useEffect(() => {
    fetchJobDetails(true);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [id]);

  // Set up polling interval if job is processing
  useEffect(() => {
    if (!job) return;

    const isProcessing = job.status !== 'COMPLETED' && job.status !== 'FAILED';

    if (isProcessing && !pollingRef.current) {
      // Start polling every 2 seconds
      pollingRef.current = setInterval(() => {
        fetchJobDetails(false);
      }, 2000);
    }

    return () => {
      // Clean up on status change or unmount
      if (!isProcessing && pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [job]);

  const handleDownload = async (type: 'pdf' | 'txt' | 'json') => {
    if (!job) return;
    try {
      setDownloadingType(type);
      const baseName = job.filename.substring(0, job.filename.lastIndexOf('.')) || job.filename;
      const downloadName = `${baseName}_transcript.${type}`;
      
      await jobsApi.downloadFile(type, job.id, downloadName);
      toast.success(`${type.toUpperCase()} file downloaded!`);
    } catch (error) {
      console.error(error);
      toast.error(`Failed to download ${type.toUpperCase()} file.`);
    } finally {
      setDownloadingType(null);
    }
  };

  const handleDeleteJob = async () => {
    if (!job) return;
    try {
      setIsDeleting(true);
      await jobsApi.deleteJob(job.id);
      toast.success('Job deleted successfully.');
      navigate('/jobs');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete job.');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (seconds === null || seconds === undefined) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <div className="h-6 bg-muted rounded w-24 animate-pulse" />
        <SkeletonCard />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-md mx-auto text-center space-y-4 p-8 border border-border bg-card rounded-3xl">
        <AlertOctagon className="w-12 h-12 text-destructive mx-auto" />
        <h3 className="text-lg font-bold text-foreground">Job Not Found</h3>
        <p className="text-sm text-muted-foreground">The transcription job details could not be retrieved.</p>
        <Link
          to="/jobs"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-xl text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Jobs
        </Link>
      </div>
    );
  }

  const isFinished = job.status === 'COMPLETED';
  const isFailed = job.status === 'FAILED';
  const isProcessing = !isFinished && !isFailed;

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-200">
      {/* Back button header */}
      <div className="flex justify-between items-center select-none">
        <Link
          to="/jobs"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Jobs
        </Link>
        <div className="flex gap-2">
          <button
            onClick={() => fetchJobDetails(false)}
            className="p-2 border border-border hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl transition-all cursor-pointer"
            title="Refresh Status"
          >
            <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsDeleteDialogOpen(true)}
            className="p-2 border border-border hover:bg-muted text-muted-foreground hover:text-destructive rounded-xl transition-all cursor-pointer"
            title="Delete Job"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Details Card */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-6">
        {/* Filename and Status */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-border/50">
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold tracking-tight text-foreground truncate max-w-md" title={job.filename}>
              {job.filename}
            </h2>
            <p className="text-xs font-mono text-muted-foreground mt-1">ID: {job.id}</p>
          </div>
          <StatusBadge status={job.status} />
        </div>

        {/* Live Progress Bar for running jobs */}
        {isProcessing && (
          <div className="space-y-2 p-3 bg-primary/5 rounded-2xl border border-primary/10">
            <div className="flex justify-between items-center text-xs font-bold text-primary">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                Live Processing Status...
              </span>
              <span className="font-mono">{job.progress}%</span>
            </div>
            <ProgressBar progress={job.progress} />
            <p className="text-[11px] text-muted-foreground leading-normal mt-1">
              Currently running: <span className="font-semibold text-foreground">{job.status.replace('_', ' ')}</span>. The page polls for status changes in real-time.
            </p>
          </div>
        )}

        {/* Error alert if failed */}
        {isFailed && (
          <div className="flex gap-3 p-4 border border-rose-500/20 rounded-2xl bg-rose-500/10 dark:bg-rose-500/5 text-rose-700 dark:text-rose-400">
            <AlertOctagon className="w-5.5 h-5.5 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-rose-800 dark:text-rose-300">Transcription Failed</h4>
              <p className="text-xs mt-1 leading-relaxed">
                {job.error || 'An unexpected failure occurred during processing. Please review the media format.'}
              </p>
            </div>
          </div>
        )}

        {/* Grid Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 border border-border/50 bg-muted/10 rounded-xl">
            <Globe className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Language</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">
                {job.language ? job.language.toUpperCase() : '-'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 border border-border/50 bg-muted/10 rounded-xl">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Audio Duration</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">
                {job.duration ? formatDuration(job.duration) : '-'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 border border-border/50 bg-muted/10 rounded-xl">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Created Time</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">
                {formatDate(job.created_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 border border-border/50 bg-muted/10 rounded-xl">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Completed Time</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">
                {job.completed_at ? formatDate(job.completed_at) : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Download Section (Only shown if finished) */}
        {isFinished && (
          <div className="pt-4 border-t border-border/50 space-y-3 select-none">
            <h3 className="text-sm font-bold text-foreground">Download Transcription Outputs</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* PDF */}
              <button
                onClick={() => handleDownload('pdf')}
                disabled={downloadingType !== null}
                className="flex items-center justify-between p-3.5 border border-border hover:border-rose-500/30 hover:bg-rose-500/5 dark:hover:bg-rose-500/10 rounded-2xl transition-all font-semibold text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <span className="flex items-center gap-2 text-foreground group-hover:text-rose-500 transition-colors">
                  <FileText className="w-4.5 h-4.5 text-rose-500" />
                  PDF Document
                </span>
                <FileDown className="w-4.5 h-4.5 text-muted-foreground group-hover:text-rose-500 transition-colors" />
              </button>

              {/* TXT */}
              <button
                onClick={() => handleDownload('txt')}
                disabled={downloadingType !== null}
                className="flex items-center justify-between p-3.5 border border-border hover:border-blue-500/30 hover:bg-blue-500/5 dark:hover:bg-blue-500/10 rounded-2xl transition-all font-semibold text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <span className="flex items-center gap-2 text-foreground group-hover:text-blue-500 transition-colors">
                  <FileText className="w-4.5 h-4.5 text-blue-500" />
                  TXT Plaintext
                </span>
                <FileDown className="w-4.5 h-4.5 text-muted-foreground group-hover:text-blue-500 transition-colors" />
              </button>

              {/* JSON */}
              <button
                onClick={() => handleDownload('json')}
                disabled={downloadingType !== null}
                className="flex items-center justify-between p-3.5 border border-border hover:border-amber-500/30 hover:bg-amber-500/5 dark:hover:bg-amber-500/10 rounded-2xl transition-all font-semibold text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <span className="flex items-center gap-2 text-foreground group-hover:text-amber-500 transition-colors">
                  <FileText className="w-4.5 h-4.5 text-amber-500" />
                  JSON Transcript
                </span>
                <FileDown className="w-4.5 h-4.5 text-muted-foreground group-hover:text-amber-500 transition-colors" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Transcription Job"
        message={`Are you sure you want to delete this transcription job? This will delete the job data and all associated text, pdf and transcript output files from the server.`}
        confirmText="Delete Job"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteJob}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </div>
  );
};
