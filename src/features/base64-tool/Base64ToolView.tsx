import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/common/Card';
import { QuickStartCard } from '@/components/common/QuickStartCard';
import { Button } from '@/components/common/Button';
import { Textarea } from '@/components/common/Textarea';
import { 
  ArrowLeftRight, 
  Copy, 
  Check, 
  Trash2, 
  Lock, 
  Unlock,
  RefreshCw,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

export const Base64ToolView: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [copied, setCopied] = useState(false);

  const processText = (text: string, currentMode: 'encode' | 'decode') => {
    if (!text.trim()) {
      setOutput('');
      return;
    }

    try {
      if (currentMode === 'encode') {
        const encoded = btoa(unescape(encodeURIComponent(text)));
        setOutput(encoded);
      } else {
        const decoded = decodeURIComponent(escape(atob(text)));
        setOutput(decoded);
      }
    } catch {
      setOutput('Error: Invalid input for chosen mode');
    }
  };

  useEffect(() => {
    processText(input, mode);
  }, [input, mode]);

  const toggleMode = () => {
    const prevInput = input
    const prevOutput = output && !output.startsWith('Error:') ? output : ''
    setMode(prev => prev === 'encode' ? 'decode' : 'encode')
    if (prevOutput) {
      setInput(prevOutput)
    }
  }

  const copyToClipboard = () => {
    if (!output || output.startsWith('Error:')) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };

  const clearAll = () => {
    setInput('');
    setOutput('');
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 max-w-6xl animate-in fade-in duration-700">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Base64 Encoder / Decoder
        </h1>
        <p className="text-muted-foreground font-medium">เข้ารหัสและถอดรหัสข้อความเป็นรูปแบบ Base64 อย่างรวดเร็วและปลอดภัย</p>
      </div>

      <QuickStartCard steps={[
        'วางข้อความในช่อง Input',
        'เลือก Encode หรือ Decode',
        'คัดลอกผลลัพธ์จากฝั่ง Output',
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        {/* Left Side: Input */}
        <div className="space-y-6 flex flex-col">
          <Card className="flex-1 flex flex-col border-border/50 shadow-sm">
            <CardHeader className="shrink-0 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  {mode === 'encode' ? <Unlock className="w-5 h-5 text-amber-500" /> : <Lock className="w-5 h-5 text-primary" />}
                  {mode === 'encode' ? 'Raw Text (Input)' : 'Base64 (Input)'}
                </CardTitle>
                <CardDescription>กรอกข้อความที่ต้องการ{mode === 'encode' ? 'เข้ารหัส' : 'ถอดรหัส'}</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={clearAll} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col space-y-4 pt-0">
              <Textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={mode === 'encode' ? "Enter plain text here..." : "Enter Base64 string here..."}
                className="flex-1 min-h-[300px] font-mono text-sm resize-none focus-visible:ring-primary/20"
              />
              <div className="flex items-center justify-center pt-4 border-t">
                <Button 
                  onClick={toggleMode} 
                  variant="outline" 
                  className="gap-2 px-8 h-12 rounded-full border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all font-semibold"
                >
                  <ArrowLeftRight className="w-4 h-4 text-primary" />
                  Switch to {mode === 'encode' ? 'Decode' : 'Encode'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Output */}
        <div className="space-y-6 flex flex-col">
          <Card className="flex-1 flex flex-col border-border/50 shadow-sm bg-secondary/5">
            <CardHeader className="shrink-0 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  {mode === 'encode' ? <Lock className="w-5 h-5 text-primary" /> : <Unlock className="w-5 h-5 text-amber-500" />}
                  {mode === 'encode' ? 'Base64 (Output)' : 'Plain Text (Output)'}
                </CardTitle>
                <CardDescription>ผลลัพธ์จากการ{mode === 'encode' ? 'เข้ารหัส' : 'ถอดรหัส'}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard} disabled={!output || output.startsWith('Error:')}>
                  {copied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
                  Copy
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col pt-0">
              <div className="flex-1 relative group">
                <Textarea 
                  readOnly
                  value={output}
                  placeholder="Output will appear here..."
                  className={`h-full min-h-[300px] font-mono text-sm resize-none bg-background/50 border-dashed ${output.startsWith('Error:') ? 'text-destructive border-destructive/20' : 'text-primary'}`}
                />
              </div>
              <div className="pt-6 flex items-center justify-between text-xs text-muted-foreground px-1 italic">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  {output ? `${output.length} characters` : 'Ready to process'}
                </div>
                {output && !output.startsWith('Error:') && (
                  <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                    <RefreshCw className="w-3 h-3 animate-spin-slow" />
                    Auto-updated
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
