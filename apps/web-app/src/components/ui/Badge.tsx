import { clsx } from "clsx";

interface BadgeProps {
  label: string;
  color?: "blue" | "green" | "red" | "yellow" | "purple" | "gray";
  size?: "sm" | "md";
}

export function Badge({ label, color = "blue", size = "sm" }: BadgeProps) {
  const colors = {
    blue: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    green: "bg-green-500/15 text-green-400 border-green-500/30",
    red: "bg-red-500/15 text-red-400 border-red-500/30",
    yellow: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    purple: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    gray: "bg-gray-500/15 text-gray-400 border-gray-500/30",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center font-medium rounded-full border",
        colors[color],
        size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1"
      )}
    >
      {label}
    </span>
  );
}
