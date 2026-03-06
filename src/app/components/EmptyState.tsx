import { type LucideIcon } from "lucide-react";
import { Button } from "./ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="size-10 rounded-lg bg-muted/60 flex items-center justify-center mb-3">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <p className="text-sm text-foreground" style={{ fontWeight: 500 }}>
        {title}
      </p>
      <p className="text-xs text-muted-foreground mt-1 text-center max-w-xs">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button size="sm" className="mt-3 h-7 text-xs" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
