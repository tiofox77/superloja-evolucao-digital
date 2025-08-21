// Force rebuild to clear cached componentTagger assets
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('main.tsx: Starting app initialization');
console.log('main.tsx: React available:', typeof createRoot);
createRoot(document.getElementById("root")!).render(<App />);
