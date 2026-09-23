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
import { getCleanFilename } from '../utils/formatters';

export const Dashboard: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
      toast.error('Failed to load transcription jobs.');
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
    <div className="flex flex-col gap-8 w-full animate-in fade-in duration-300">
      {/* Welcome Hero Banner */}
      <div className="relative w-full p-8 md:p-12 rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-cyan-600 text-white shadow-2xl shadow-indigo-500/20 overflow-hidden border border-white/15">
        {/* Background decorative glow circles */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-5 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black bg-white/15 text-white border border-white/25 backdrop-blur-md w-fit shadow-sm">
            <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
            Sequential Queueing & Whisper Large-v3
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            Transcribe files with peak AI precision
          </h2>
          <p className="text-sm md:text-base text-white/90 leading-relaxed font-medium">
            Upload long seminars, audio or video files and generate PDF, TXT, or JSON transcripts cleanly.
          </p>
          <div className="pt-2">
            <Link
              to="/upload"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-white text-indigo-700 hover:bg-slate-100 hover:scale-[1.02] active:scale-[0.98] rounded-2xl text-xs font-black uppercase tracking-wider shadow-xl shadow-black/20 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Upload New File
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        {/* Total Jobs */}
        <div className="p-6 bg-card border border-border/80 rounded-3xl shadow-sm flex items-center gap-4.5 transition-all hover:scale-[1.02] duration-200">
          <div className="p-4 bg-indigo-500/10 text-indigo-500 rounded-2xl border border-indigo-500/20 flex-shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest">
              Total Jobs
            </p>
            <h3 className="text-3xl font-black mt-0.5 tracking-tight text-foreground">{isLoading ? '-' : totalJobs}</h3>
          </div>
        </div>

        {/* Processing Jobs */}
        <div className="p-6 bg-card border border-border/80 rounded-3xl shadow-sm flex items-center gap-4.5 transition-all hover:scale-[1.02] duration-200">
          <div className="p-4 bg-cyan-500/10 text-cyan-500 rounded-2xl border border-cyan-500/20 flex-shrink-0">
            <Play className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest">
              Processing
            </p>
            <h3 className="text-3xl font-black mt-0.5 tracking-tight text-foreground">{isLoading ? '-' : processingJobs}</h3>
          </div>
        </div>

        {/* Completed Jobs */}
        <div className="p-6 bg-card border border-border/80 rounded-3xl shadow-sm flex items-center gap-4.5 transition-all hover:scale-[1.02] duration-200">
          <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl border border-emerald-500/20 flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest">
              Completed
            </p>
            <h3 className="text-3xl font-black mt-0.5 tracking-tight text-foreground">{isLoading ? '-' : completedJobs}</h3>
          </div>
        </div>

        {/* Success Rate */}
        <div className="p-6 bg-card border border-border/80 rounded-3xl shadow-sm flex items-center gap-4.5 transition-all hover:scale-[1.02] duration-200">
          <div className="p-4 bg-purple-500/10 text-purple-500 rounded-2xl border border-purple-500/20 flex-shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest">
              Success Rate
            </p>
            <h3 className="text-3xl font-black mt-0.5 tracking-tight text-foreground">
              {isLoading ? '-' : `${successRate}%`}
            </h3>
          </div>
        </div>
      </div>

      {/* Recent Jobs Table Section */}
      <div className="flex flex-col gap-4 w-full pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black tracking-tight">Recent Transcription Runs</h3>
            <p className="text-xs text-muted-foreground font-semibold mt-0.5">Live background queue monitor</p>
          </div>
          <Link
            to="/jobs"
            className="flex items-center gap-1.5 text-xs font-extrabold text-primary hover:text-indigo-400 transition-colors uppercase tracking-wider"
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
          <div className="glass-card rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm select-none">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30 font-bold text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="p-4 pl-6">Filename</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Progress</th>
                    <th className="p-4">Language</th>
                    <th className="p-4">Duration</th>
                    <th className="p-4 pr-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {recentJobs.map((job) => (
                    <tr
                      key={job.id}
                      className="hover:bg-muted/20 transition-colors group"
                    >
                      <td className="p-4 pl-6 font-bold text-foreground max-w-xs truncate" title={getCleanFilename(job.filename)}>
                        {getCleanFilename(job.filename)}
                      </td>
                      <td className="p-4">
                        <StatusBadge status={job.status} />
                      </td>
                      <td className="p-4 min-w-[140px]">
                        {job.status !== 'COMPLETED' && job.status !== 'FAILED' ? (
                          <ProgressBar progress={job.progress} />
                        ) : (
                          <span className="text-xs text-muted-foreground font-semibold">
                            {job.status === 'COMPLETED' ? '100% completed' : 'Failed'}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-muted-foreground font-semibold">
                        {job.language ? (
                          <span className="inline-flex items-center gap-1">
                            <Globe className="w-3.5 h-3.5" />
                            {job.language.toUpperCase()}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
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
                      <td className="p-4 pr-6 text-right">
                        <Link
                          to={`/jobs/${job.id}`}
                          className="inline-flex items-center justify-center p-2 rounded-xl text-primary hover:bg-primary hover:text-white transition-all cursor-pointer"
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
