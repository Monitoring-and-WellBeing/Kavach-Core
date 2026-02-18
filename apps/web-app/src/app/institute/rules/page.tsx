"use client";

import { useState } from "react";
import { useRules } from "@/hooks/useRules";
import { RuleCard } from "@/components/rules/RuleCard";
import { CreateRuleModal } from "@/components/rules/CreateRuleModal";
import { Button } from "@/components/ui/Button";
import { useUIStore } from "@/store/uiStore";
import { Plus } from "lucide-react";

export default function InstituteRulesPage() {
  const { rules, toggleRule, deleteRule, addRule } = useRules();
  const [createOpen, setCreateOpen] = useState(false);
  const addToast = useUIStore(s => s.addToast);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#64748B]">{rules.filter(r => r.status === "ACTIVE").length} active rules</p>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" />
          Create Global Rule
        </Button>
      </div>
      <div className="flex flex-col gap-3">
        {rules.map(rule => (
          <RuleCard
            key={rule.id}
            rule={rule}
            onToggle={(id) => { toggleRule(id); addToast({ title: "Rule updated", type: "success" }); }}
            onDelete={(id) => { deleteRule(id); addToast({ title: "Rule deleted", type: "info" }); }}
          />
        ))}
      </div>
      <CreateRuleModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={(rule) => { addRule(rule); addToast({ title: "Rule created!", type: "success" }); }}
      />
    </div>
  );
}
