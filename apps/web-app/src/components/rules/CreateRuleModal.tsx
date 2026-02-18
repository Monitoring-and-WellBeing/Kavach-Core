"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Rule, RuleType, RuleStatus } from "@kavach/shared-types";
import { WEEK_DAYS } from "@kavach/shared-constants";
import { clsx } from "clsx";

interface CreateRuleModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (rule: Rule) => void;
}

const ruleTypes = [
  { type: RuleType.CATEGORY_BLOCK, label: "Category Block", desc: "Block an entire category of apps" },
  { type: RuleType.APP_LIMIT, label: "App Time Limit", desc: "Limit daily usage of a specific app" },
  { type: RuleType.SCHEDULE_BLOCK, label: "Schedule Block", desc: "Block during specific time windows" },
  { type: RuleType.WEBSITE_BLOCK, label: "Website Block", desc: "Block specific websites or domains" },
];

export function CreateRuleModal({ open, onClose, onSave }: CreateRuleModalProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    type: RuleType.CATEGORY_BLOCK,
    name: "",
    target: "",
    limitMinutes: 30,
    scheduleStart: "09:00",
    scheduleEnd: "17:00",
    scheduleDays: ["MON", "TUE", "WED", "THU", "FRI"],
    autoBlock: true,
  });

  const handleSave = () => {
    const rule: Rule = {
      id: `rule-${Math.random().toString(36).slice(2)}`,
      name: form.name || `${form.type} Rule`,
      type: form.type,
      status: RuleStatus.ACTIVE,
      tenantId: "tenant-001",
      target: form.target,
      limitMinutes: form.type === RuleType.APP_LIMIT ? form.limitMinutes : undefined,
      scheduleStart: form.type === RuleType.SCHEDULE_BLOCK ? form.scheduleStart : undefined,
      scheduleEnd: form.type === RuleType.SCHEDULE_BLOCK ? form.scheduleEnd : undefined,
      scheduleDays: form.type === RuleType.SCHEDULE_BLOCK ? form.scheduleDays : undefined,
      autoBlock: form.autoBlock,
      createdAt: new Date().toISOString(),
    };
    onSave(rule);
    setStep(1);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Rule" size="md">
      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-6">
        {["Type", "Target", "Options"].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={clsx(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                step > i + 1
                  ? "bg-green-600 text-white"
                  : step === i + 1
                  ? "bg-blue-600 text-white"
                  : "bg-[#1E2A45] text-[#64748B]"
              )}
            >
              {i + 1}
            </div>
            <span className={clsx("text-xs", step === i + 1 ? "text-white" : "text-[#64748B]")}>
              {label}
            </span>
            {i < 2 && <div className="w-6 h-px bg-[#1E2A45]" />}
          </div>
        ))}
      </div>

      {/* Step 1: Type */}
      {step === 1 && (
        <div className="flex flex-col gap-3">
          {ruleTypes.map((rt) => (
            <button
              key={rt.type}
              onClick={() => setForm({ ...form, type: rt.type })}
              className={clsx(
                "text-left p-4 rounded-xl border transition-colors",
                form.type === rt.type
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-[#1E2A45] hover:border-[#2E3A55]"
              )}
            >
              <p className="text-sm font-semibold text-white">{rt.label}</p>
              <p className="text-xs text-[#64748B] mt-0.5">{rt.desc}</p>
            </button>
          ))}
          <Button onClick={() => setStep(2)} className="mt-2">
            Next: Target →
          </Button>
        </div>
      )}

      {/* Step 2: Target */}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-[#94A3B8] block mb-2">Rule Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Block Gaming Apps"
              className="w-full px-4 py-2.5 bg-[#0A0F1E] border border-[#1E2A45] rounded-lg text-white focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[#94A3B8] block mb-2">Target</label>
            <input
              value={form.target}
              onChange={(e) => setForm({ ...form, target: e.target.value })}
              placeholder={
                form.type === RuleType.CATEGORY_BLOCK
                  ? "e.g. GAMING"
                  : form.type === RuleType.WEBSITE_BLOCK
                  ? "e.g. youtube.com"
                  : "e.g. Free Fire"
              }
              className="w-full px-4 py-2.5 bg-[#0A0F1E] border border-[#1E2A45] rounded-lg text-white focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>
          {form.type === RuleType.APP_LIMIT && (
            <div>
              <label className="text-sm font-medium text-[#94A3B8] block mb-2">
                Daily Limit (minutes)
              </label>
              <input
                type="number"
                value={form.limitMinutes}
                onChange={(e) => setForm({ ...form, limitMinutes: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-[#0A0F1E] border border-[#1E2A45] rounded-lg text-white focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>
          )}
          {form.type === RuleType.SCHEDULE_BLOCK && (
            <>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-sm font-medium text-[#94A3B8] block mb-2">Start</label>
                  <input
                    type="time"
                    value={form.scheduleStart}
                    onChange={(e) => setForm({ ...form, scheduleStart: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0A0F1E] border border-[#1E2A45] rounded-lg text-white focus:outline-none focus:border-blue-500 text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-[#94A3B8] block mb-2">End</label>
                  <input
                    type="time"
                    value={form.scheduleEnd}
                    onChange={(e) => setForm({ ...form, scheduleEnd: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0A0F1E] border border-[#1E2A45] rounded-lg text-white focus:outline-none focus:border-blue-500 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-[#94A3B8] block mb-2">Days</label>
                <div className="flex gap-2 flex-wrap">
                  {WEEK_DAYS.map((day) => (
                    <button
                      key={day}
                      onClick={() => {
                        const days = form.scheduleDays.includes(day)
                          ? form.scheduleDays.filter((d) => d !== day)
                          : [...form.scheduleDays, day];
                        setForm({ ...form, scheduleDays: days });
                      }}
                      className={clsx(
                        "w-10 h-10 rounded-lg text-xs font-medium transition-colors",
                        form.scheduleDays.includes(day)
                          ? "bg-blue-600 text-white"
                          : "bg-[#1E2A45] text-[#64748B] hover:text-white"
                      )}
                    >
                      {day.slice(0, 2)}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          <div className="flex gap-3 mt-2">
            <Button variant="secondary" onClick={() => setStep(1)}>
              ← Back
            </Button>
            <Button onClick={() => setStep(3)} className="flex-1">
              Next: Options →
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Options */}
      {step === 3 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-4 bg-[#0A0F1E] rounded-xl border border-[#1E2A45]">
            <div>
              <p className="text-sm font-medium text-white">Auto-block</p>
              <p className="text-xs text-[#64748B]">
                Automatically block violations without requiring approval
              </p>
            </div>
            <button
              onClick={() => setForm({ ...form, autoBlock: !form.autoBlock })}
              className={clsx(
                "relative w-11 h-6 rounded-full transition-colors",
                form.autoBlock ? "bg-blue-600" : "bg-[#1E2A45]"
              )}
            >
              <span
                className={clsx(
                  "absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform",
                  form.autoBlock ? "translate-x-5.5" : "translate-x-0.5"
                )}
              />
            </button>
          </div>

          <div className="p-4 bg-[#0A0F1E] rounded-xl border border-[#1E2A45]">
            <p className="text-sm font-medium text-white mb-2">Rule Summary</p>
            <p className="text-xs text-[#64748B]">Name: <span className="text-[#94A3B8]">{form.name || "Unnamed"}</span></p>
            <p className="text-xs text-[#64748B]">Type: <span className="text-[#94A3B8]">{form.type}</span></p>
            <p className="text-xs text-[#64748B]">Target: <span className="text-[#94A3B8]">{form.target}</span></p>
          </div>

          <div className="flex gap-3 mt-2">
            <Button variant="secondary" onClick={() => setStep(2)}>
              ← Back
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Create Rule ✓
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
