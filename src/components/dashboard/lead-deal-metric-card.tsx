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
  accentColor = "#FF7043",
}: LeadDealMetricCardProps) {
  return (
    <Card
      className="relative overflow-hidden border-0"
      style={{ background: "#0D1B2E", border: "1px solid #2A2A2E" }}
    >
      <div
        className="absolute top-0 left-0 h-0.5 w-full"
        style={{ background: accentColor, opacity: 0.6 }}
      />
      <CardContent className="p-4">
        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "#8BACD4" }}>
          {label}
        </p>
        <p
          className="mt-2 text-xl font-bold leading-none tracking-tight"
          style={{ color: "#F0F8FF", fontFamily: "'JetBrains Mono', monospace" }}
        >
          {value}
        </p>
        <p className="mt-1.5 text-xs" style={{ color: "#4A6785" }}>
          {count} negocia{count === 1 ? "ção" : "ções"}
        </p>
      </CardContent>
    </Card>
  );
}
