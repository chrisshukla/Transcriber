import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Play,
  CheckCircle2,
  Upload,
  ChevronRight,
  TrendingUp,
  Clock,
  Globe,
  Sparkles,
} from 'lucide-react';
import { jobsApi } from '../api/jobs';
import type { Job } from '../types/job';
import { StatusBadge } from '../components/StatusBadge';
import { ProgressBar } from '../components/ProgressBar';
import { SkeletonTable } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../components/Toast';


export const Dashboard: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const data = await jobsApi.getJobs();
      // Sort jobs by created_at desc (latest first)
      const sortedJobs = data.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setJobs(sortedJobs);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load transcription jobs.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Calculate statistics
  const totalJobs = jobs.length;
  const completedJobs = jobs.filter((j) => j.status === 'COMPLETED').length;
  const failedJobs = jobs.filter((j) => j.status === 'FAILED').length;
  const processingJobs = totalJobs - completedJobs - failedJobs;

  const successRate =
    completedJobs + failedJobs > 0
      ? Math.round((completedJobs / (completedJobs + failedJobs)) * 100)
      : 100;

  const formatDuration = (seconds: number | null) => {
    if (seconds === null || seconds === undefined) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const recentJobs = jobs.slice(0, 5);

  return (
    <div className="space-y-12 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="relative p-8 md:p-12 rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-accent text-white shadow-xl shadow-primary/20 overflow-hidden">
        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white border border-white/10 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            AI Transcriptions Enabled
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Transcribe files with high precision AI
          </h2>
          <p className="text-sm md:text-base text-white/80 leading-relaxed font-medium">
            Upload audio or video files and convert them to TXT, PDF, or JSON transcripts instantly.
          </p>
          <div className="pt-4">
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary hover:bg-slate-50 hover:scale-[1.02] active:scale-[0.98] rounded-2xl text-sm font-bold shadow-lg shadow-black/10 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Quick Upload File
            </Link>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-12 translate-y-12 select-none pointer-events-none">
          <FileText className="w-80 h-80" />
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Jobs */}
        <div className="p-6 bg-card border border-border/80 rounded-2xl shadow-sm flex items-center gap-4 transition-all hover:shadow-md hover:border-primary/30 hover:-translate-y-1 duration-200">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Total Jobs
            </p>
            <h3 className="text-2xl font-black mt-0.5">{isLoading ? '-' : totalJobs}</h3>
          </div>
        </div>

        {/* Processing Jobs */}
        <div className="p-6 bg-card border border-border/80 rounded-2xl shadow-sm flex items-center gap-4 transition-all hover:shadow-md hover:border-blue-500/30 hover:-translate-y-1 duration-200">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
            <Play className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Processing
            </p>
            <h3 className="text-2xl font-black mt-0.5">{isLoading ? '-' : processingJobs}</h3>
          </div>
        </div>

        {/* Completed Jobs */}
        <div className="p-6 bg-card border border-border/80 rounded-2xl shadow-sm flex items-center gap-4 transition-all hover:shadow-md hover:border-emerald-500/30 hover:-translate-y-1 duration-200">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Completed
            </p>
            <h3 className="text-2xl font-black mt-0.5">{isLoading ? '-' : completedJobs}</h3>
          </div>
        </div>

        {/* Success Rate */}
        <div className="p-6 bg-card border border-border/80 rounded-2xl shadow-sm flex items-center gap-4 transition-all hover:shadow-md hover:border-purple-500/30 hover:-translate-y-1 duration-200">
          <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Success Rate
            </p>
            <h3 className="text-2xl font-black mt-0.5">
              {isLoading ? '-' : `${successRate}%`}
            </h3>
          </div>
        </div>
      </div>

      {/* Recent Jobs Sub-table Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold tracking-tight">Recent Transcription Jobs</h3>
            <p className="text-xs text-muted-foreground font-medium">Monitoring your latest AI model runs</p>
          </div>
          <Link
            to="/jobs"
            className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-foreground hover:underline transition-colors"
          >
            View All Jobs
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <SkeletonTable rows={3} />
        ) : recentJobs.length === 0 ? (
          <EmptyState
            title="No transcription jobs yet"
            description="You haven't uploaded any media files for transcription. Get started by clicking upload below!"
            actionText="Upload Audio/Video"
            actionLink="/upload"
          />
        ) : (
          <div className="overflow-hidden border border-border/80 rounded-2xl bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/20 font-semibold text-muted-foreground">
                    <th className="p-4">Filename</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Progress</th>
                    <th className="p-4">Language</th>
                    <th className="p-4">Duration</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {recentJobs.map((job) => (
                    <tr
                      key={job.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      <td className="p-4 font-semibold text-foreground max-w-xs truncate">
                        {job.filename}
                      </td>
                      <td className="p-4">
                        <StatusBadge status={job.status} />
                      </td>
                      <td className="p-4 min-w-[120px]">
                        {job.status !== 'COMPLETED' && job.status !== 'FAILED' ? (
                          <ProgressBar progress={job.progress} />
                        ) : (
                          <span className="text-xs text-muted-foreground font-medium">
                            {job.status === 'COMPLETED' ? '100% completed' : 'Failed'}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-muted-foreground font-medium">
                        {job.language ? (
                          <span className="flex items-center gap-1">
                            <Globe className="w-3.5 h-3.5" />
                            {job.language.toUpperCase()}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="p-4 text-muted-foreground font-mono">
                        {job.duration ? (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDuration(job.duration)}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          to={`/jobs/${job.id}`}
                          className="inline-flex items-center justify-center p-1.5 rounded-lg text-primary hover:bg-primary hover:text-white transition-all cursor-pointer"
                          title="View Job Details"
                        >
                          <ChevronRight className="w-4.5 h-4.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
