import * as React from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "primary";
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "destructive",
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} className="max-w-md">
      <div className="flex flex-col items-center text-center space-y-4 py-2">
        <div className={`p-3 rounded-full ${variant === 'destructive' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold">{title}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {description}
          </p>
        </div>
        <div className="flex items-center gap-3 w-full pt-4">
          <Button variant="ghost" onClick={onClose} className="flex-1 rounded-xl">
            {cancelText}
          </Button>
          <Button 
            variant={variant} 
            onClick={() => {
              onConfirm();
              onClose();
            }} 
            className="flex-1 rounded-xl shadow-lg"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
