import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Send, RotateCcw, Play } from 'lucide-react';
import { ParsedCurl } from '../utils/curl-parser';

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
    <Card className="animate-in slide-in-from-bottom-5 duration-500 delay-150 shadow-sm border-border/50 relative z-10">
      <CardHeader className="shrink-0 pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Send className="w-4 h-4 text-primary" />
          Execution Controls
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="flex-1 space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">Loop Count</p>
            <Input
              type="number"
              min={1}
              max={100}
              value={loopCount}
              onChange={(e) => setLoopCount(parseInt(e.target.value) || 1)}
              className="h-9 bg-secondary/20"
            />
          </div>
          <Button
            onClick={executeLoop}
            disabled={isRunning}
            className="flex-[1.5] mt-auto h-9 shadow-md shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {isRunning ? (
              <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            {isRunning ? `Running ${progress}%` : "Run Loop"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
