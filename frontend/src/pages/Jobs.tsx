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
} from 'lucide-react';
import { jobsApi } from '../api/jobs';
import type { Job } from '../types/job';
import { StatusBadge } from '../components/StatusBadge';
import { ProgressBar } from '../components/ProgressBar';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { SkeletonTable } from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';


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

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const data = await jobsApi.getJobs();
      // Sort: newest first
      const sortedJobs = data.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
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

  const handleDownload = async (type: 'pdf' | 'txt' | 'json', job: Job) => {
    try {
      // Determine file extension
      const ext = type;
      // Get base original filename without its suffix to append download format
      const baseName = job.filename.substring(0, job.filename.lastIndexOf('.')) || job.filename;
      const downloadName = `${baseName}_transcript.${ext}`;
      
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
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-foreground">Transcription Jobs</h2>
          <p className="text-sm text-muted-foreground">Manage and download your AI transcriptions</p>
        </div>
        <Link
          to="/upload"
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary/95 hover:scale-[1.01] active:scale-[0.99] rounded-xl shadow-lg shadow-primary/20 transition-all cursor-pointer text-center"
        >
          New Upload
        </Link>
      </div>

      {/* Filters Card */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by filename..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border bg-background rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Filter dropdown */}
        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-48 px-3 py-2 border border-border bg-background rounded-xl text-sm focus:outline-none focus:border-primary transition-colors cursor-pointer"
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
        <div className="flex flex-col items-center justify-center p-12 bg-card border border-border rounded-3xl text-center">
          <FileText className="w-12 h-12 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-bold text-foreground">No matching transcription jobs found.</p>
          <p className="text-xs text-muted-foreground mt-0.5">Try widening your search terms or filters.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm select-none">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-muted-foreground font-semibold">
                  <th className="p-4">Filename</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Progress</th>
                  <th className="p-4">Language</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Created Time</th>
                  <th className="p-4 text-center">Actions</th>
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
                      <td className="p-4 font-semibold text-foreground max-w-[200px] truncate" title={job.filename}>
                        {job.filename}
                      </td>

                      {/* Status badge */}
                      <td className="p-4">
                        <StatusBadge status={job.status} />
                      </td>

                      {/* Progress bar */}
                      <td className="p-4 min-w-[145px]">
                        {isProcessing ? (
                          <ProgressBar progress={job.progress} />
                        ) : (
                          <span className="text-xs text-muted-foreground font-medium">
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
