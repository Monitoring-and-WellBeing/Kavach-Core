import { useState } from "react";
import { AIInsight } from "@kavach/shared-types";
import { mockInsights } from "@/mock/insights";

export function useInsights() {
  const [insights, setInsights] = useState<AIInsight[]>(mockInsights);

  const dismissInsight = (id: string) => {
    setInsights((prev) => prev.filter((i) => i.id !== id));
  };

  return { insights, dismissInsight };
}
