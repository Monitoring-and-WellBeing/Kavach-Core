"use client";

import { AIInsight, AlertSeverity } from "@kavach/shared-types";
import { formatTime } from "@kavach/shared-utils";
import { X, Brain, Moon, TrendingUp, Eye, Lightbulb } from "lucide-react";
import { clsx } from "clsx";

interface InsightCardProps {
  insight: AIInsight;
  onDismiss: (id: string) => void;
}

const typeIcons: Record<AIInsight["type"], React.ReactNode> = {
  SPIKE: <TrendingUp className="w-5 h-5" />,
  LATE_NIGHT: <Moon className="w-5 h-5" />,
  UNUSUAL: <Eye className="w-5 h-5" />,
  WEEKEND_OVERUSE: <TrendingUp className="w-5 h-5" />,
  RECOMMENDATION: <Lightbulb className="w-5 h-5" />,
};

const riskColors: Record<AlertSeverity, { bg: string; text: string; border: string }> = {
  HIGH: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
  MODERATE: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20" },
  LOW: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20" },
};

export function InsightCard({ insight, onDismiss }: InsightCardProps) {
  const colors = riskColors[insight.riskLevel];

  return (
    <div className={clsx("p-5 rounded-2xl border", colors.bg, colors.border)}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center", colors.bg, colors.text)}>
            {typeIcons[insight.type]}
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">{insight.title}</h3>
            <span className={clsx("text-xs font-medium px-2 py-0.5 rounded-full border mt-0.5 inline-block", colors.bg, colors.text, colors.border)}>
              {insight.riskLevel} Risk
            </span>
          </div>
        </div>
        <button
          onClick={() => onDismiss(insight.id)}
          className="text-[#64748B] hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-sm text-[#94A3B8] leading-relaxed mb-3">{insight.description}</p>

      {insight.actionSuggested && (
        <div className="bg-[#0A0F1E]/60 rounded-xl p-3 border border-[#1E2A45]">
          <div className="flex items-start gap-2">
            <Brain className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-300">{insight.actionSuggested}</p>
          </div>
        </div>
      )}

      <p className="text-xs text-[#475569] mt-3">
        Generated {formatTime(insight.generatedAt)}
      </p>
    </div>
  );
}
