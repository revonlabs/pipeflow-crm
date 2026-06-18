import { Card, CardContent } from "@/components/ui/card";

interface LeadDealMetricCardProps {
  label: string;
  value: string;
  count: number;
  accentColor?: string;
}

export function LeadDealMetricCard({
  label,
  value,
  count,
  accentColor = "#CAFF33",
}: LeadDealMetricCardProps) {
  return (
    <Card
      className="relative overflow-hidden border-0"
      style={{ background: "#141416", border: "1px solid #2A2A2E" }}
    >
      <div
        className="absolute top-0 left-0 h-0.5 w-full"
        style={{ background: accentColor, opacity: 0.6 }}
      />
      <CardContent className="p-4">
        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "#8A8A8F" }}>
          {label}
        </p>
        <p
          className="mt-2 text-xl font-bold leading-none tracking-tight"
          style={{ color: "#E8E8E8", fontFamily: "'IBM Plex Mono', monospace" }}
        >
          {value}
        </p>
        <p className="mt-1.5 text-xs" style={{ color: "#555559" }}>
          {count} negocia{count === 1 ? "ção" : "ções"}
        </p>
      </CardContent>
    </Card>
  );
}
