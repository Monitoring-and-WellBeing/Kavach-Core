"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle, X, AlertCircle, Info } from "lucide-react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
}

export function Toast({ message, type = "success", onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const icons = {
    success: <CheckCircle size={16} className="text-green-400" />,
    error: <AlertCircle size={16} className="text-red-400" />,
    info: <Info size={16} className="text-blue-400" />,
  };

  const borders = {
    success: "border-green-500",
    error: "border-red-500",
    info: "border-blue-500",
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 bg-gray-900 border ${
        borders[type]
      } rounded-xl px-4 py-3 shadow-2xl min-w-[280px] fade-up`}
    >
      {icons[type]}
      <span className="text-white text-sm flex-1">{message}</span>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-white transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "success") =>
      setToast({ message, type }),
    []
  );

  const hideToast = useCallback(() => setToast(null), []);

  return { toast, showToast, hideToast };
}
