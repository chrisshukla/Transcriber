import React from 'react';

interface ProgressBarProps {
  progress: number;
  className?: string;
  showText?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  className = '',
  showText = false,
}) => {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-1 text-xs font-medium text-muted-foreground">
        {showText && (
          <>
            <span>Processing</span>
            <span className="font-mono">{clampedProgress}%</span>
          </>
        )}
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden border border-border/20">
        <div
          className={`h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};
