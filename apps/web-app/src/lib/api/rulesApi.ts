import { api } from "@/lib/axios";
import type { Rule } from "@kavach/shared-types";

export const rulesQueryApi = {
  list: (tenantId: string): Promise<Rule[]> =>
    api.get<Rule[]>(`/rules?tenantId=${tenantId}`).then((r) => r.data),
  create: (rule: Omit<Rule, "id" | "createdAt">): Promise<Rule> =>
    api.post<Rule>("/rules", rule).then((r) => r.data),
  update: (id: string, patch: Partial<Rule>): Promise<Rule> =>
    api.put<Rule>(`/rules/${id}`, patch).then((r) => r.data),
  toggle: (id: string): Promise<Rule> => api.put<Rule>(`/rules/${id}/toggle`).then((r) => r.data),
  delete: (id: string): Promise<void> => api.delete(`/rules/${id}`).then(() => undefined),
};
