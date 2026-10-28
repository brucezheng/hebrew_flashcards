import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/noto-serif-hebrew/hebrew-400.css';
import '@fontsource/noto-serif-hebrew/hebrew-600.css';
import './styles.css';
import { App } from './App';
import { speaker } from './audio/speaker';

speaker.init();
if (import.meta.env.DEV) (window as unknown as { __speaker: typeof speaker }).__speaker = speaker;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
