import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
  disabled?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  className,
  disabled
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn("relative w-full min-w-[140px]", className, isOpen ? "z-[100]" : "z-0")} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between w-full h-8 px-3 py-1.5 text-[11px] font-medium transition-all duration-200 border rounded-lg bg-background/50 border-border/50 hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
          isOpen && "border-primary/50 ring-2 ring-primary/20",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span className="truncate">{selectedOption?.label || 'Select...'}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 ml-2 transition-transform duration-200 opacity-60", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 overflow-hidden transition-all duration-200 border shadow-xl rounded-xl bg-background/95 backdrop-blur-md border-border/50 animate-in fade-in zoom-in-95">
          <div className="p-1 max-h-[200px] overflow-y-auto custom-scrollbar">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex items-center w-full px-2.5 py-1.5 text-[11px] font-medium transition-colors rounded-md text-left",
                  value === option.value 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-secondary/80 text-foreground"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
