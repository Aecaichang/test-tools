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
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 p-4 bg-background/50 backdrop-blur-md border border-border/50 rounded-2xl shadow-xl shadow-primary/5">
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
              className="h-8 w-20 bg-transparent border-none p-0 focus-visible:ring-0 text-lg font-black"
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
                <span className="text-[10px] font-bold text-primary animate-pulse uppercase tracking-wider">Executing Loop...</span>
                <span className="text-sm font-black text-primary">{progress}%</span>
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
          variant="ghost"
          size="icon"
          onClick={onClear}
          disabled={isRunning}
          className="h-12 w-12 rounded-xl text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
          title="Clear Results"
        >
          <Trash2 className="w-5 h-5" />
        </Button>
        
        <Button
          onClick={onExecute}
          disabled={isRunning || !canExecute}
          className={cn(
            "h-12 px-8 rounded-xl font-bold transition-all duration-500 shadow-lg relative overflow-hidden group/btn",
            isRunning ? "bg-primary/20 text-primary" : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20"
          )}
        >
          {isRunning ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="tracking-tight uppercase">RUNNING</span>
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
