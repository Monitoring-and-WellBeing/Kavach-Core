"use client";

import { useState } from "react";
import { useRules } from "@/hooks/useRules";
import { RuleCard } from "@/components/rules/RuleCard";
import { CreateRuleModal } from "@/components/rules/CreateRuleModal";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useUIStore } from "@/store/uiStore";
import { Plus } from "lucide-react";

export default function RulesPage() {
  const { rules, toggleRule, deleteRule, addRule } = useRules();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const addToast = useUIStore((s) => s.addToast);

  const handleDelete = (id: string) => {
    deleteRule(id);
    setDeleteId(null);
    addToast({ title: "Rule deleted", type: "info" });
  };

  const handleToggle = (id: string) => {
    toggleRule(id);
    addToast({ title: "Rule updated", type: "success" });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#64748B]">{rules.length} rules configured</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" />
          Create Rule
        </Button>
      </div>

      {/* Rules List */}
      <div className="flex flex-col gap-3">
        {rules.map((rule) => (
          <RuleCard
            key={rule.id}
            rule={rule}
            onToggle={handleToggle}
            onDelete={(id) => setDeleteId(id)}
          />
        ))}
        {rules.length === 0 && (
          <div className="text-center py-16 text-[#64748B]">
            <p>No rules yet.</p>
            <Button className="mt-4" onClick={() => setCreateOpen(true)}>
              Create your first rule
            </Button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <CreateRuleModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={(rule) => {
          addRule(rule);
          addToast({ title: "Rule created!", type: "success" });
        }}
      />

      {/* Delete Confirmation */}
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Rule"
        size="sm"
      >
        <p className="text-[#94A3B8] mb-5">
          Are you sure you want to delete this rule? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setDeleteId(null)} className="flex-1">
            Cancel
          </Button>
          <Button variant="danger" onClick={() => handleDelete(deleteId!)} className="flex-1">
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
