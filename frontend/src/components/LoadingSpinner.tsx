import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
  label,
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 p-4 ${className}`}>
      <div
        className={`rounded-full border-t-transparent border-primary animate-spin ${sizeClasses[size]}`}
      />
      {label && <p className="text-sm font-medium text-muted-foreground animate-pulse">{label}</p>}
    </div>
  );
};

export const SkeletonRow: React.FC = () => (
  <tr className="animate-pulse border-b border-border/50">
    <td className="p-4"><div className="h-4 bg-muted rounded w-2/3" /></td>
    <td className="p-4"><div className="h-6 bg-muted rounded-full w-20" /></td>
    <td className="p-4"><div className="h-2 bg-muted rounded w-full" /></td>
    <td className="p-4"><div className="h-4 bg-muted rounded w-12" /></td>
    <td className="p-4"><div className="h-4 bg-muted rounded w-16" /></td>
    <td className="p-4"><div className="h-4 bg-muted rounded w-28" /></td>
    <td className="p-4"><div className="h-8 bg-muted rounded w-16" /></td>
  </tr>
);

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="w-full overflow-hidden border border-border rounded-2xl bg-card">
      <div className="p-4 border-b border-border bg-muted/20">
        <div className="h-6 bg-muted rounded w-1/4 animate-pulse" />
      </div>
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-border bg-muted/10">
            <th className="p-4"><div className="h-4 bg-muted rounded w-1/2" /></th>
            <th className="p-4"><div className="h-4 bg-muted rounded w-1/3" /></th>
            <th className="p-4"><div className="h-4 bg-muted rounded w-1/2" /></th>
            <th className="p-4"><div className="h-4 bg-muted rounded w-1/4" /></th>
            <th className="p-4"><div className="h-4 bg-muted rounded w-1/4" /></th>
            <th className="p-4"><div className="h-4 bg-muted rounded w-1/3" /></th>
            <th className="p-4"><div className="h-4 bg-muted rounded w-1/3" /></th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, idx) => (
            <SkeletonRow key={idx} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-6 border border-border rounded-2xl bg-card animate-pulse flex flex-col gap-4 ${className}`}>
    <div className="flex justify-between items-center">
      <div className="h-5 bg-muted rounded w-1/3" />
      <div className="h-8 bg-muted rounded-full w-24" />
    </div>
    <div className="flex flex-col gap-2">
      <div className="h-2 bg-muted rounded w-full" />
      <div className="h-2 bg-muted rounded w-5/6" />
    </div>
    <div className="flex gap-4 pt-2">
      <div className="h-10 bg-muted rounded-xl w-full" />
      <div className="h-10 bg-muted rounded-xl w-full" />
    </div>
  </div>
);
