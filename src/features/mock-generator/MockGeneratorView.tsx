import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/common/Card';
import { QuickStartCard } from '@/components/common/QuickStartCard';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Badge } from '@/components/common/Badge';
import { 
  Database, 
  Plus, 
  Trash2, 
  Download, 
  Copy, 
  Check, 
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { Select, type SelectOption } from '@/components/common/Select';

interface FieldDefinition {
  id: string;
  name: string;
  type: 'name' | 'phone' | 'email' | 'id_card' | 'address' | 'number' | 'custom';
  customValue?: string;
}

const FIELD_TYPE_OPTIONS: SelectOption[] = [
  { value: "name", label: "Full Name" },
  { value: "phone", label: "Phone Number" },
  { value: "email", label: "Email Address" },
  { value: "id_card", label: "Thai ID Card" },
  { value: "address", label: "Address" },
  { value: "number", label: "Random Number" },
];

export const MockGeneratorView: React.FC = () => {
  const [fields, setFields] = useState<FieldDefinition[]>([
    { id: '1', name: 'firstName', type: 'name' },
    { id: '2', name: 'mobile', type: 'phone' },
    { id: '3', name: 'citizenId', type: 'id_card' }
  ]);
  const [count, setCount] = useState(10);
  const [countError, setCountError] = useState<string | null>(null);
  const [generatedData, setGeneratedData] = useState<Record<string, string | number>[]>([]);
  const [format, setFormat] = useState<'json' | 'csv'>('json');
  const [copied, setCopied] = useState(false);

  const addField = () => {
    const newId = Math.random().toString(36).substring(7);
    setFields([...fields, { id: newId, name: `field_${newId}`, type: 'name' }]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const updateField = (id: string, updates: Partial<FieldDefinition>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const generateMockValue = (type: string): string | number => {
    switch (type) {
      case 'name': {
        const names = ['สมชาย', 'สมหญิง', 'วิชัย', 'รุ่งเรือง', 'กานดา', 'มณี'];
        const lastNames = ['ใจดี', 'รักสงบ', 'รักชาติ', 'มีทรัพย์', 'แสงสว่าง'];
        return `${names[Math.floor(Math.random() * names.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
      }
      case 'phone':
        return `09${Math.floor(Math.random() * 90000000 + 10000000)}`;
      case 'email':
        return `user_${Math.random().toString(36).substring(7)}@example.com`;
      case 'id_card': {
        let citizen = '';
        for(let i=0; i<13; i++) citizen += Math.floor(Math.random() * 10);
        return citizen;
      }
      case 'address':
        return `${Math.floor(Math.random() * 500)}/${Math.floor(Math.random() * 100)} ถ.สุขุมวิท กรุงเทพฯ`;
      case 'number':
        return Math.floor(Math.random() * 10000);
      default:
        return 'custom_value';
    }
  };

  const handleGenerate = () => {
    const data = Array.from({ length: count }).map(() => {
      const item: Record<string, string | number> = {};
      fields.forEach(f => {
        item[f.name] = generateMockValue(f.type);
      });
      return item;
    });
    setGeneratedData(data);
    toast.success(`Generated ${count} records`);
  };

  const copyToClipboard = () => {
    const text = format === 'json' 
      ? JSON.stringify(generatedData, null, 2)
      : convertToCSV(generatedData);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };

  const convertToCSV = (data: Record<string, string | number>[]) => {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const lines = [
      headers.join(','),
      ...data.map(item => headers.map(h => `"${item[h]}"`).join(','))
    ];
    return lines.join('\n');
  };

  const downloadFile = () => {
    const content = format === 'json' 
      ? JSON.stringify(generatedData, null, 2)
      : convertToCSV(generatedData);
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mock_data_${Date.now()}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 max-w-6xl animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Mock Data Generator
          </h1>
          <p className="text-muted-foreground font-medium">สร้างข้อมูลจำลองเพื่อนำไปใช้งานทดสอบระบบ</p>
        </div>
      </div>

      <QuickStartCard steps={[
        'เพิ่ม/แก้ฟิลด์ที่ต้องการใน Schema',
        'ตั้งจำนวน Record Count',
        'กด Generate แล้ว Copy หรือ Download',
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        {/* Left Side: Config */}
        <div className="space-y-6 flex flex-col">
          <Card className="flex-1 flex flex-col border-border/50">
            <CardHeader className="shrink-0">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Database className="w-5 h-5 text-primary" />
                Schema Definition
              </CardTitle>
              <CardDescription>กำหนดฟิลด์ที่ต้องการสร้าง</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
              <div className="space-y-3">
                {fields.map((field) => (
                  <div key={field.id} className="flex gap-3 items-center group animate-in slide-in-from-left-2 transition-all">
                    <Input 
                      value={field.name}
                      onChange={(e) => updateField(field.id, { name: e.target.value })}
                      placeholder="Field Name"
                      className="flex-1 h-10"
                    />
                    <Select
                      value={field.type}
                      onChange={(val) => updateField(field.id, { type: val as FieldDefinition['type'] })}
                      options={FIELD_TYPE_OPTIONS}
                      className="h-10 w-40"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeField(field.id)}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button 
                variant="outline" 
                onClick={addField}
                className="w-full border-dashed"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Field
              </Button>

              <div className="pt-6 border-t mt-auto space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-1.5 block">Record Count</label>
                    <Input 
                      type="number"
                      value={count}
                      min={1}
                      max={500}
                      onChange={(e) => {
                        const val = parseInt(e.target.value)
                        if (isNaN(val) || val < 1) {
                          setCountError('Must be at least 1')
                          setCount(1)
                        } else if (val > 500) {
                          setCountError('Maximum is 500')
                          setCount(500)
                        } else {
                          setCountError(null)
                          setCount(val)
                        }
                      }}
                      className="h-10"
                    />
                    {countError && <p className="mt-1 text-xs text-destructive">{countError}</p>}
                  </div>
                  <Button 
                    onClick={handleGenerate} 
                    className="flex-1 mt-6 h-10 glow-card"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Generate Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Results */}
        <div className="space-y-6 flex flex-col">
          <Card className="h-full flex flex-col border-border/50">
            <CardHeader className="flex flex-row items-center justify-between shrink-0">
              <div className="space-y-1">
                <CardTitle className="text-xl">Generated Preview</CardTitle>
                <div className="flex gap-2">
                  <Badge 
                    variant={format === 'json' ? 'success' : 'secondary'} 
                    className="cursor-pointer"
                    onClick={() => setFormat('json')}
                  >
                    JSON
                  </Badge>
                  <Badge 
                    variant={format === 'csv' ? 'success' : 'secondary'} 
                    className="cursor-pointer"
                    onClick={() => setFormat('csv')}
                  >
                    CSV
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard} disabled={generatedData.length === 0}>
                  {copied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={downloadFile} disabled={generatedData.length === 0}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden relative">
              {generatedData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-10 space-y-4">
                  <div className="w-20 h-20 rounded-full bg-secondary/30 flex items-center justify-center">
                    <Database className="w-10 h-10 text-primary/30" />
                  </div>
                  <p className="text-sm">กำหนด Schema และกด Generate เพื่อดูผลลัพธ์</p>
                </div>
              ) : (
                <div className="h-full">
                  <pre className="p-6 font-mono text-xs overflow-auto h-full max-h-[600px] bg-secondary/10 custom-scrollbar">
                    {format === 'json' 
                      ? JSON.stringify(generatedData, null, 2)
                      : convertToCSV(generatedData)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
