import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Spinner = ({ size = 'md', className }: SpinnerProps) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  };
  return (
    <Loader2 className={cn('animate-spin text-muted-foreground', sizes[size], className)} />
  );
};


export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn('animate-pulse rounded-md bg-muted', className)} />
);

// ── Page Loader (full screen)
interface PageLoaderProps {
  message?: string;
  subMessage?: string;
}

export const PageLoader = ({
  message = 'Loading…',
  subMessage = 'Please wait',
}: PageLoaderProps) => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center space-y-3">
      <Spinner size="lg" className="mx-auto text-primary" />
      <p className="text-sm font-medium text-foreground">{message}</p>
      <p className="text-xs text-muted-foreground">{subMessage}</p>
    </div>
  </div>
);

// ── Page Skeleton (dashboard layout) 
export const PageSkeleton = () => (
  <div className="min-h-screen bg-background p-6 space-y-4">
    {/* Stat cards */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-card rounded-xl border border-border p-4 space-y-3">
          <Skeleton className="h-3 w-3/5" />
          <Skeleton className="h-6 w-2/5" />
          <Skeleton className="h-2 w-4/5" />
        </div>
      ))}
    </div>
    {/* Table card */}
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      <Skeleton className="h-4 w-1/4" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-3 flex-[2]" />
            <Skeleton className="h-3 flex-1" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ── Inline Loader (inside card/table) 
interface InlineLoaderProps {
  message?: string;
  className?: string;
}

export const InlineLoader = ({
  message = 'Loading…',
  className,
}: InlineLoaderProps) => (
  <div className={cn('flex items-center justify-center gap-2 py-8', className)}>
    <Spinner size="sm" />
    <span className="text-sm text-muted-foreground">{message}</span>
  </div>
);

// ── Button Spinner (use inside shadcn Button) 
export const ButtonSpinner = ({ className }: { className?: string }) => (
  <Loader2 className={cn('w-4 h-4 animate-spin', className)} />
);

// ── Guest Handbook Loader (digital handbook page) 
export const GuestHandbookLoader = () => (
  <div className="min-h-screen bg-[#f0f2f5] flex flex-col font-sans">

    {/* Nav */}
    <nav className="h-14 bg-white border-b border-border flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        Digital Handbook
      </div>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </nav>

    {/* Body */}
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-[500px]">

        {/* Gradient accent bar */}
        <div className="h-1 rounded-t-xl bg-gradient-to-r from-sky-400 via-indigo-500 via-pink-500 via-amber-400 to-lime-400" />

        {/* Card */}
        <div className="bg-white rounded-b-xl shadow-sm border border-t-0 border-border px-10 py-12 text-center">

          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center mx-auto mb-6">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>

          <p className="text-[11px] font-semibold tracking-widest uppercase text-sky-400 mb-2">
            Digital Handbook
          </p>
          <p className="text-xl font-bold text-foreground mb-2">Loading your handbook…</p>
          <p className="text-sm text-muted-foreground mb-8">
            Please wait while we verify your access
          </p>

          {/* Shimmer rows */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            {[
              { color: 'bg-sky-300',    w: 'w-full',  delay: '[animation-delay:0ms]' },
              { color: 'bg-sky-200',    w: 'w-3/4',   delay: '[animation-delay:150ms]' },
              { color: 'bg-indigo-200', w: 'w-3/5',   delay: '[animation-delay:300ms]' },
            ].map((row, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={cn('w-2 h-2 rounded-full shrink-0 animate-pulse', row.color, row.delay)} />
                <div className="flex-1 h-2.5 rounded-full bg-slate-200 overflow-hidden">
                  <div className={cn(
                    'h-full rounded-full animate-pulse bg-slate-300',
                    row.w, row.delay
                  )} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span>Digital Handbook</span>
          <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
          <span>Guest Access</span>
          <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
          <span>Secure Link Required</span>
        </div>
      </div>
    </div>
  </div>
);