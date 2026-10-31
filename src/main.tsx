import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { StoreProvider } from './app/store';
import { App } from './app/App';
import { UpdatePrompt } from './app/UpdatePrompt';
import { startTrail } from './app/navTrail';
import './styles/global.css';

const root = document.getElementById('root');
if (!root) throw new Error('Elemento #root em falta');

startTrail();

createRoot(root).render(
  <StrictMode>
    <StoreProvider>
      <App />
      <UpdatePrompt />
    </StoreProvider>
  </StrictMode>,
);
