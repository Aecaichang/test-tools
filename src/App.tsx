import { useState } from 'react'
import { LoopApiView } from './features/loop-api/LoopApiView'
import { HomeView } from './features/home/HomeView'
import { MockGeneratorView } from './features/mock-generator/MockGeneratorView'
import { Base64ToolView } from './features/base64-tool/Base64ToolView'
import { JsonToolView } from './features/json-tool/JsonToolView'
import { ExcelToolView } from './features/excel-tool/ExcelToolView'
import { ProductQueryView } from './features/product-query/ProductQueryView'
import { Toaster } from 'sonner'

type View = 'home' | 'loop-api' | 'performance' | 'json-tool' | 'excel-tool' | 'mock-generator' | 'base64-tool' | 'product-query'

function App() {
  const [currentView, setCurrentView] = useState<View>('home')

  const renderView = () => {
    switch (currentView) {
      case 'loop-api':
        return <LoopApiView />
      case 'mock-generator':
        return <MockGeneratorView />
      case 'base64-tool':
        return <Base64ToolView />
      case 'json-tool':
        return <JsonToolView />
      case 'excel-tool':
        return <ExcelToolView />
      case 'product-query':
        return <ProductQueryView />
      case 'home':
        return <HomeView onSelectTool={(id) => {
          if (id === 'json-parser') return setCurrentView('json-tool');
          if (id === 'excel-tool') return setCurrentView('excel-tool');
          return setCurrentView(id as View);
        }} />
      default:
        return (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <h2 className="text-3xl font-bold">Coming Soon</h2>
            <p className="text-muted-foreground">This tool is still under development.</p>
            <button 
              onClick={() => setCurrentView('home')}
              className="px-4 py-2 bg-primary text-white rounded-lg"
            >
              Go Back Home
            </button>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 flex flex-col">
      <Toaster position="top-right" richColors expand={false} />
      <header className="border-b bg-background/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => setCurrentView('home')}
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
        {renderView()}
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
