import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, className }) => {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      {/* Content */}
      <div className={cn(
        "relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-card border border-border shadow-2xl rounded-2xl animate-in zoom-in-95 fade-in duration-300 overflow-hidden",
        className
      )}>
        <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/10">
          <h3 className="text-lg font-bold truncate">{title}</h3>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-secondary rounded-full transition-colors"
            title="Close"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
};
