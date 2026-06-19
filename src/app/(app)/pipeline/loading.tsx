import { Skeleton } from "@/components/ui/skeleton";

export default function PipelineLoading() {
  return (
    <div className="h-full flex flex-col gap-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-3 w-56" />
        </div>
        <Skeleton className="h-8 w-32 rounded-md" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 mb-4 shrink-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg border"
            style={{ backgroundColor: "#0D1B2E", borderColor: "#2A2A2E" }}
          >
            <Skeleton className="h-7 w-7 rounded-md shrink-0" />
            <div className="space-y-1.5 min-w-0">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="h-3.5 w-20" />
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <Skeleton className="h-1 w-full rounded-full mb-4 shrink-0" />

      {/* Kanban columns */}
      <div className="flex gap-3 flex-1 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="w-[272px] shrink-0 rounded-xl flex flex-col gap-2 p-3"
            style={{ backgroundColor: "#0D1B2E", border: "1px solid #2A2A2E" }}
          >
            {/* Column header */}
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-2 w-2 rounded-full" />
                <Skeleton className="h-3.5 w-24" />
              </div>
              <Skeleton className="h-5 w-8 rounded-full" />
            </div>
            {/* Cards */}
            {Array.from({ length: Math.max(1, 3 - i) }).map((_, j) => (
              <div
                key={j}
                className="rounded-lg p-3 space-y-2.5"
                style={{ backgroundColor: "#060B14", border: "1px solid #1E1E22" }}
              >
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex items-center justify-between pt-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
