import { useState } from "react";
import { Rule, RuleStatus } from "@kavach/shared-types";
import { mockRules } from "@/mock/rules";

export function useRules() {
  const [rules, setRules] = useState<Rule[]>(mockRules);

  const toggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status:
                r.status === RuleStatus.ACTIVE
                  ? RuleStatus.PAUSED
                  : RuleStatus.ACTIVE,
            }
          : r
      )
    );
  };

  const deleteRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const addRule = (rule: Rule) => {
    setRules((prev) => [rule, ...prev]);
  };

  return { rules, toggleRule, deleteRule, addRule };
}
