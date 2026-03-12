import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Play, Zap, FileJson, ArrowRight, Database, Link, FileSpreadsheet } from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  status: 'ready' | 'coming_soon';
}

interface HomeViewProps {
  onSelectTool: (toolId: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onSelectTool }) => {
  const tools: Tool[] = [
    {
      id: 'loop-api',
      name: 'Loop API Tester',
      description: 'ยิง Loop API เพื่อสร้างข้อมูลทดสอบด้วยการ Config payload ได้ตามต้องการ พร้อมระบบประวัติ',
      icon: <Play className="w-8 h-8" />,
      color: 'bg-blue-500',
      status: 'ready'
    },
    {
      id: 'mock-generator',
      name: 'Mock Data Generator',
      description: 'เครื่องมือสร้างข้อมูลจำลอง (เช่น ชื่อ, ที่อยู่, เบอร์โทร, เลขบัตรประชาชน) ในรูปแบบ JSON หรือ CSV เพื่อเอาไปใช้ยิง API ต่อ',
      icon: <Database className="w-8 h-8" />,
      color: 'bg-indigo-500',
      status: 'ready'
    },
    {
      id: 'base64-tool',
      name: 'Base64 Encoder/Decoder',
      description: 'เข้ารหัสและถอดรหัสข้อความเป็นรูปแบบ Base64 อย่างรวดเร็ว รองรับข้อความภาษาไทย',
      icon: <Link className="w-8 h-8" />,
      color: 'bg-rose-500',
      status: 'ready'
    },
    {
      id: 'performance',
      name: 'Performance Test',
      description: 'ทดสอบประสิทธิภาพของ API ด้วยการจำลองการโหลดรันจากผู้ใช้จำนวนมาก',
      icon: <Zap className="w-8 h-8" />,
      color: 'bg-amber-500',
      status: 'coming_soon'
    },
    {
      id: 'json-parser',
      name: 'JSON Utilities',
      description: 'เครื่องมือจัดรูปแบบ (Formatter), ย่อขนาด (Minify) และเปรียบเทียบความแตกต่าง (Diff) ของ JSON',
      icon: <FileJson className="w-8 h-8" />,
      color: 'bg-emerald-500',
      status: 'ready'
    },
    {
      id: 'excel-tool',
      name: 'Excel Viewer',
      description: 'ตัวช่วยอ่านไฟล์ Excel และ CSV พร้อมระบบค้นหาข้อมูล และแปลงเป็น JSON ได้ทันที',
      icon: <FileSpreadsheet className="w-8 h-8" />,
      color: 'bg-emerald-600',
      status: 'ready'
    }
  ];

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-12 max-w-6xl animate-in fade-in duration-700">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="text-5xl font-extrabold tracking-tight text-foreground">
          Welcome to <span className="text-primary">Test Tools Hub</span>
        </h1>
        <p className="text-xl text-muted-foreground">
          รวมเครื่องมืออเนกประสงค์สำหรับช่วยเหลือนักพัฒนาและ Tester เพื่อให้การทำงานง่ายและรวดเร็วยิ่งขึ้น
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {tools.map((tool) => (
          <Card 
            key={tool.id} 
            className="group relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-border/50 bg-background/50 backdrop-blur-sm"
          >
            <div className={`h-2 w-full ${tool.color} opacity-80`} />
            <CardHeader className="pb-4">
              <div className={`w-14 h-14 rounded-2xl ${tool.color} flex items-center justify-center text-white mb-4 shadow-lg shadow-black/10 transition-transform group-hover:scale-110 duration-300`}>
                {tool.icon}
              </div>
              <CardTitle className="text-2xl">{tool.name}</CardTitle>
              <CardDescription className="text-base line-clamp-2">
                {tool.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tool.status === 'ready' ? (
                <Button 
                  onClick={() => onSelectTool(tool.id)}
                  className="w-full h-11 group/btn"
                >
                  เปิดใช้งาน
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
                </Button>
              ) : (
                <Button 
                  disabled 
                  variant="secondary"
                  className="w-full h-11"
                >
                  เร็วๆ นี้
                </Button>
              )}
            </CardContent>
            
            {/* Subtle light effect */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </Card>
        ))}
      </div>
    </div>
  );
};
