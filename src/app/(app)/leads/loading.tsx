import { Skeleton } from "@/components/ui/skeleton";

export default function LeadsLoading() {
  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="space-y-1.5">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* Filters + button row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Skeleton className="h-9 w-full sm:w-64" />
          <Skeleton className="h-9 w-full sm:w-[160px]" />
          <Skeleton className="h-9 w-full sm:w-[180px]" />
        </div>
        <Skeleton className="h-9 w-full sm:w-28" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-lg border border-border overflow-hidden">
        {/* Header */}
        <div className="bg-muted/40 px-4 py-3 flex gap-4 border-b border-border">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20 hidden sm:block" />
          <Skeleton className="h-3 w-20 hidden md:block" />
          <Skeleton className="h-3 w-16" />
        </div>
        {/* Rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="px-4 py-3 flex items-center gap-4 border-b border-border last:border-0">
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="space-y-1.5 min-w-0">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-20 sm:hidden" />
              </div>
            </div>
            <Skeleton className="h-3.5 w-24 hidden sm:block" />
            <Skeleton className="h-3.5 w-20 hidden md:block" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-3.5 w-20 hidden lg:block" />
            <Skeleton className="h-3.5 w-20 hidden lg:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
