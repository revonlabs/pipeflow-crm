"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: string;
  change: number;
  icon: ReactNode;
  accentColor?: string;
}

export function MetricCard({
  label,
  value,
  change,
  icon,
  accentColor = "#FF7043",
}: MetricCardProps) {
  const isPositive = change >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  const trendColor = isPositive ? "#3BFFA0" : "#4A6785";

  return (
    <Card
      className="relative overflow-hidden border-0"
      style={{ background: "#0D1B2E", border: "1px solid #2A2A2E" }}
    >
      <div
        className="absolute top-0 left-0 h-0.5 w-full"
        style={{ background: accentColor, opacity: 0.6 }}
      />
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p
              className="text-xs font-medium uppercase tracking-wider"
              style={{ color: "#8BACD4" }}
            >
              {label}
            </p>
            <p
              className="mt-2 text-2xl font-bold leading-none tracking-tight"
              style={{
                color: "#F0F8FF",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {value}
            </p>
          </div>
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ background: `${accentColor}14` }}
          >
            {icon}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-1.5">
          <TrendIcon className="h-3.5 w-3.5" style={{ color: trendColor }} />
          <span
            className="text-xs font-semibold"
            style={{
              color: trendColor,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {isPositive ? "+" : ""}
            {change}%
          </span>
          <span className="text-xs" style={{ color: "#4A6785" }}>
            vs. mês anterior
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
