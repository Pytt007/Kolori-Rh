import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "primary";
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  variant = "primary",
}: ConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-6 bg-white border border-slate-100 rounded-3xl shadow-2xl sm:rounded-3xl">
        <DialogHeader className="flex flex-col items-center text-center gap-3">
          <div
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center border",
              variant === "destructive"
                ? "bg-red-50 border-red-100 text-accent animate-pulse"
                : "bg-blue-50 border-blue-100 text-primary",
            )}
          >
            {variant === "destructive" ? (
              <ShieldAlert className="h-6 w-6" />
            ) : (
              <Info className="h-6 w-6" />
            )}
          </div>
          <DialogTitle className="font-display italic text-2xl text-slate-900 mt-2">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 font-medium leading-relaxed max-w-sm mt-1">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4 sm:justify-center w-full">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-28 rounded-xl font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors h-10 order-2 sm:order-1"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={cn(
              "w-full sm:w-32 rounded-xl font-semibold text-white transition-all shadow-md active:scale-[0.98] h-10 order-1 sm:order-2",
              variant === "destructive"
                ? "bg-accent hover:bg-accent/90 hover:shadow-accent/20"
                : "bg-primary hover:bg-primary/90 hover:shadow-primary/20",
            )}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
