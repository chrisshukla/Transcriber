import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Eye,
  Trash2,
  Download,
  Calendar,
  Clock,
  Globe,
  FileText,
  FileDown,
  RotateCcw,
} from 'lucide-react';
import { jobsApi } from '../api/jobs';
import type { Job } from '../types/job';
import { StatusBadge } from '../components/StatusBadge';
import { ProgressBar } from '../components/ProgressBar';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { SkeletonTable } from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';
import { getCleanFilename } from '../utils/formatters';


export const Jobs: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Deletion Modal State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const toast = useToast();

  const parseDate = (d: string | null | undefined) => {
    if (!d) return 0;
    const time = new Date(d).getTime();
    return isNaN(time) ? 0 : time;
  };

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const data = await jobsApi.getJobs();
      const jobList = Array.isArray(data) ? data : [];
      const sortedJobs = jobList.sort(
        (a, b) => parseDate(b.created_at) - parseDate(a.created_at)
      );
      setJobs(sortedJobs);
    } catch (error) {
      console.error(error);
      toast.error('Failed to retrieve jobs list.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();

    const interval = setInterval(async () => {
      try {
        const data = await jobsApi.getJobs();
        const jobList = Array.isArray(data) ? data : [];
        const sortedJobs = jobList.sort(
          (a, b) => parseDate(b.created_at) - parseDate(a.created_at)
        );
        setJobs(sortedJobs);
      } catch (error) {
        // Silent error handling for background polls
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Filter Jobs when search term, status filter or jobs list updates
  useEffect(() => {
    let result = jobs;

    if (searchTerm) {
      result = result.filter((j) =>
        j.filename.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'PROCESSING') {
        result = result.filter((j) => j.status !== 'COMPLETED' && j.status !== 'FAILED');
      } else {
        result = result.filter((j) => j.status === statusFilter);
      }
    }

    setFilteredJobs(result);
  }, [searchTerm, statusFilter, jobs]);

  // Handle Deletion Confirmation
  const openDeleteDialog = (job: Job) => {
    setJobToDelete(job);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!jobToDelete) return;

    try {
      setIsDeleting(true);
      await jobsApi.deleteJob(jobToDelete.id);
      toast.success('Job deleted successfully.');
      setJobs((prev) => prev.filter((j) => j.id !== jobToDelete.id));
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete the transcription job.');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setJobToDelete(null);
    }
  };

  const handleRetryJob = async (jobToRetry: Job) => {
    try {
      toast.info(`Queuing retry for "${jobToRetry.filename}"...`);
      await jobsApi.retryJob(jobToRetry.id);
      toast.success('Job retry queued successfully!');
      fetchJobs();
    } catch (error) {
      console.error(error);
      toast.error('Failed to retry job. Original source file may be missing.');
    }
  };

  const handleDownload = async (type: 'pdf' | 'txt' | 'json', job: Job) => {
    try {
      const cleanName = getCleanFilename(job.filename);
      const baseName = cleanName.substring(0, cleanName.lastIndexOf('.')) || cleanName;
      const downloadName = `${baseName}_transcript.${type}`;
      
      toast.info(`Starting download for ${downloadName}...`);
      await jobsApi.downloadFile(type, job.id, downloadName);
      toast.success('File downloaded!');
    } catch (error) {
      console.error(error);
      toast.error(`Download failed. The ${type.toUpperCase()} file might not be ready or exists on the server.`);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (seconds === null || seconds === undefined) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-foreground">Transcription Runs</h2>
          <p className="text-xs font-semibold text-muted-foreground mt-0.5">Manage and download all your AI model transcriptions</p>
        </div>
        <Link
          to="/upload"
          className="inline-flex items-center justify-center px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-[1.02] active:scale-[0.98] rounded-2xl shadow-lg shadow-indigo-500/25 transition-all cursor-pointer text-center glow-primary"
        >
          New Upload
        </Link>
      </div>

      {/* Filters Card */}
      <div className="glass-card rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by filename..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 border border-border/80 bg-background/50 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors font-medium"
          />
        </div>

        {/* Filter dropdown */}
        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-48 px-3.5 py-2.5 border border-border/80 bg-background/50 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer font-bold text-foreground"
          >
            <option value="all">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="PROCESSING">Processing</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* Jobs Table Grid */}
      {isLoading ? (
        <SkeletonTable rows={5} />
      ) : filteredJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 glass-card rounded-3xl text-center">
          <FileText className="w-12 h-12 text-muted-foreground/40 mb-3" />
          <p className="text-base font-extrabold text-foreground">No matching transcription jobs found.</p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Try widening your search terms or filters.</p>
        </div>
      ) : (
        <div className="glass-card rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm select-none">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30 font-bold text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="p-4 pl-6">Filename</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Progress</th>
                  <th className="p-4">Language</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Created Time</th>
                  <th className="p-4 text-center pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredJobs.map((job) => {
                  const isFinished = job.status === 'COMPLETED';
                  const isProcessing = job.status !== 'COMPLETED' && job.status !== 'FAILED';

                  return (
                    <tr
                      key={job.id}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      {/* Filename */}
                      <td className="p-4 pl-6 font-bold text-foreground max-w-[220px] truncate" title={getCleanFilename(job.filename)}>
                        {getCleanFilename(job.filename)}
                      </td>

                      {/* Status badge */}
                      <td className="p-4">
                        <StatusBadge status={job.status} />
                      </td>

                      {/* Progress bar */}
                      <td className="p-4 min-w-[155px]">
                        {isProcessing ? (
                          <ProgressBar progress={job.progress} />
                        ) : (
                          <span className="text-xs text-muted-foreground font-semibold">
                            {job.status === 'COMPLETED' ? '100% completed' : 'Failed'}
                          </span>
                        )}
                      </td>


                      {/* Language */}
                      <td className="p-4 text-muted-foreground font-medium">
                        {job.language ? (
                          <span className="inline-flex items-center gap-1">
                            <Globe className="w-3.5 h-3.5" />
                            {job.language.toUpperCase()}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>

                      {/* Duration */}
                      <td className="p-4 text-muted-foreground font-mono">
                        {job.duration ? (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDuration(job.duration)}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>

                      {/* Created time */}
                      <td className="p-4 text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground/60" />
                          {formatDate(job.created_at)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Details page link */}
                          <Link
                            to={`/jobs/${job.id}`}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {/* Retry button for failed jobs */}
                          {job.status === 'FAILED' && (
                            <button
                              onClick={() => handleRetryJob(job)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 font-bold rounded-xl text-xs transition-all cursor-pointer border border-indigo-500/30 hover:scale-[1.02] active:scale-[0.98]"
                              title="Retry Job"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Retry</span>
                            </button>
                          )}

                          {/* Direct download selector */}
                          {isFinished ? (
                            <div className="relative group">
                              <button
                                className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-xl transition-colors cursor-pointer"
                                title="Download outputs"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              
                              {/* Hover drop menu */}
                              <div className="absolute right-0 bottom-full z-10 mb-1 hidden group-hover:block bg-card border border-border rounded-xl shadow-xl p-1.5 w-32 glass animate-in fade-in slide-in-from-bottom-2">
                                <button
                                  onClick={() => handleDownload('pdf', job)}
                                  className="w-full text-left px-2.5 py-1.5 text-xs font-semibold rounded-lg text-foreground hover:bg-muted transition-colors flex items-center gap-1.5 cursor-pointer"
                                >
                                  <FileDown className="w-3.5 h-3.5 text-rose-500" />
                                  PDF
                                </button>
                                <button
                                  onClick={() => handleDownload('txt', job)}
                                  className="w-full text-left px-2.5 py-1.5 text-xs font-semibold rounded-lg text-foreground hover:bg-muted transition-colors flex items-center gap-1.5 cursor-pointer"
                                >
                                  <FileDown className="w-3.5 h-3.5 text-blue-500" />
                                  TXT
                                </button>
                                <button
                                  onClick={() => handleDownload('json', job)}
                                  className="w-full text-left px-2.5 py-1.5 text-xs font-semibold rounded-lg text-foreground hover:bg-muted transition-colors flex items-center gap-1.5 cursor-pointer"
                                >
                                  <FileDown className="w-3.5 h-3.5 text-amber-500" />
                                  JSON
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              disabled
                              className="p-2 text-muted-foreground/30 cursor-not-allowed"
                              title="Downloads locked until completed"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete Action button */}
                          <button
                            onClick={() => openDeleteDialog(job)}
                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-muted rounded-xl transition-colors cursor-pointer"
                            title="Delete Job"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Transcription Job"
        message={`Are you sure you want to delete the job for "${jobToDelete?.filename}"? This action is permanent and will remove all transcription files from the server.`}
        confirmText="Delete Job"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </div>
  );
};
