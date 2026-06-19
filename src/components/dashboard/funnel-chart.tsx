"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FunnelEntry {
  stage: string;
  label: string;
  color: string;
  count: number;
  value: number;
}

interface FunnelChartProps {
  data: FunnelEntry[];
}

function formatCurrency(value: number) {
  if (value >= 1000) return `R$${(value / 1000).toFixed(0)}k`;
  return `R$${value}`;
}

interface TooltipPayloadItem {
  payload: FunnelEntry;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      className="rounded-lg px-4 py-3 text-sm shadow-xl"
      style={{ background: "#0D1B2E", border: `1px solid ${d.color}40`, color: "#F0F8FF" }}
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: d.color }}>
        {d.label}
      </p>
      <p style={{ color: "#8BACD4" }}>
        Negócios:{" "}
        <span style={{ color: "#F0F8FF", fontFamily: "'JetBrains Mono', monospace" }}>{d.count}</span>
      </p>
      <p style={{ color: "#8BACD4" }}>
        Valor:{" "}
        <span style={{ color: "#F0F8FF", fontFamily: "'JetBrains Mono', monospace" }}>
          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(d.value)}
        </span>
      </p>
    </div>
  );
}

export function FunnelChart({ data }: FunnelChartProps) {
  return (
    <Card className="border-0" style={{ background: "#0D1B2E", border: "1px solid #2A2A2E" }}>
      <CardHeader className="pb-2 pt-5 px-5">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#8BACD4" }}>
          Pipeline por Etapa
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-5 px-5">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }} barSize={36}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2E" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "#8BACD4", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: "#4A6785", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatCurrency}
              width={52}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.stage} fill={entry.color} opacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
          {data.map((entry) => (
            <div key={entry.stage} className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
              <span className="text-xs" style={{ color: "#8BACD4" }}>{entry.label}</span>
              <span className="text-xs font-semibold" style={{ color: entry.color, fontFamily: "'JetBrains Mono', monospace" }}>
                {entry.count}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
