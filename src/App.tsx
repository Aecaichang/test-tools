import { useNavigate, Routes, Route } from 'react-router-dom'
import { LoopApiView } from './features/loop-api/LoopApiView'
import { HomeView } from './features/home/HomeView'
import { MockGeneratorView } from './features/mock-generator/MockGeneratorView'
import { Base64ToolView } from './features/base64-tool/Base64ToolView'
import { JsonToolView } from './features/json-tool/JsonToolView'
import { ExcelToolView } from './features/excel-tool/ExcelToolView'
import { ProductQueryView } from './features/product-query/ProductQueryView'
import { Button } from '@/components/common/Button'
import { Toaster } from 'sonner'

function App() {
  const navigate = useNavigate()

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/30">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-5rem] top-10 h-52 w-52 rounded-full bg-primary/10 blur-3xl animate-float-slow" />
        <div className="absolute right-[-4rem] top-40 h-52 w-52 rounded-full bg-accent/10 blur-3xl animate-float-slow" />
      </div>
      <Toaster position="top-right" richColors expand={false} />
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="container relative mx-auto flex h-16 items-center justify-between px-4">
          <div 
            className="group flex cursor-pointer items-center gap-2"
            onClick={() => navigate('/')}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
              <span className="text-xl font-bold text-white">T</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">Workspace</p>
              <p className="text-base font-bold">Test Tools Hub</p>
            </div>
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/90">
            Developer Utilities
          </div>
        </div>
      </header>
      
      <main className="relative z-10 flex-1">
        <Routes>
          <Route path="/" element={<HomeView onSelectTool={(id) => {
            if (id === 'json-parser') navigate('/json-tool');
            else if (id === 'excel-tool') navigate('/excel-tool');
            else navigate(`/${id}`);
          }} />} />
          <Route path="/loop-api" element={<LoopApiView />} />
          <Route path="/mock-generator" element={<MockGeneratorView />} />
          <Route path="/base64-tool" element={<Base64ToolView />} />
          <Route path="/json-tool" element={<JsonToolView />} />
          <Route path="/excel-tool" element={<ExcelToolView />} />
          <Route path="/product-query" element={<ProductQueryView />} />
          <Route path="*" element={
            <div className="container mx-auto flex flex-col items-center justify-center space-y-4 px-4 py-20 text-center">
              <h2 className="text-3xl font-bold">Coming Soon</h2>
              <p className="text-muted-foreground">This tool is still under development.</p>
              <Button
                onClick={() => navigate('/')}
                className="h-11 px-6"
              >
                Go Back Home
              </Button>
            </div>
          } />
        </Routes>
      </main>
      
      <footer className="relative z-10 mt-auto border-t border-border/70 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 Test Tools Hub. Built for testers and developers.</p>
        </div>
      </footer>
    </div>
  )
}

export default App
