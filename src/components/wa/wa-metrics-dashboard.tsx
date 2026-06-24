"use client";

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Users,
  AlertTriangle,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/metric-card";
import type { WaMetricsDailyRow } from "@/lib/actions/wa-metrics";

interface WaMetricsDashboardProps {
  rows: WaMetricsDailyRow[];
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

interface TooltipPayloadItem {
  payload: WaMetricsDailyRow;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      className="rounded-lg px-4 py-3 text-sm shadow-xl"
      style={{ background: "#0D1B2E", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F8FF" }}
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#8BACD4" }}>
        {formatDateLabel(d.date)}
      </p>
      <p style={{ color: "#3BFFA0" }}>
        Recebidas: <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{d.totalIn}</span>
      </p>
      <p style={{ color: "#4A90E2" }}>
        Enviadas: <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{d.totalOut}</span>
      </p>
    </div>
  );
}

export function WaMetricsDashboard({ rows }: WaMetricsDashboardProps) {
  const totals = rows.reduce(
    (acc, row) => ({
      totalIn: acc.totalIn + row.totalIn,
      totalOut: acc.totalOut + row.totalOut,
      uniqueContacts: acc.uniqueContacts + row.uniqueContacts,
      conversationsUnanswered1h: acc.conversationsUnanswered1h + row.conversationsUnanswered1h,
    }),
    { totalIn: 0, totalOut: 0, uniqueContacts: 0, conversationsUnanswered1h: 0 }
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Mensagens recebidas"
          value={String(totals.totalIn)}
          change={0}
          icon={<ArrowDownToLine className="h-5 w-5" style={{ color: "#3BFFA0" }} />}
          accentColor="#3BFFA0"
        />
        <MetricCard
          label="Mensagens enviadas"
          value={String(totals.totalOut)}
          change={0}
          icon={<ArrowUpFromLine className="h-5 w-5" style={{ color: "#4A90E2" }} />}
          accentColor="#4A90E2"
        />
        <MetricCard
          label="Contatos únicos"
          value={String(totals.uniqueContacts)}
          change={0}
          icon={<Users className="h-5 w-5" style={{ color: "#FF7043" }} />}
          accentColor="#FF7043"
        />
        <MetricCard
          label="Sem resposta há 1h+"
          value={String(totals.conversationsUnanswered1h)}
          change={0}
          icon={<AlertTriangle className="h-5 w-5" style={{ color: "#FFAB40" }} />}
          accentColor="#FFAB40"
        />
      </div>

      <Card className="border-0" style={{ background: "#0D1B2E", border: "1px solid #2A2A2E" }}>
        <CardHeader className="pb-2 pt-5 px-5">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#8BACD4" }}>
            Volume de mensagens (últimos 30 dias)
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-5 px-5">
          {rows.length === 0 ? (
            <p className="py-12 text-center text-sm" style={{ color: "#4A6785" }}>
              Sem dados ainda — a agregação roda a cada hora.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={rows} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2E" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateLabel}
                  tick={{ fill: "#8BACD4", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#4A6785", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.1)" }} />
                <Line type="monotone" dataKey="totalIn" stroke="#3BFFA0" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="totalOut" stroke="#4A90E2" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
