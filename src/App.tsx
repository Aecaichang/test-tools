import { useNavigate, Routes, Route } from 'react-router-dom'
import { LoopApiView } from './features/loop-api/LoopApiView'
import { HomeView } from './features/home/HomeView'
import { MockGeneratorView } from './features/mock-generator/MockGeneratorView'
import { Base64ToolView } from './features/base64-tool/Base64ToolView'
import { JsonToolView } from './features/json-tool/JsonToolView'
import { ExcelToolView } from './features/excel-tool/ExcelToolView'
import { ProductQueryView } from './features/product-query/ProductQueryView'
import { Toaster } from 'sonner'

function App() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 flex flex-col">
      <Toaster position="top-right" richColors expand={false} />
      <header className="border-b bg-background/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => navigate('/')}
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <span className="font-bold text-xl hidden sm:inline-block">Test Tools Hub</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium uppercase tracking-widest opacity-50">
            Developer Utilities
          </div>
        </div>
      </header>
      
      <main className="flex-1">
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
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <h2 className="text-3xl font-bold">Coming Soon</h2>
              <p className="text-muted-foreground">This tool is still under development.</p>
              <button 
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-primary text-white rounded-lg"
              >
                Go Back Home
              </button>
            </div>
          } />
        </Routes>
      </main>
      
      <footer className="py-12 border-t mt-auto">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>© 2026 Test Tools Hub. Built for testers and developers.</p>
        </div>
      </footer>
    </div>
  )
}

export default App
