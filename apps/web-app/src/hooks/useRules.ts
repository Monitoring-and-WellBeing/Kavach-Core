import { useState, useEffect, useCallback } from "react";
import { Rule, RuleStatus } from "@kavach/shared-types";
import { api } from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { useSSE } from "@/hooks/useSSE";

// ── API helpers ──────────────────────────────────────────────────────────────

const rulesApi = {
  list: (tenantId: string) =>
    api.get<Rule[]>(`/rules?tenantId=${tenantId}`).then(r => r.data),

  create: (rule: Omit<Rule, "id" | "createdAt">) =>
    api.post<Rule>("/rules", rule).then(r => r.data),

  update: (id: string, patch: Partial<Rule>) =>
    api.put<Rule>(`/rules/${id}`, patch).then(r => r.data),

  toggle: (id: string) =>
    api.put<Rule>(`/rules/${id}/toggle`).then(r => r.data),

  delete: (id: string) =>
    api.delete(`/rules/${id}`),
};

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useRules() {
  const { user } = useAuth();
  const [rules, setRules]   = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.tenantId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await rulesApi.list(user.tenantId);
      setRules(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load rules");
    } finally {
      setLoading(false);
    }
  }, [user?.tenantId]);

  useEffect(() => { load(); }, [load]);

  // ── SSE: re-fetch when a rules_updated event arrives ──────────────────────
  const handleRulesUpdated = useCallback(() => { load(); }, [load]);
  useSSE("/api/v1/sse/tenant", { rules_updated: handleRulesUpdated });

  // ── Mutations ─────────────────────────────────────────────────────────────

  const toggleRule = useCallback(async (id: string) => {
    // Optimistic update
    setRules(prev =>
      prev.map(r =>
        r.id === id
          ? { ...r, status: r.status === RuleStatus.ACTIVE ? RuleStatus.PAUSED : RuleStatus.ACTIVE }
          : r
      )
    );
    try {
      const updated = await rulesApi.toggle(id);
      setRules(prev => prev.map(r => r.id === id ? updated : r));
    } catch {
      // Roll back on error
      load();
    }
  }, [load]);

  const deleteRule = useCallback(async (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
    try {
      await rulesApi.delete(id);
    } catch {
      load();
    }
  }, [load]);

  const addRule = useCallback(async (rule: Rule) => {
    setRules(prev => [rule, ...prev]);
    try {
      const created = await rulesApi.create({
        name: rule.name,
        type: rule.type,
        status: rule.status,
        tenantId: user?.tenantId ?? rule.tenantId,
        target: rule.target,
        limitMinutes: rule.limitMinutes,
        scheduleStart: rule.scheduleStart,
        scheduleEnd: rule.scheduleEnd,
        scheduleDays: rule.scheduleDays,
        autoBlock: rule.autoBlock,
      });
      setRules(prev => prev.map(r => r.id === rule.id ? created : r));
    } catch {
      load();
    }
  }, [user?.tenantId, load]);

  return { rules, loading, error, toggleRule, deleteRule, addRule, refetch: load };
}
