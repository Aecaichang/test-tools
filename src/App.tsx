import { LoopApiView } from './features/loop-api/LoopApiView'

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <header className="border-b bg-background/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <span className="font-bold text-xl hidden sm:inline-block">Test Tools Hub</span>
          </div>
          <nav className="flex items-center gap-6">
            <a href="#" className="text-sm font-medium text-primary border-b-2 border-primary pb-1">Loop API</a>
            <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Performance</a>
            <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">JSON Parser</a>
          </nav>
        </div>
      </header>
      
      <main>
        <LoopApiView />
      </main>
      
      <footer className="py-12 border-t mt-20">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>© 2026 Test Tools Hub. Built for testers and developers.</p>
        </div>
      </footer>
    </div>
  )
}

export default App
