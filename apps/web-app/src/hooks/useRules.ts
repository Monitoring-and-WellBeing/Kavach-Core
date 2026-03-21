import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Rule, RuleStatus } from "@kavach/shared-types";
import { useAuth } from "@/context/AuthContext";
import { useSSE } from "@/hooks/useSSE";
import { rulesQueryApi } from "@/lib/api/rulesApi";

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useRules() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["rules", user?.tenantId];
  const query = useQuery({
    queryKey,
    queryFn: () => rulesQueryApi.list(user?.tenantId as string),
    enabled: Boolean(user?.tenantId),
    staleTime: 5 * 60 * 1000,
    // GAP-16 FIXED
  });

  // ── SSE: re-fetch when a rules_updated event arrives ──────────────────────
  const handleRulesUpdated = (): void => {
    void query.refetch();
  };
  useSSE("/api/v1/sse/tenant", { rules_updated: handleRulesUpdated });

  // ── Mutations ─────────────────────────────────────────────────────────────

  const toggleRule = useMutation({
    mutationFn: (id: string) => rulesQueryApi.toggle(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Rule[]>(queryKey) ?? [];
      queryClient.setQueryData<Rule[]>(queryKey, (prev = []) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status: r.status === RuleStatus.ACTIVE ? RuleStatus.PAUSED : RuleStatus.ACTIVE }
            : r
        )
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(queryKey, context?.previous ?? []);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<Rule[]>(queryKey, (prev = []) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );
    },
  });

  const deleteRule = useMutation({
    mutationFn: (id: string) => rulesQueryApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Rule[]>(queryKey) ?? [];
      queryClient.setQueryData<Rule[]>(queryKey, (prev = []) => prev.filter((r) => r.id !== id));
      return { previous };
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(queryKey, context?.previous ?? []);
    },
  });

  const addRule = useMutation({
    mutationFn: async (rule: Rule) =>
      rulesQueryApi.create({
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
      }),
    onSuccess: (created) => {
      queryClient.setQueryData<Rule[]>(queryKey, (prev = []) => [created, ...prev]);
    },
  });

  return {
    rules: query.data ?? [],
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    toggleRule: (id: string) => toggleRule.mutateAsync(id),
    deleteRule: (id: string) => deleteRule.mutateAsync(id),
    addRule: (rule: Rule) => addRule.mutateAsync(rule),
    refetch: () => { void query.refetch(); },
  };
}
