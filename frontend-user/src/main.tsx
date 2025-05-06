import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
const rootElement = document.getElementById('root')!;
rootElement.style.width = '100%';

createRoot(rootElement).render(
    <StrictMode>
        <App />
    </StrictMode>,
)
