import React from 'react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { 
  Play, 
  ChevronRight, 
  Loader2,
  Trash2,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExecutionControlsProps {
  loopCount: number;
  setLoopCount: (val: number) => void;
  onExecute: () => void;
  onClear: () => void;
  isRunning: boolean;
  progress: number;
  canExecute: boolean;
}

export const ExecutionControls: React.FC<ExecutionControlsProps> = ({
  loopCount,
  setLoopCount,
  onExecute,
  onClear,
  isRunning,
  progress,
  canExecute,
}) => {
  return (
    <div className="flex flex-col items-stretch gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:flex-row sm:items-center">
      <div className="flex items-center gap-3 px-2">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Zap className="w-4 h-4 fill-primary/20" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Iterations</span>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={100}
              value={loopCount}
              onChange={(e) => setLoopCount(parseInt(e.target.value) || 1)}
              className="h-8 w-20 border-none bg-transparent p-0 text-lg font-bold focus-visible:ring-0"
              disabled={isRunning}
            />
          </div>
        </div>
      </div>

      <div className="hidden sm:block w-px h-8 bg-border/50 mx-2" />

      <div className="flex-1 flex items-center gap-3">
        {isRunning ? (
          <div className="flex-1 space-y-2 px-2">
             <div className="flex justify-between items-end">
                <span className="animate-pulse text-[10px] font-semibold uppercase tracking-wider text-primary">Executing Loop...</span>
                <span className="text-sm font-bold text-primary">{progress}%</span>
             </div>
             <div className="h-1.5 w-full bg-primary/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300 shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                  style={{ width: `${progress}%` }}
                />
             </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center text-muted-foreground/40 italic text-xs px-2">
            {canExecute ? "Ready to launch sequence" : "Parse a CURL command to enable launch"}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={onClear}
          disabled={isRunning}
          className="h-11 min-w-11 rounded-xl border-destructive/20 p-0 text-muted-foreground/70 hover:bg-destructive/10 hover:text-destructive"
          title="Clear Results"
        >
          <Trash2 className="w-5 h-5" />
        </Button>
        
        <Button
          onClick={onExecute}
          disabled={isRunning || !canExecute}
          className={cn(
            "group/btn relative h-11 overflow-hidden rounded-xl px-6 text-sm font-semibold transition-all duration-300",
            isRunning ? "bg-primary/20 text-primary" : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          {isRunning ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="tracking-tight uppercase">Running</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Play className="w-5 h-5 fill-current" />
              <span className="tracking-tight uppercase">Execute</span>
              <ChevronRight className="w-4 h-4 opacity-0 -ml-2 group-hover/btn:opacity-100 group-hover/btn:ml-0 transition-all" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500" />
        </Button>
      </div>
    </div>
  );
};
