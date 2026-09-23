import React from 'react';
import { FileAudio, UploadCloud } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  actionLink?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No transcription jobs found',
  description = 'Upload an audio or video file to start transcribing with AI.',
  actionText = 'Upload File',
  actionLink = '/upload',
}) => {
  return (
    <div className="w-full flex flex-col items-center justify-center text-center p-10 md:p-14 border border-dashed border-border/80 rounded-3xl bg-card/80 backdrop-blur-md shadow-sm flex flex-col gap-5">
      <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
        <FileAudio className="w-8 h-8" />
        <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-indigo-600 to-purple-600 p-1.5 rounded-xl text-white shadow-md">
          <UploadCloud className="w-3.5 h-3.5" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5 max-w-md mx-auto">
        <h3 className="text-xl font-black text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground font-medium leading-relaxed">{description}</p>
      </div>
      {actionLink && actionText && (
        <div className="pt-2">
          <Link
            to={actionLink}
            className="inline-flex items-center justify-center px-6 py-3 text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-[1.02] active:scale-[0.98] rounded-2xl shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
          >
            {actionText}
          </Link>
        </div>
      )}
    </div>
  );
};

