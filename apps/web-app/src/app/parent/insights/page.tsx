"use client";

import { useState } from "react";
import { useInsights } from "@/hooks/useInsights";
import { InsightCard } from "@/components/insights/InsightCard";
import { AlertSeverity } from "@kavach/shared-types";
import { Brain } from "lucide-react";
import { clsx } from "clsx";

const riskFilters = ["All", "HIGH", "MODERATE", "LOW"] as const;

export default function InsightsPage() {
  const { insights, dismissInsight } = useInsights();
  const [filter, setFilter] = useState<string>("All");

  const filtered =
    filter === "All"
      ? insights
      : insights.filter((i) => i.riskLevel === filter);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
          <Brain className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">AI-Powered Insights</h2>
          <p className="text-sm text-[#64748B]">
            Behavioural patterns detected by KAVACH AI
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {riskFilters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              "px-4 py-1.5 rounded-full text-sm font-medium border transition-colors",
              filter === f
                ? "bg-blue-600 border-blue-600 text-white"
                : "border-[#1E2A45] text-[#64748B] hover:text-white"
            )}
          >
            {f}
          </button>
        ))}
        <span className="text-sm text-[#64748B] self-center ml-2">
          {filtered.length} insight{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((insight) => (
          <InsightCard key={insight.id} insight={insight} onDismiss={dismissInsight} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-16 text-[#64748B]">
            No insights for selected filter.
          </div>
        )}
      </div>
    </div>
  );
}
