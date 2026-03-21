import { alertsApi, type AlertItem } from "@/lib/alerts";

export const alertsQueryApi = {
  getInitial: async (): Promise<AlertItem[]> => {
    const page = await alertsApi.getAlerts(0, 50);
    return page.alerts;
  },
};
