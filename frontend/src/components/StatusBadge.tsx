import React from 'react';
import type { JobStatus } from '../types/job';


interface StatusBadgeProps {
  status: JobStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const getStatusConfig = (status: JobStatus) => {
    switch (status) {
      case 'QUEUED':
        return {
          label: 'Queued in Line',
          bgColor: 'bg-purple-500/10 dark:bg-purple-500/20',
          textColor: 'text-purple-600 dark:text-purple-400',
          borderColor: 'border-purple-500/20 dark:border-purple-500/30',
          dotColor: 'bg-purple-500',
          pulse: true,
        };
      case 'COMPLETED':
        return {
          label: 'Completed',
          bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/20',
          textColor: 'text-emerald-600 dark:text-emerald-400',
          borderColor: 'border-emerald-500/20 dark:border-emerald-500/30',
          dotColor: 'bg-emerald-500',
          pulse: false,
        };
      case 'FAILED':
        return {
          label: 'Failed',
          bgColor: 'bg-rose-500/10 dark:bg-rose-500/20',
          textColor: 'text-rose-600 dark:text-rose-400',
          borderColor: 'border-rose-500/20 dark:border-rose-500/30',
          dotColor: 'bg-rose-500',
          pulse: false,
        };
      case 'UPLOADED':
        return {
          label: 'Uploaded',
          bgColor: 'bg-blue-500/10 dark:bg-blue-500/20',
          textColor: 'text-blue-600 dark:text-blue-400',
          borderColor: 'border-blue-500/20 dark:border-blue-500/30',
          dotColor: 'bg-blue-500',
          pulse: true,
        };
      case 'EXTRACTING_AUDIO':
        return {
          label: 'Extracting Audio',
          bgColor: 'bg-blue-500/10 dark:bg-blue-500/20',
          textColor: 'text-blue-600 dark:text-blue-400',
          borderColor: 'border-blue-500/20 dark:border-blue-500/30',
          dotColor: 'bg-blue-500',
          pulse: true,
        };
      case 'DETECTING_SPEECH':
        return {
          label: 'Detecting Speech',
          bgColor: 'bg-blue-500/10 dark:bg-blue-500/20',
          textColor: 'text-blue-600 dark:text-blue-400',
          borderColor: 'border-blue-500/20 dark:border-blue-500/30',
          dotColor: 'bg-blue-500',
          pulse: true,
        };
      case 'TRANSCRIBING':
        return {
          label: 'Transcribing',
          bgColor: 'bg-indigo-500/10 dark:bg-indigo-500/20',
          textColor: 'text-indigo-600 dark:text-indigo-400',
          borderColor: 'border-indigo-500/20 dark:border-indigo-500/30',
          dotColor: 'bg-indigo-500',
          pulse: true,
        };
      case 'MERGING':
        return {
          label: 'Merging Transcripts',
          bgColor: 'bg-blue-500/10 dark:bg-blue-500/20',
          textColor: 'text-blue-600 dark:text-blue-400',
          borderColor: 'border-blue-500/20 dark:border-blue-500/30',
          dotColor: 'bg-blue-500',
          pulse: true,
        };
      case 'GENERATING_PDF':
        return {
          label: 'Generating PDF',
          bgColor: 'bg-blue-500/10 dark:bg-blue-500/20',
          textColor: 'text-blue-600 dark:text-blue-400',
          borderColor: 'border-blue-500/20 dark:border-blue-500/30',
          dotColor: 'bg-blue-500',
          pulse: true,
        };
      default:
        return {
          label: status,
          bgColor: 'bg-slate-500/10 dark:bg-slate-500/20',
          textColor: 'text-slate-600 dark:text-slate-400',
          borderColor: 'border-slate-500/20 dark:border-slate-500/30',
          dotColor: 'bg-slate-500',
          pulse: false,
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bgColor} ${config.textColor} ${config.borderColor} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${config.dotColor} ${
          config.pulse ? 'animate-pulse' : ''
        }`}
      />
      {config.label}
    </span>
  );
};
