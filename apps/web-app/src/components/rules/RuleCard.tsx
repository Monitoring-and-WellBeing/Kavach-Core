"use client";

import { Rule, RuleType, RuleStatus } from "@kavach/shared-types";
import { Toggle } from "@/components/ui/Toggle";
import { Button } from "@/components/ui/Button";
import { Trash2, Clock, Calendar, Tag } from "lucide-react";
import { clsx } from "clsx";
import { formatDate } from "@kavach/shared-utils";

interface RuleCardProps {
  rule: Rule;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const typeLabels: Record<RuleType, string> = {
  APP_LIMIT: "App Limit",
  SCHEDULE_BLOCK: "Schedule Block",
  CATEGORY_BLOCK: "Category Block",
  WEBSITE_BLOCK: "Website Block",
  FOCUS_MODE: "Focus Mode",
};

const typeColors: Record<RuleType, string> = {
  APP_LIMIT: "text-blue-400",
  SCHEDULE_BLOCK: "text-yellow-400",
  CATEGORY_BLOCK: "text-red-400",
  WEBSITE_BLOCK: "text-purple-400",
  FOCUS_MODE: "text-green-400",
};

export function RuleCard({ rule, onToggle, onDelete }: RuleCardProps) {
  const isActive = rule.status === RuleStatus.ACTIVE;

  return (
    <div className="bg-[#0F1629] border border-[#1E2A45] rounded-xl p-4 hover:border-[#2E3A55] transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={clsx("text-xs font-medium", typeColors[rule.type])}>
              {typeLabels[rule.type]}
            </span>
            {rule.autoBlock && (
              <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded-full">
                Auto-block
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-white">{rule.name}</h3>
          <p className="text-xs text-[#64748B] mt-1">
            Target: <span className="text-[#94A3B8]">{rule.target}</span>
          </p>

          {rule.limitMinutes && (
            <div className="flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3 text-[#64748B]" />
              <span className="text-xs text-[#64748B]">Limit: {rule.limitMinutes} min/day</span>
            </div>
          )}

          {rule.scheduleStart && (
            <div className="flex items-center gap-1 mt-1">
              <Calendar className="w-3 h-3 text-[#64748B]" />
              <span className="text-xs text-[#64748B]">
                {rule.scheduleStart} – {rule.scheduleEnd}
                {rule.scheduleDays && ` (${rule.scheduleDays.join(", ")})`}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Toggle checked={isActive} onChange={() => onToggle(rule.id)} size="sm" />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(rule.id)}
            className="text-red-400 hover:text-red-300"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-[#1E2A45] flex items-center justify-between">
        <span
          className={clsx(
            "text-xs font-medium px-2 py-0.5 rounded-full",
            isActive
              ? "bg-green-500/10 text-green-400"
              : "bg-gray-500/10 text-gray-400"
          )}
        >
          {rule.status}
        </span>
        <span className="text-xs text-[#475569]">
          Created {formatDate(rule.createdAt)}
        </span>
      </div>
    </div>
  );
}
