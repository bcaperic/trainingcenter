import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { cn } from "./ui/utils";

interface FloatingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export function FloatingModal({
  open,
  onOpenChange,
  children,
  className,
}: FloatingModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "sm:max-w-3xl max-h-[85vh] overflow-y-auto",
          className,
        )}
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}

export {
  DialogHeader as FloatingModalHeader,
  DialogTitle as FloatingModalTitle,
  DialogDescription as FloatingModalDescription,
  DialogFooter as FloatingModalFooter,
};
