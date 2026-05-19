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
import { MOCK_FUNNEL } from "@/lib/mock/metrics";

function formatCurrency(value: number) {
  if (value >= 1000) {
    return `R$${(value / 1000).toFixed(0)}k`;
  }
  return `R$${value}`;
}

interface TooltipPayloadItem {
  payload: {
    label: string;
    count: number;
    value: number;
    color: string;
  };
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      className="rounded-lg px-4 py-3 text-sm shadow-xl"
      style={{
        background: "#1A1A1E",
        border: `1px solid ${d.color}40`,
        color: "#E8E8E8",
      }}
    >
      <p
        className="mb-2 text-xs font-semibold uppercase tracking-wider"
        style={{ color: d.color }}
      >
        {d.label}
      </p>
      <p style={{ color: "#8A8A8F" }}>
        Negócios:{" "}
        <span style={{ color: "#E8E8E8", fontFamily: "'IBM Plex Mono', monospace" }}>
          {d.count}
        </span>
      </p>
      <p style={{ color: "#8A8A8F" }}>
        Valor:{" "}
        <span style={{ color: "#E8E8E8", fontFamily: "'IBM Plex Mono', monospace" }}>
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
            maximumFractionDigits: 0,
          }).format(d.value)}
        </span>
      </p>
    </div>
  );
}

export function FunnelChart() {
  return (
    <Card
      className="border-0"
      style={{ background: "#141416", border: "1px solid #2A2A2E" }}
    >
      <CardHeader className="pb-2 pt-5 px-5">
        <CardTitle
          className="text-sm font-semibold uppercase tracking-wider"
          style={{ color: "#8A8A8F" }}
        >
          Pipeline por Etapa
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-5 px-5">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={MOCK_FUNNEL}
            margin={{ top: 4, right: 4, left: -8, bottom: 0 }}
            barSize={36}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#2A2A2E"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fill: "#8A8A8F", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{
                fill: "#555559",
                fontSize: 10,
                fontFamily: "'IBM Plex Mono', monospace",
              }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatCurrency}
              width={52}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#FFFFFF08" }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {MOCK_FUNNEL.map((entry) => (
                <Cell key={entry.stage} fill={entry.color} opacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
          {MOCK_FUNNEL.map((entry) => (
            <div key={entry.stage} className="flex items-center gap-1.5">
              <div
                className="h-2 w-2 rounded-full"
                style={{ background: entry.color }}
              />
              <span className="text-xs" style={{ color: "#8A8A8F" }}>
                {entry.label}
              </span>
              <span
                className="text-xs font-semibold"
                style={{
                  color: entry.color,
                  fontFamily: "'IBM Plex Mono', monospace",
                }}
              >
                {entry.count}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
