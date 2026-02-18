import { useState, useEffect, useRef } from "react";

interface FocusState {
  active: boolean;
  deviceId: string | null;
  totalSeconds: number;
  elapsedSeconds: number;
  allowedApps: string[];
}

export function useFocusMode() {
  const [state, setState] = useState<FocusState>({
    active: false,
    deviceId: null,
    totalSeconds: 0,
    elapsedSeconds: 0,
    allowedApps: [],
  });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startFocus = (deviceId: string, durationMinutes: number, allowedApps: string[]) => {
    setState({
      active: true,
      deviceId,
      totalSeconds: durationMinutes * 60,
      elapsedSeconds: 0,
      allowedApps,
    });
  };

  const endFocus = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setState((s) => ({ ...s, active: false }));
  };

  useEffect(() => {
    if (state.active) {
      intervalRef.current = setInterval(() => {
        setState((s) => {
          if (s.elapsedSeconds >= s.totalSeconds) {
            clearInterval(intervalRef.current!);
            return { ...s, active: false };
          }
          return { ...s, elapsedSeconds: s.elapsedSeconds + 1 };
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.active]);

  const remaining = state.totalSeconds - state.elapsedSeconds;
  const progress = state.totalSeconds > 0 ? state.elapsedSeconds / state.totalSeconds : 0;

  return { ...state, remaining, progress, startFocus, endFocus };
}
