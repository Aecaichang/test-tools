import React from 'react';
import { Card, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Send, RotateCcw, Play, Zap, Repeat } from 'lucide-react';
import { ParsedCurl } from '../utils/curl-parser';
import { cn } from '@/lib/utils';

interface ExecutionControlsProps {
  loopCount: number;
  setLoopCount: (count: number) => void;
  isRunning: boolean;
  progress: number;
  executeLoop: () => void;
  parsedData: ParsedCurl | null;
}

export const ExecutionControls: React.FC<ExecutionControlsProps> = ({
  loopCount,
  setLoopCount,
  isRunning,
  progress,
  executeLoop,
  parsedData,
}) => {
  if (!parsedData) return null;

  return (
    <Card className="animate-in slide-in-from-bottom-8 duration-700 delay-150 shadow-2xl border-primary/20 relative z-10 rounded-[2rem] overflow-hidden bg-gradient-to-r from-primary/5 to-secondary/10">
      <CardContent className="p-8">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-8">
          <div className="flex-[0.8] space-y-3">
             <div className="flex items-center gap-2 px-1">
                <Repeat className="w-4 h-4 text-primary animate-spin-slow" />
                <p className="text-[10px] font-black text-muted-foreground uppercase opacity-70 tracking-widest">Iteration Count</p>
             </div>
             <div className="relative group">
               <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-transparent rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
               <Input
                 type="number"
                 min={1}
                 max={100}
                 value={loopCount}
                 onChange={(e) => setLoopCount(parseInt(e.target.value) || 1)}
                 className="h-14 bg-background border-border/40 text-xl font-black text-center focus:ring-primary/20 group-hover:border-primary/50 transition-all rounded-2xl shadow-inner italic"
               />
             </div>
          </div>

          <div className="flex-1 flex flex-col justify-end">
            <Button
              onClick={executeLoop}
              disabled={isRunning}
              className={cn(
                "h-14 w-full shadow-2xl transition-all font-black text-lg rounded-2xl relative overflow-hidden group/btn px-10",
                isRunning ? "bg-secondary text-primary cursor-wait" : "bg-primary text-primary-foreground hover:scale-[1.02] active:scale-[0.98] shadow-primary/30"
              )}
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
              
              <div className="relative flex items-center justify-center gap-3">
                {isRunning ? (
                  <>
                    <RotateCcw className="w-6 h-6 animate-spin" />
                    <span className="tracking-tighter italic">EXECUTING {progress}%</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-6 h-6 fill-current animate-pulse" />
                    <span className="tracking-tighter italic">IGNITE LOOP ENGINE</span>
                  </>
                )}
              </div>
            </Button>
            {!isRunning && (
              <p className="text-center mt-3 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest animate-pulse">
                Click to start high-speed iteration
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
