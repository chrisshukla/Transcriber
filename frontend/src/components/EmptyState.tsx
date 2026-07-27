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
    <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-border rounded-2xl bg-card/30 backdrop-blur-sm max-w-lg mx-auto mt-8">
      <div className="relative mb-4 flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 dark:bg-primary/5 text-primary border border-primary/20">
        <FileAudio className="w-8 h-8" />
        <div className="absolute -bottom-1 -right-1 bg-accent p-1 rounded-lg text-white border-2 border-background">
          <UploadCloud className="w-3.5 h-3.5" />
        </div>
      </div>
      <h3 className="text-lg font-bold text-foreground mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">{description}</p>
      {actionLink && actionText && (
        <Link
          to={actionLink}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] rounded-xl shadow-lg shadow-primary/20 transition-all cursor-pointer"
        >
          {actionText}
        </Link>
      )}
    </div>
  );
};
