import { clsx } from "clsx";
import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export function Card({ children, className, onClick, hover }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        "bg-[#0F1629] border border-[#1E2A45] rounded-2xl",
        hover && "hover:border-blue-500/50 transition-colors cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("px-6 pt-6 pb-4", className)}>{children}</div>
  );
}

export function CardContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={clsx("px-6 pb-6", className)}>{children}</div>;
}
